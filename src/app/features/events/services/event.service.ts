import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { MockApiService, ApiError } from '../../../core/services/mock-api.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { EventEntity, CapacityRule } from '../models/event.model';
import { PagedResult } from '../../../core/models/base-entity.model';
import { AuditActionType, EventStatus, EVENT_STATUS_TRANSITIONS, EVENT_STATUS_LABELS } from '../../../core/models/enums';
import { VenueService } from '../../venues/services/venue.service';

const COLLECTION = 'events';
const CAPACITY_COLLECTION = 'capacity-rules';

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(
    private api: MockApiService<EventEntity>,
    private capacityApi: MockApiService<CapacityRule>,
    private audit: AuditLogService,
    private venueService: VenueService
  ) {}

  list(
    page: number,
    pageSize: number,
    search?: string,
    sortField = 'startDate',
    sortDir: 'asc' | 'desc' = 'desc',
    statusFilter?: EventStatus
  ): Observable<PagedResult<EventEntity>> {
    return this.api.list(COLLECTION, { page, pageSize, search, sortField, sortDir }).pipe(
      map((result) => {
        let items = result.items.filter((e) => !e.isDeleted);
        if (statusFilter) items = items.filter((e) => e.status === statusFilter);
        return { ...result, items, total: statusFilter ? items.length : result.total };
      })
    );
  }

  getById(id: string): Observable<EventEntity> {
    return this.api.getById(COLLECTION, id);
  }

  getCapacityRule(eventId: string): Observable<CapacityRule | undefined> {
    return of(this.capacityApi.allSync(CAPACITY_COLLECTION).find((r) => r.eventId === eventId));
  }

  getCapacityRuleSync(eventId: string): CapacityRule | undefined {
    return this.capacityApi.allSync(CAPACITY_COLLECTION).find((r) => r.eventId === eventId);
  }

  /** Yeni etkinlik + kapasite kuralı birlikte oluşturulur. */
  create(
    input: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'status'>,
    totalCapacity: number
  ): Observable<EventEntity> {
    const venue = this.venueService.allActiveSync().find((v) => v.id === input.venueId);
    if (venue && totalCapacity > venue.totalCapacity) {
      return throwError(
        () => new ApiError(`Kontenjan, mekan kapasitesini (${venue.totalCapacity}) aşamaz.`, 'VALIDATION')
      );
    }

    const now = new Date().toISOString();
    const event: EventEntity = {
      ...input,
      id: crypto.randomUUID(),
      status: EventStatus.DRAFT,
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    };

    return this.api.create(COLLECTION, event).pipe(
      switchMap((created) => {
        const rule: CapacityRule = {
          id: crypto.randomUUID(),
          eventId: created.id,
          totalCapacity,
          createdAt: now,
          updatedAt: now,
        };
        return this.capacityApi.create(CAPACITY_COLLECTION, rule).pipe(map(() => created));
      }),
      tap((created) =>
        this.audit.record({
          actionType: AuditActionType.CREATE,
          entityType: 'Event',
          entityId: created.id,
          entityLabel: created.title,
          description: `"${created.title}" etkinliği oluşturuldu (kontenjan: ${totalCapacity}).`,
        })
      )
    );
  }

  update(
    id: string,
    patch: Partial<EventEntity>,
    previous: EventEntity,
    newTotalCapacity?: number
  ): Observable<EventEntity> {
    const capacityRule = this.getCapacityRuleSync(id);

    const applyUpdate = () =>
      this.api.update(COLLECTION, id, patch).pipe(
        tap((updated) =>
          this.audit.record({
            actionType: AuditActionType.UPDATE,
            entityType: 'Event',
            entityId: id,
            entityLabel: updated.title,
            description: `"${updated.title}" etkinliği güncellendi.`,
            oldValue: { title: previous.title, startDate: previous.startDate },
            newValue: { title: updated.title, startDate: updated.startDate },
          })
        )
      );

    if (newTotalCapacity == null || !capacityRule) {
      return applyUpdate();
    }

    const venue = this.venueService.allActiveSync().find((v) => v.id === (patch.venueId ?? previous.venueId));
    if (venue && newTotalCapacity > venue.totalCapacity) {
      return throwError(
        () => new ApiError(`Kontenjan, mekan kapasitesini (${venue.totalCapacity}) aşamaz.`, 'VALIDATION')
      );
    }

    return applyUpdate().pipe(
      switchMap((updated) =>
        this.capacityApi
          .update(CAPACITY_COLLECTION, capacityRule.id, { totalCapacity: newTotalCapacity })
          .pipe(
            tap(() =>
              this.audit.record({
                actionType: AuditActionType.CAPACITY_CHANGE,
                entityType: 'Event',
                entityId: id,
                entityLabel: updated.title,
                description: `"${updated.title}" etkinliğinin toplam kontenjanı değiştirildi.`,
                oldValue: capacityRule.totalCapacity,
                newValue: newTotalCapacity,
              })
            ),
            map(() => updated)
          )
      )
    );
  }

  /** Kritik iş kuralı: durum geçişleri tanımlı kurallara bağlıdır, rastgele geçişe izin verilmez. */
  changeStatus(event: EventEntity, newStatus: EventStatus): Observable<EventEntity> {
    const allowed = EVENT_STATUS_TRANSITIONS[event.status];
    if (!allowed.includes(newStatus)) {
      return throwError(
        () =>
          new ApiError(
            `"${EVENT_STATUS_LABELS[event.status]}" durumundan "${EVENT_STATUS_LABELS[newStatus]}" durumuna geçiş yapılamaz.`,
            'INVALID_TRANSITION'
          )
      );
    }

    return this.api.update(COLLECTION, event.id, { status: newStatus }).pipe(
      tap((updated) =>
        this.audit.record({
          actionType: AuditActionType.STATUS_CHANGE,
          entityType: 'Event',
          entityId: event.id,
          entityLabel: event.title,
          description: `"${event.title}" etkinliğinin durumu değiştirildi.`,
          oldValue: EVENT_STATUS_LABELS[event.status],
          newValue: EVENT_STATUS_LABELS[newStatus],
        })
      )
    );
  }

  softDelete(event: EventEntity): Observable<EventEntity> {
    return this.api.update(COLLECTION, event.id, { isDeleted: true }).pipe(
      tap(() =>
        this.audit.record({
          actionType: AuditActionType.DELETE,
          entityType: 'Event',
          entityId: event.id,
          entityLabel: event.title,
          description: `"${event.title}" etkinliği silindi (soft delete).`,
        })
      )
    );
  }

  allActiveSync(): EventEntity[] {
    return this.api.allSync(COLLECTION).filter((e) => !e.isDeleted);
  }

  /** Etkinliğin, kapasitesi henüz başlamışsa fiyat değişikliğine izin verilmez (iş kuralı #3 - ticket-type.service içinde de kontrol edilir). */
  isEventStarted(event: EventEntity): boolean {
    return [EventStatus.ONGOING, EventStatus.COMPLETED].includes(event.status);
  }
}
