import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { AttendeeService } from '../../services/attendee.service';
import { EventService } from '../../../events/services/event.service';
import { TicketTypeService } from '../../../ticket-types/services/ticket-type.service';
import { EventEntity } from '../../../events/models/event.model';
import { TicketType } from '../../../ticket-types/models/ticket-type.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { maxCapacityValidator, positiveIntegerValidator } from '../../../../shared/validators/capacity.validator';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';
import { EventStatus } from '../../../../core/models/enums';

@Component({
  selector: 'app-reservation-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MoneyPipe, AutofocusDirective],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Yeni Rezervasyon</h1>
        <p>Etkinlik ve bilet tipi seçimine göre kalan kontenjan canlı olarak hesaplanır.</p>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="save()">
          <h3>Etkinlik ve Bilet</h3>
          <div class="form-grid">
            <div class="form-field">
              <label class="required">Etkinlik</label>
              <select class="form-control" formControlName="eventId">
                <option [ngValue]="null" disabled>Etkinlik seçin</option>
                <option *ngFor="let e of sellableEvents" [value]="e.id">{{ e.title }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="required">Bilet Tipi</label>
              <select class="form-control" formControlName="ticketTypeId">
                <option [ngValue]="null" disabled>Bilet tipi seçin</option>
                <option *ngFor="let t of availableTicketTypes" [value]="t.id">{{ t.name }} — {{ t.price | money }}</option>
              </select>
            </div>
          </div>

          <div
            class="card"
            style="background:var(--color-surface-alt);margin-bottom:16px"
            *ngIf="form.get('ticketTypeId')?.value"
          >
            <div class="card-body" style="display:flex;gap:24px;padding:14px 18px">
              <div>
                <div style="font-size:11.5px;color:var(--color-text-muted);font-weight:700">KALAN BİLET TİPİ KONTENJANI</div>
                <div style="font-size:20px;font-weight:800">{{ remainingTypeQuota }}</div>
              </div>
              <div>
                <div style="font-size:11.5px;color:var(--color-text-muted);font-weight:700">KALAN ETKİNLİK KAPASİTESİ</div>
                <div style="font-size:20px;font-weight:800">{{ remainingEventQuota }}</div>
              </div>
              <div>
                <div style="font-size:11.5px;color:var(--color-text-muted);font-weight:700">TOPLAM TUTAR</div>
                <div style="font-size:20px;font-weight:800">{{ totalPrice | money }}</div>
              </div>
            </div>
          </div>

          <div class="form-field" style="max-width:200px">
            <label class="required">Adet</label>
            <input class="form-control" type="number" formControlName="quantity" />
            <div class="field-error" *ngIf="form.get('quantity')?.touched && form.get('quantity')?.hasError('maxCapacity')">
              Girilen adet, kalan kontenjanı ({{ maxAllowedQuantity }}) aşıyor.
            </div>
            <div class="field-error" *ngIf="form.get('quantity')?.touched && form.get('quantity')?.hasError('positiveInteger')">
              Adet pozitif bir tam sayı olmalıdır.
            </div>
          </div>

          <h3 style="margin-top:8px">Katılımcı Bilgileri</h3>
          <div class="form-grid">
            <div class="form-field">
              <label class="required">Ad Soyad</label>
              <input class="form-control" formControlName="fullName" appAutofocus />
            </div>
            <div class="form-field">
              <label class="required">E-posta</label>
              <input class="form-control" type="email" formControlName="email" />
              <div class="field-error" *ngIf="form.get('email')?.touched && form.get('email')?.hasError('email')">
                Geçerli bir e-posta girin.
              </div>
            </div>
          </div>
          <div class="form-field" style="max-width:280px">
            <label class="required">Telefon</label>
            <input class="form-control" formControlName="phone" />
          </div>

          <div class="form-actions">
            <a routerLink="/rezervasyonlar" class="btn btn-secondary">Vazgeç</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              {{ saving ? 'Kaydediliyor...' : 'Rezervasyon Oluştur' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ReservationFormPageComponent implements OnInit, CanComponentDeactivate {
  sellableEvents: EventEntity[] = [];
  availableTicketTypes: TicketType[] = [];
  saving = false;
  saved = false;

  form = this.fb.group({
    eventId: [null as string | null, Validators.required],
    ticketTypeId: [null as string | null, Validators.required],
    quantity: [1, [Validators.required, positiveIntegerValidator]],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private ticketTypeService: TicketTypeService,
    private reservationService: ReservationService,
    private attendeeService: AttendeeService,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.sellableEvents = this.eventService
      .allActiveSync()
      .filter((e) => [EventStatus.PUBLISHED, EventStatus.ONGOING].includes(e.status));

    this.form.get('eventId')!.valueChanges.subscribe((eventId) => {
      this.availableTicketTypes = eventId ? this.ticketTypeService.byEventSync(eventId) : [];
      this.form.get('ticketTypeId')!.setValue(null);
    });

    this.form.get('ticketTypeId')!.valueChanges.subscribe(() => this.updateQuantityValidators());
    this.form.get('quantity')!.valueChanges.subscribe(() => {});
  }

  private updateQuantityValidators(): void {
    this.form
      .get('quantity')!
      .setValidators([Validators.required, positiveIntegerValidator, maxCapacityValidator(() => this.maxAllowedQuantity)]);
    this.form.get('quantity')!.updateValueAndValidity();
  }

  get maxAllowedQuantity(): number {
    return Math.min(this.remainingTypeQuota, this.remainingEventQuota);
  }

  get remainingTypeQuota(): number {
    const eventId = this.form.get('eventId')?.value;
    const ticketTypeId = this.form.get('ticketTypeId')?.value;
    if (!eventId || !ticketTypeId) return 0;
    return this.reservationService.remainingQuota(eventId, ticketTypeId);
  }

  get remainingEventQuota(): number {
    const eventId = this.form.get('eventId')?.value;
    if (!eventId) return 0;
    return this.reservationService.remainingEventCapacity(eventId);
  }

  get totalPrice(): number {
    const ticketTypeId = this.form.get('ticketTypeId')?.value;
    const quantity = Number(this.form.get('quantity')?.value) || 0;
    const ticketType = this.availableTicketTypes.find((t) => t.id === ticketTypeId);
    return (ticketType?.price ?? 0) * quantity;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.getRawValue();
    const attendee = this.attendeeService.findOrCreateSync(v.fullName!, v.email!, v.phone!);

    this.reservationService
      .create({ eventId: v.eventId!, ticketTypeId: v.ticketTypeId!, attendeeId: attendee.id, quantity: Number(v.quantity) })
      .subscribe({
        next: (reservation) => {
          this.saving = false;
          this.saved = true;
          this.notify.success(`${reservation.reservationCode} kodlu rezervasyon oluşturuldu.`);
          this.router.navigate(['/rezervasyonlar', reservation.id]);
        },
        error: (err) => {
          this.saving = false;
          this.notify.error(err?.message ?? 'Rezervasyon oluşturulamadı.');
        },
      });
  }
}
