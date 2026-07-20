import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { AttendeeService } from '../../services/attendee.service';
import { EventService } from '../../../events/services/event.service';
import { TicketTypeService } from '../../../ticket-types/services/ticket-type.service';
import { CheckInService } from '../../../check-in/services/check-in.service';
import { Reservation } from '../../models/reservation.model';
import { Attendee } from '../../models/attendee.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { TrDatePipe } from '../../../../shared/pipes/date-format.pipe';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { LoadingStateComponent, ErrorStateComponent } from '../../../../shared/components/state-and-kpi.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog.component';
import { PermissionDirective } from '../../../../shared/directives/permission.directive';
import {
  ReservationStatus,
  RESERVATION_STATUS_TRANSITIONS,
  RESERVATION_STATUS_LABELS,
  CancellationReason,
  CANCELLATION_REASON_LABELS,
  UserRole,
} from '../../../../core/models/enums';

@Component({
  selector: 'app-reservation-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    MoneyPipe,
    TrDatePipe,
    StatusLabelPipe,
    LoadingStateComponent,
    ErrorStateComponent,
    ConfirmDialogComponent,
    PermissionDirective,
  ],
  template: `
    <app-loading-state *ngIf="loading"></app-loading-state>
    <app-error-state *ngIf="error && !loading" [message]="error" (retryClick)="load()"></app-error-state>

    <ng-container *ngIf="reservation && !loading && !error">
      <div class="page-header">
        <div class="page-header__title">
          <h1>{{ reservation.reservationCode }}</h1>
          <p>{{ eventTitle }} · {{ ticketTypeName }}</p>
        </div>
        <app-status-badge [value]="reservation.status"></app-status-badge>
      </div>

      <div class="kpi-grid">
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600">Adet</div>
          <div style="font-size:22px;font-weight:800">{{ reservation.quantity }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600">Birim Fiyat</div>
          <div style="font-size:22px;font-weight:800">{{ reservation.unitPrice | money }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600">Toplam Tutar</div>
          <div style="font-size:22px;font-weight:800">{{ reservation.totalPrice | money }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600">Oluşturulma</div>
          <div style="font-size:16px;font-weight:700">{{ reservation.createdAt | trDate }}</div>
        </div></div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-body">
          <h2>Katılımcı</h2>
          <p style="margin-bottom:2px"><strong>{{ attendee?.fullName }}</strong></p>
          <p style="margin-bottom:2px;color:var(--color-text-muted)">{{ attendee?.email }}</p>
          <p style="color:var(--color-text-muted)">{{ attendee?.phone }}</p>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px" *appPermission="[UserRole.EVENT_MANAGER, UserRole.BOX_OFFICE_OPERATOR]">
        <div class="card-body">
          <h2>İşlemler</h2>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button
              *ngIf="canTransitionTo(reservationStatusEnum.CONFIRMED)"
              class="btn btn-primary btn-sm"
              (click)="askConfirm()"
            >
              Onayla
            </button>
            <button
              *ngIf="canTransitionTo(reservationStatusEnum.CANCELLED)"
              class="btn btn-danger btn-sm"
              (click)="openCancelForm()"
            >
              İptal Et
            </button>
            <button
              *ngIf="canTransitionTo(reservationStatusEnum.REFUNDED)"
              class="btn btn-secondary btn-sm"
              (click)="askRefund()"
            >
              İade Et
            </button>
            <span
              *ngIf="!canTransitionTo(reservationStatusEnum.CONFIRMED) && !canTransitionTo(reservationStatusEnum.CANCELLED) && !canTransitionTo(reservationStatusEnum.REFUNDED)"
              style="color:var(--color-text-muted);font-size:13px;align-self:center"
            >
              Bu durumdan başka bir işlem tanımlı değil.
            </span>
          </div>

          <form [formGroup]="cancelForm" *ngIf="showCancelForm" (ngSubmit)="confirmCancel()" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)">
            <div class="form-field">
              <label class="required">İptal Nedeni</label>
              <select class="form-control" formControlName="reason">
                <option *ngFor="let r of cancellationReasons" [value]="r">{{ reasonLabels[r] }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Not</label>
              <textarea class="form-control" formControlName="note"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="showCancelForm = false">Vazgeç</button>
              <button type="submit" class="btn btn-danger">İptali Onayla</button>
            </div>
          </form>
        </div>
      </div>

      <div class="card" *ngIf="checkInRecords.length > 0">
        <div class="card-body">
          <h2>Check-in Geçmişi</h2>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Bilet Kodu</th><th>Tarih</th><th>Yapan</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of checkInRecords">
                  <td>{{ c.ticketCode }}</td>
                  <td>{{ c.checkedInAt | trDate }}</td>
                  <td>{{ c.checkedInByName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card" *ngIf="cancellations.length > 0" style="margin-top:24px">
        <div class="card-body">
          <h2>İptal / İade Geçmişi</h2>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th>Neden</th><th>Not</th><th>İade Tutarı</th><th>Tarih</th><th>Yapan</th></tr></thead>
              <tbody>
                <tr *ngFor="let c of cancellations">
                  <td>{{ c.reason | statusLabel }}</td>
                  <td>{{ c.note || '-' }}</td>
                  <td>{{ c.refundAmount | money }}</td>
                  <td>{{ c.createdAt | trDate }}</td>
                  <td>{{ c.processedByName }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ng-container>

    <app-confirm-dialog
      *ngIf="confirmData"
      [data]="confirmData"
      (confirmed)="onConfirmAction()"
      (cancelled)="confirmData = null"
    ></app-confirm-dialog>
  `,
})
export class ReservationDetailPageComponent implements OnInit {
  @Input() id!: string;

