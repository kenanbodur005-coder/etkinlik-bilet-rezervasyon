import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MockApiService, ApiError } from '../../../core/services/mock-api.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { Reservation } from '../models/reservation.model';
import { CancellationRequest } from '../models/cancellation-request.model';
import { PagedResult } from '../../../core/models/base-entity.model';
import {
  AuditActionType,
  CancellationReason,
  ReservationStatus,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_TRANSITIONS,
} from '../../../core/models/enums';
import { EventService } from '../../events/services/event.service';
import { TicketTypeService } from '../../ticket-types/services/ticket-type.service';

const COLLECTION = 'reservations';
const CANCELLATION_COLLECTION = 'cancellation-requests';

export interface CreateReservationInput {
  eventId: string;
  ticketTypeId: string;
  attendeeId: string;
  quantity: number;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  constructor(
    private api: MockApiService<Reservation>,
    private cancellationApi: MockApiService<CancellationRequest>,
    private audit: AuditLogService,
    private auth: AuthService,
    private eventService: EventService,
    private ticketTypeService: TicketTypeService
  ) {}

  list(
    page: number,
    pageSize: number,
    search?: string,
    sortField = 'createdAt',
    sortDir: 'asc' | 'desc' = 'desc',
    statusFilter?: ReservationStatus,
    eventFilter?: string
  ): Observable<PagedResult<Reservation>> {
    return this.api.list(COLLECTION, { page, pageSize, search, sortField, sortDir }).pipe(
      map((result) => {
        let items = result.items;
        if (statusFilter) items = items.filter((r) => r.status === statusFilter);
        if (eventFilter) items = items.filter((r) => r.eventId === eventFilter);
        const filtered = statusFilter || eventFilter;
        return { ...result, items, total: filtered ? items.length : result.total };
      })
    );
  }

  getById(id: string): Observable<Reservation> {
    return this.api.getById(COLLECTION, id);
  }

  allSync(): Reservation[] {
    return this.api.allSync(COLLECTION);
  }

  byEventSync(eventId: string): Reservation[] {
    return this.allSync().filter((r) => r.eventId === eventId);
  }

  /** Rezervasyon ekranında canlı gösterilecek: etkinlik + bilet tipi seçimine göre kalan kontenjan. */
  remainingQuota(eventId: string, ticketTypeId: string): number {
    const ticketType = this.ticketTypeService.byEventSync(eventId).find((t) => t.id === ticketTypeId);
    if (!ticketType) return 0;
    const sold = this.ticketTypeService.soldQuantitySync(ticketTypeId, this.allSync());
    return Math.max(0, ticketType.allocatedQuota - sold);
  }

  /** Etkinlik geneli kalan kontenjan (mekan/etkinlik toplam kapasitesine göre). */
  remainingEventCapacity(eventId: string): number {
    const rule = this.eventService.getCapacityRuleSync(eventId);
    if (!rule) return 0;
    const activeCount = this.byEventSync(eventId)
      .filter((r) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(r.status))
      .reduce((sum, r) => sum + r.quantity, 0);
    return Math.max(0, rule.totalCapacity - activeCount);
  }

  /**
   * Kritik iş kuralı #1: Rezervasyon sayısı mekan/etkinlik kapasitesini aşamaz.
   * Ayrıca bilet tipi bazlı kalan kontenjan da kontrol edilir.
   */
  create(input: CreateReservationInput): Observable<Reservation> {
    const ticketType = this.ticketTypeService.byEventSync(input.eventId).find((t) => t.id === input.ticketTypeId);
    if (!ticketType) {
      return throwError(() => new ApiError('Bilet tipi bulunamadı.', 'NOT_FOUND'));
    }

    const remainingForType = this.remainingQuota(input.eventId, input.ticketTypeId);
    if (input.quantity > remainingForType) {
      return throwError(
        () => new ApiError(`Bu bilet tipi için kalan kontenjan yalnızca ${remainingForType}.`, 'VALIDATION')
      );
    }

    const remainingEvent = this.remainingEventCapacity(input.eventId);
    if (input.quantity > remainingEvent) {
      return throwError(
        () => new ApiError(`Etkinlik kalan kapasitesi yalnızca ${remainingEvent}.`, 'VALIDATION')
      );
    }

    const now = new Date().toISOString();
    const reservation: Reservation = {
      id: crypto.randomUUID(),
      reservationCode: this.generateCode(),
      eventId: input.eventId,
      ticketTypeId: input.ticketTypeId,
      attendeeId: input.attendeeId,
      quantity: input.quantity,
      unitPrice: ticketType.price,
      totalPrice: ticketType.price * input.quantity,
      status: ReservationStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    };

    return this.api.create(COLLECTION, reservation).pipe(
      tap((created) =>
        this.audit.record({
          actionType: AuditActionType.CREATE,
          entityType: 'Reservation',
          entityId: created.id,
          entityLabel: created.reservationCode,
          description: `${created.reservationCode} kodlu rezervasyon oluşturuldu (${created.quantity} adet).`,
        })
      )
    );
  }

