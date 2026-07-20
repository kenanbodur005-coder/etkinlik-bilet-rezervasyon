import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CheckInService } from '../services/check-in.service';
import { EventService } from '../../events/services/event.service';
import { TicketTypeService } from '../../ticket-types/services/ticket-type.service';
import { AttendeeService } from '../../reservations/services/attendee.service';
import { Reservation } from '../../reservations/models/reservation.model';
import { NotificationService } from '../../../core/services/notification.service';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { TrDatePipe } from '../../../shared/pipes/date-format.pipe';

interface CheckInHistoryItem {
  code: string;
  attendeeName: string;
  eventTitle: string;
  timestamp: string;
  success: boolean;
  message: string;
}

@Component({
  selector: 'app-check-in-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutofocusDirective, MoneyPipe, TrDatePipe],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Check-in</h1>
        <p>Bilet kodunu manuel girerek katılımcı girişini onaylayın.</p>
      </div>
    </div>

    <div class="card" style="max-width:560px;margin-bottom:24px">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-field">
            <label class="required">Bilet Kodu</label>
            <input
              class="form-control"
              formControlName="code"
              placeholder="Örn: RZV-AB12C"
              appAutofocus
              style="text-transform:uppercase;font-family:monospace;font-size:16px;letter-spacing:1px"
            />
          </div>
          <div class="form-actions" style="justify-content:flex-start;border-top:none;padding-top:0">
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || checking">
              {{ checking ? 'Kontrol ediliyor...' : 'Check-in Yap' }}
            </button>
          </div>
        </form>

        <div
          *ngIf="lastResult"
          class="card"
          [style.background]="lastResult.success ? 'var(--color-success-soft)' : 'var(--color-danger-soft)'"
          style="margin-top:16px;border:none"
        >
          <div class="card-body" style="padding:14px 16px">
            <strong [style.color]="lastResult.success ? 'var(--color-success)' : 'var(--color-danger)'">
              {{ lastResult.success ? '✓ Check-in başarılı' : '✕ Check-in başarısız' }}
            </strong>
            <p style="margin:4px 0 0 0">{{ lastResult.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h2>Bu Oturumdaki İşlemler</h2>
        <div class="data-table-wrap" *ngIf="history.length > 0; else noHistory">
          <table class="data-table">
            <thead><tr><th>Kod</th><th>Katılımcı</th><th>Etkinlik</th><th>Saat</th><th>Sonuç</th></tr></thead>
            <tbody>
              <tr *ngFor="let h of history">
                <td style="font-family:monospace">{{ h.code }}</td>
                <td>{{ h.attendeeName }}</td>
                <td>{{ h.eventTitle }}</td>
                <td>{{ h.timestamp | trDate }}</td>
                <td>
                  <span class="badge" [class.badge-success]="h.success" [class.badge-danger]="!h.success">
                    {{ h.success ? 'Başarılı' : 'Başarısız' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noHistory>
          <p style="color:var(--color-text-muted)">Henüz bu oturumda check-in işlemi yapılmadı.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class CheckInPageComponent {
  form = this.fb.group({
    code: ['', Validators.required],
  });

  checking = false;
  lastResult: { success: boolean; message: string } | null = null;
  history: CheckInHistoryItem[] = [];

  constructor(
    private fb: FormBuilder,
    private checkInService: CheckInService,
    private eventService: EventService,
    private attendeeService: AttendeeService,
    private notify: NotificationService
  ) {}

  submit(): void {
    if (this.form.invalid) return;
    this.checking = true;
    const code = this.form.get('code')!.value!.trim().toUpperCase();

    this.checkInService.checkInByCode(code).subscribe({
      next: ({ reservation }) => {
        this.checking = false;
        const attendee = this.attendeeService.getByIdSync(reservation.attendeeId);
        const eventTitle = this.eventService.allActiveSync().find((e) => e.id === reservation.eventId)?.title ?? '-';
        const message = `${attendee?.fullName ?? 'Katılımcı'} için giriş onaylandı (${eventTitle}).`;
        this.lastResult = { success: true, message };
        this.history.unshift({
          code,
          attendeeName: attendee?.fullName ?? '-',
          eventTitle,
          timestamp: new Date().toISOString(),
          success: true,
          message,
        });
        this.notify.success('Check-in başarılı.');
        this.form.reset({ code: '' });
      },
      error: (err) => {
        this.checking = false;
        const message = err?.message ?? 'Check-in yapılamadı.';
        this.lastResult = { success: false, message };
        this.history.unshift({
          code,
          attendeeName: '-',
          eventTitle: '-',
          timestamp: new Date().toISOString(),
          success: false,
          message,
        });
        this.notify.error(message);
      },
    });
  }
}