  reservation: Reservation | null = null;
  attendee: Attendee | undefined;
  eventTitle = '';
  ticketTypeName = '';
  loading = false;
  error: string | null = null;
  checkInRecords: any[] = [];
  cancellations: any[] = [];

  reservationStatusEnum = ReservationStatus;
  cancellationReasons = Object.values(CancellationReason);
  reasonLabels = CANCELLATION_REASON_LABELS;
  UserRole = UserRole;

  confirmData: ConfirmDialogData | null = null;
  showCancelForm = false;
  private pendingAction: 'confirm' | 'refund' | null = null;

  cancelForm = this.fb.group({
    reason: [CancellationReason.CUSTOMER_REQUEST, Validators.required],
    note: [''],
  });

  constructor(
    private fb: FormBuilder,
    private reservationService: ReservationService,
    private attendeeService: AttendeeService,
    private eventService: EventService,
    private ticketTypeService: TicketTypeService,
    private checkInService: CheckInService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.reservationService.getById(this.id).subscribe({
      next: (reservation) => {
        this.reservation = reservation;
        this.attendee = this.attendeeService.getByIdSync(reservation.attendeeId);
        this.eventTitle = this.eventService.allActiveSync().find((e) => e.id === reservation.eventId)?.title ?? '-';
        this.ticketTypeName = this.ticketTypeService.byEventSync(reservation.eventId).find((t) => t.id === reservation.ticketTypeId)?.name ?? '-';
        this.checkInRecords = this.checkInService.recordsForReservation(reservation.id);
        this.cancellations = this.reservationService.cancellationsForReservation(reservation.id);
        this.loading = false;
      },
      error: () => {
        this.error = 'Rezervasyon bulunamadı.';
        this.loading = false;
      },
    });
  }

  canTransitionTo(status: ReservationStatus): boolean {
    if (!this.reservation) return false;
    return RESERVATION_STATUS_TRANSITIONS[this.reservation.status].includes(status);
  }

  askConfirm(): void {
    this.pendingAction = 'confirm';
    this.confirmData = {
      title: 'Rezervasyonu onayla',
      message: `${this.reservation?.reservationCode} kodlu rezervasyonu onaylamak istediğinize emin misiniz?`,
      confirmLabel: 'Onayla',
    };
  }

  askRefund(): void {
    this.pendingAction = 'refund';
    this.confirmData = {
      title: 'İadeyi onayla',
      message: `${this.reservation?.reservationCode} kodlu rezervasyon için iade işlemini onaylamak istediğinize emin misiniz?`,
      confirmLabel: 'İade Et',
      danger: true,
    };
  }

  openCancelForm(): void {
    this.showCancelForm = true;
  }

  confirmCancel(): void {
    if (!this.reservation || this.cancelForm.invalid) return;
    const v = this.cancelForm.getRawValue();
    this.reservationService.cancel(this.reservation, v.reason!, v.note ?? undefined).subscribe({
      next: (updated) => {
        this.reservation = updated;
        this.showCancelForm = false;
        this.notify.success('Rezervasyon iptal edildi, kontenjan geri açıldı.');
        this.load();
      },
      error: (err) => {
        this.notify.error(err?.message ?? 'İptal işlemi başarısız.');
      },
    });
  }

  onConfirmAction(): void {
    if (!this.reservation || !this.pendingAction) return;
    const status = this.pendingAction === 'confirm' ? ReservationStatus.CONFIRMED : ReservationStatus.REFUNDED;
    this.reservationService.changeStatus(this.reservation, status).subscribe({
      next: (updated) => {
        this.reservation = updated;
        this.notify.success('Rezervasyon durumu güncellendi.');
        this.confirmData = null;
      },
      error: (err) => {
        this.notify.error(err?.message ?? 'İşlem başarısız.');
        this.confirmData = null;
      },
    });
  }
}