  /** Durum geçişleri tanımlı kurallara bağlıdır; rastgele değişime izin verilmez. */
  changeStatus(reservation: Reservation, newStatus: ReservationStatus): Observable<Reservation> {
    const allowed = RESERVATION_STATUS_TRANSITIONS[reservation.status];
    if (!allowed.includes(newStatus)) {
      return throwError(
        () =>
          new ApiError(
            `"${RESERVATION_STATUS_LABELS[reservation.status]}" durumundan "${RESERVATION_STATUS_LABELS[newStatus]}" durumuna geçiş yapılamaz.`,
            'INVALID_TRANSITION'
          )
      );
    }

    const patch: Partial<Reservation> = { status: newStatus };
    if (newStatus === ReservationStatus.CONFIRMED) patch.confirmedAt = new Date().toISOString();

    return this.api.update(COLLECTION, reservation.id, patch).pipe(
      tap(() =>
        this.audit.record({
          actionType: AuditActionType.STATUS_CHANGE,
          entityType: 'Reservation',
          entityId: reservation.id,
          entityLabel: reservation.reservationCode,
          description: `${reservation.reservationCode} kodlu rezervasyonun durumu değiştirildi.`,
          oldValue: RESERVATION_STATUS_LABELS[reservation.status],
          newValue: RESERVATION_STATUS_LABELS[newStatus],
        })
      )
    );
  }

  /**
   * Kritik iş kuralı #4: İptal edilen rezervasyon kontenjanı geri açar
   * (remainingQuota hesaplaması aktif olmayan durumları hariç tuttuğu için
   * otomatik olarak sağlanır). Ayrıca bir CancellationRequest kaydı oluşturur.
   */
  cancel(reservation: Reservation, reason: CancellationReason, note?: string): Observable<Reservation> {
    const allowed = RESERVATION_STATUS_TRANSITIONS[reservation.status];
    if (!allowed.includes(ReservationStatus.CANCELLED)) {
      return throwError(
        () =>
          new ApiError(
            `"${RESERVATION_STATUS_LABELS[reservation.status]}" durumundaki bir rezervasyon iptal edilemez.`,
            'INVALID_TRANSITION'
          )
      );
    }

    const user = this.auth.currentUser();
    const now = new Date().toISOString();

    return this.api.update(COLLECTION, reservation.id, { status: ReservationStatus.CANCELLED, cancelledAt: now }).pipe(
      tap((updated) => {
        const cancellationRecord: CancellationRequest = {
          id: crypto.randomUUID(),
          reservationId: reservation.id,
          reason,
          note,
          refundAmount: reservation.totalPrice,
          processedByRole: user.role,
          processedByName: user.name,
          createdAt: now,
          updatedAt: now,
        };
        const all = this.cancellationApi.allSync(CANCELLATION_COLLECTION);
        this.cancellationApi.saveAllSync(CANCELLATION_COLLECTION, [...all, cancellationRecord]);

        this.audit.record({
          actionType: AuditActionType.CANCELLATION,
          entityType: 'Reservation',
          entityId: reservation.id,
          entityLabel: reservation.reservationCode,
          description: `${reservation.reservationCode} kodlu rezervasyon iptal edildi. Kontenjan geri açıldı.`,
          oldValue: RESERVATION_STATUS_LABELS[reservation.status],
          newValue: RESERVATION_STATUS_LABELS[ReservationStatus.CANCELLED],
        });
      })
    );
  }

  cancellationsForReservation(reservationId: string): CancellationRequest[] {
    return this.cancellationApi.allSync(CANCELLATION_COLLECTION).filter((c) => c.reservationId === reservationId);
  }

  allCancellationsSync(): CancellationRequest[] {
    return this.cancellationApi.allSync(CANCELLATION_COLLECTION);
  }

  private generateCode(): string {
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `RZV-${rand}`;
  }
}
