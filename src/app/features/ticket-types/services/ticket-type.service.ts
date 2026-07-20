import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MockApiService, ApiError } from '../../../core/services/mock-api.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { TicketType } from '../models/ticket-type.model';
import { PagedResult } from '../../../core/models/base-entity.model';
import { AuditActionType } from '../../../core/models/enums';
import { EventService } from '../../events/services/event.service';

const COLLECTION = 'ticket-types';

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  constructor(
    private api: MockApiService<TicketType>,
    private audit: AuditLogService,
    private eventService: EventService
  ) {}

  list(page: number, pageSize: number, search?: string, eventId?: string): Observable<PagedResult<TicketType>> {
    return this.api.list(COLLECTION, { page, pageSize, search, sortField: 'name', sortDir: 'asc' }).pipe(
      map((result) => {
        let items = result.items.filter((t) => t.isActive);
        if (eventId) items = items.filter((t) => t.eventId === eventId);
        return { ...result, items, total: eventId ? items.length : result.total };
      })
    );
  }

  getById(id: string): Observable<TicketType> {
    return this.api.getById(COLLECTION, id);
  }

  byEventSync(eventId: string): TicketType[] {
    return this.api.allSync(COLLECTION).filter((t) => t.eventId === eventId && t.isActive);
  }

  /** Kritik iş kuralı #2: bilet tipi kontenjanları toplamı, etkinliğin toplam kapasitesini aşamaz. */
  private validateQuota(eventId: string, newQuota: number, excludeId?: string): string | null {
    const rule = this.eventService.getCapacityRuleSync(eventId);
    if (!rule) return null;
    const otherQuotas = this.byEventSync(eventId)
      .filter((t) => t.id !== excludeId)
      .reduce((sum, t) => sum + t.allocatedQuota, 0);
    const totalIfSaved = otherQuotas + newQuota;
    if (totalIfSaved > rule.totalCapacity) {
      return `Bilet tipi kontenjanları toplamı (${totalIfSaved}), etkinlik toplam kapasitesini (${rule.totalCapacity}) aşıyor.`;
    }
    return null;
  }

  create(input: Omit<TicketType, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>): Observable<TicketType> {
    const error = this.validateQuota(input.eventId, input.allocatedQuota);
    if (error) return throwError(() => new ApiError(error, 'VALIDATION'));

    const now = new Date().toISOString();
    const ticketType: TicketType = { ...input, id: crypto.randomUUID(), isActive: true, createdAt: now, updatedAt: now };
    return this.api.create(COLLECTION, ticketType).pipe(
      tap((created) =>
        this.audit.record({
          actionType: AuditActionType.CREATE,
          entityType: 'TicketType',
          entityId: created.id,
          entityLabel: created.name,
          description: `"${created.name}" bilet tipi oluşturuldu (kontenjan: ${created.allocatedQuota}, fiyat: ${created.price}₺).`,
        })
      )
    );
  }

  update(id: string, patch: Partial<TicketType>, previous: TicketType): Observable<TicketType> {
    // Kritik iş kuralı #3: başlamış etkinlik için bilet tipi fiyatı değiştirilemez.
    if (patch.price != null && patch.price !== previous.price) {
      const event = this.eventService.allActiveSync().find((e) => e.id === previous.eventId);
      if (event && this.eventService.isEventStarted(event)) {
        return throwError(
          () => new ApiError('Başlamış veya tamamlanmış etkinlik için bilet fiyatı değiştirilemez.', 'VALIDATION')
        );
      }
    }

    if (patch.allocatedQuota != null && patch.allocatedQuota !== previous.allocatedQuota) {
      const error = this.validateQuota(previous.eventId, patch.allocatedQuota, id);
      if (error) return throwError(() => new ApiError(error, 'VALIDATION'));
    }

    return this.api.update(COLLECTION, id, patch).pipe(
      tap((updated) => {
        if (patch.price != null && patch.price !== previous.price) {
          this.audit.record({
            actionType: AuditActionType.PRICE_CHANGE,
            entityType: 'TicketType',
            entityId: id,
            entityLabel: updated.name,
            description: `"${updated.name}" bilet tipi fiyatı değiştirildi.`,
            oldValue: previous.price,
            newValue: updated.price,
          });
        }
        if (patch.allocatedQuota != null && patch.allocatedQuota !== previous.allocatedQuota) {
          this.audit.record({
            actionType: AuditActionType.CAPACITY_CHANGE,
            entityType: 'TicketType',
            entityId: id,
            entityLabel: updated.name,
            description: `"${updated.name}" bilet tipi kontenjanı değiştirildi.`,
            oldValue: previous.allocatedQuota,
            newValue: updated.allocatedQuota,
          });
        }
        if (!patch.price && !patch.allocatedQuota) {
          this.audit.record({
            actionType: AuditActionType.UPDATE,
            entityType: 'TicketType',
            entityId: id,
            entityLabel: updated.name,
            description: `"${updated.name}" bilet tipi güncellendi.`,
          });
        }
      })
    );
  }

  softDelete(ticketType: TicketType): Observable<TicketType> {
    return this.api.update(COLLECTION, ticketType.id, { isActive: false }).pipe(
      tap(() =>
        this.audit.record({
          actionType: AuditActionType.DELETE,
          entityType: 'TicketType',
          entityId: ticketType.id,
          entityLabel: ticketType.name,
          description: `"${ticketType.name}" bilet tipi pasife alındı.`,
        })
      )
    );
  }

  /** Bilet tipi için satılan (iptal/iade hariç) adet sayısı - kalan kontenjan hesaplamak için kullanılır. */
  soldQuantitySync(ticketTypeId: string, reservationsSync: { ticketTypeId: string; quantity: number; status: string }[]): number {
    return reservationsSync
      .filter((r) => r.ticketTypeId === ticketTypeId && ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(r.status))
      .reduce((sum, r) => sum + r.quantity, 0);
  }
}
