import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { MockApiService, ApiError } from '../../../core/services/mock-api.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuthService } from '../../../core/services/auth.service';
import { CheckInRecord } from '../check-in-record.model';
import { Reservation } from '../../reservations/models/reservation.model';
import { AuditActionType, ReservationStatus } from '../../../core/models/enums';
import { ReservationService } from '../../reservations/services/reservation.service';

const COLLECTION = 'check-in-records';

@Injectable({ providedIn: 'root' })
export class CheckInService {
  constructor(
    private api: MockApiService<CheckInRecord>,
    private reservationApi: MockApiService<Reservation>,
    private audit: AuditLogService,
    private auth: AuthService,
    private reservationService: ReservationService
  ) {}

  /**
   * Manuel bilet kodu ile check-in simülasyonu (QR yerine).
   * Kritik iş kuralı #6: check-in sadece onaylı (CONFIRMED) rezervasyon için yapılabilir.
   * Kritik iş kuralı #5: aynı bilet kodu ile ikinci kez check-in yapılamaz.
   */
  checkInByCode(code: string): Observable<{ reservation: Reservation; record: CheckInRecord }> {
    return of(null).pipe(
      delay(300 + Math.random() * 300),
      mergeMap(() => {
        const normalized = code.trim().toUpperCase();
        const reservation = this.reservationService.allSync().find((r) => r.reservationCode === normalized);

        if (!reservation) {
          return throwError(() => new ApiError('Bu koda ait rezervasyon bulunamadı.', 'NOT_FOUND'));
        }

        const alreadyChecked = this.api.allSync(COLLECTION).some((r) => r.ticketCode === normalized);
        if (alreadyChecked || reservation.status === ReservationStatus.CHECKED_IN) {
          return throwError(() => new ApiError('Bu bilet kodu ile daha önce check-in yapılmış.', 'DUPLICATE'));
        }

        if (reservation.status !== ReservationStatus.CONFIRMED) {
          return throwError(
            () => new ApiError('Check-in yalnızca onaylanmış rezervasyonlar için yapılabilir.', 'VALIDATION')
          );
        }

        const user = this.auth.currentUser();
        const now = new Date().toISOString();

        const record: CheckInRecord = {
          id: crypto.randomUUID(),
          reservationId: reservation.id,
          ticketCode: normalized,
          checkedInByRole: user.role,
          checkedInByName: user.name,
          checkedInAt: now,
          createdAt: now,
          updatedAt: now,
        };

        const allRecords = this.api.allSync(COLLECTION);
        this.api.saveAllSync(COLLECTION, [...allRecords, record]);

        const allReservations = this.reservationApi.allSync('reservations');
        const idx = allReservations.findIndex((r) => r.id === reservation.id);
        const updatedReservation: Reservation = {
          ...reservation,
          status: ReservationStatus.CHECKED_IN,
          checkedInAt: now,
          updatedAt: now,
        };
        allReservations[idx] = updatedReservation;
        this.reservationApi.saveAllSync('reservations', allReservations);

        this.audit.record({
          actionType: AuditActionType.CHECK_IN,
          entityType: 'Reservation',
          entityId: reservation.id,
          entityLabel: reservation.reservationCode,
          description: `${reservation.reservationCode} kodlu bilet ile check-in yapıldı.`,
        });

        return of({ reservation: updatedReservation, record });
      })
    );
  }

  allRecordsSync(): CheckInRecord[] {
    return this.api.allSync(COLLECTION);
  }

  recordsForReservation(reservationId: string): CheckInRecord[] {
    return this.allRecordsSync().filter((r) => r.reservationId === reservationId);
  }
}
