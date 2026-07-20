import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { VenueService } from '../../../venues/services/venue.service';
import { Venue } from '../../../venues/models/venue.model';
import { EventEntity } from '../../models/event.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { CanComponentDeactivate } from '../../../../core/guards/unsaved-changes.guard';
import { maxCapacityValidator, positiveIntegerValidator } from '../../../../shared/validators/capacity.validator';
import { dateRangeValidator, futureDateValidator } from '../../../../shared/validators/date-range.validator';
import { LoadingStateComponent } from '../../../../shared/components/state-and-kpi.component';
import { AutofocusDirective } from '../../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-event-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, LoadingStateComponent, AutofocusDirective],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>{{ isEdit ? 'Etkinliği Düzenle' : 'Yeni Etkinlik' }}</h1>
        <p>Etkinlik bilgilerini ve toplam kontenjanı tanımlayın.</p>
      </div>
    </div>

    <app-loading-state *ngIf="initialLoading" message="Etkinlik bilgileri yükleniyor..."></app-loading-state>

    <div class="card" *ngIf="!initialLoading">
      <div class="card-body">
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-field">
            <label class="required">Etkinlik Adı</label>
            <input class="form-control" formControlName="title" appAutofocus />
            <div class="field-error" *ngIf="isInvalid('title')">Etkinlik adı zorunludur (en az 3 karakter).</div>
          </div>

          <div class="form-field">
            <label class="required">Açıklama</label>
            <textarea class="form-control" formControlName="description"></textarea>
            <div class="field-error" *ngIf="isInvalid('description')">Açıklama zorunludur.</div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label class="required">Kategori</label>
              <select class="form-control" formControlName="category">
                <option value="Konser">Konser</option>
                <option value="Seminer">Seminer</option>
                <option value="Eğitim">Eğitim</option>
                <option value="Konferans">Konferans</option>
              </select>
            </div>
            <div class="form-field">
              <label class="required">Mekan</label>
              <select class="form-control" formControlName="venueId">
                <option [ngValue]="null" disabled>Mekan seçin</option>
                <option *ngFor="let v of venues" [value]="v.id">{{ v.name }} ({{ v.totalCapacity }} kişi)</option>
              </select>
              <div class="field-error" *ngIf="isInvalid('venueId')">Mekan seçimi zorunludur.</div>
            </div>
          </div>

          <div class="form-grid">
            <div class="form-field">
              <label class="required">Başlangıç Tarihi</label>
              <input class="form-control" type="date" formControlName="startDate" />
              <div class="field-error" *ngIf="isInvalid('startDate')">Geçmiş bir tarih seçilemez.</div>
            </div>
            <div class="form-field">
              <label class="required">Bitiş Tarihi</label>
              <input class="form-control" type="date" formControlName="endDate" />
            </div>
          </div>
          <div class="field-error" *ngIf="form.hasError('dateRange') && form.get('endDate')?.touched" style="margin: -8px 0 16px">
            Bitiş tarihi başlangıç tarihinden önce olamaz.
          </div>

          <div class="form-field">
            <label class="required">Toplam Kontenjan</label>
            <input class="form-control" type="number" formControlName="totalCapacity" />
            <div class="field-error" *ngIf="form.get('totalCapacity')?.touched && form.get('totalCapacity')?.hasError('maxCapacity')">
              Kontenjan, seçilen mekanın kapasitesini ({{ selectedVenueCapacity }}) aşamaz.
            </div>
            <div class="field-error" *ngIf="form.get('totalCapacity')?.touched && form.get('totalCapacity')?.hasError('positiveInteger')">
              Kontenjan pozitif bir tam sayı olmalıdır.
            </div>
          </div>

          <div class="form-actions">
            <a routerLink="/etkinlikler" class="btn btn-secondary">Vazgeç</a>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              {{ saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class EventFormPageComponent implements OnInit, CanComponentDeactivate {
  @Input() id?: string;

  isEdit = false;
  initialLoading = false;
  saving = false;
  saved = false;
  venues: Venue[] = [];
  selectedVenueCapacity: number | null = null;
  private original?: EventEntity;

  form = this.fb.group(
    {
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      category: ['Konser', Validators.required],
      venueId: [null as string | null, Validators.required],
      startDate: ['', [Validators.required, futureDateValidator]],
      endDate: ['', Validators.required],
      totalCapacity: [100, [Validators.required, positiveIntegerValidator]],
    },
    { validators: dateRangeValidator('startDate', 'endDate') }
  );

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private venueService: VenueService,
    private router: Router,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.venues = this.venueService.allActiveSync();
    this.form.get('venueId')!.valueChanges.subscribe((venueId) => {
      const venue = this.venues.find((v) => v.id === venueId);
      this.selectedVenueCapacity = venue?.totalCapacity ?? null;
      this.form
        .get('totalCapacity')!
        .setValidators([Validators.required, positiveIntegerValidator, maxCapacityValidator(() => this.selectedVenueCapacity ?? Infinity)]);
      this.form.get('totalCapacity')!.updateValueAndValidity();
    });

    this.isEdit = !!this.id;
    if (this.isEdit && this.id) {
      this.initialLoading = true;
      this.eventService.getById(this.id).subscribe({
        next: (event) => {
          this.original = event;
          const rule = this.eventService.getCapacityRuleSync(event.id);
          this.form.patchValue({
            title: event.title,
            description: event.description,
            category: event.category,
            venueId: event.venueId,
            startDate: event.startDate.substring(0, 10),
            endDate: event.endDate.substring(0, 10),
            totalCapacity: rule?.totalCapacity ?? 0,
          });
          this.initialLoading = false;
        },
        error: () => {
          this.notify.error('Etkinlik bulunamadı.');
          this.router.navigateByUrl('/etkinlikler');
        },
      });
    }
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.touched && control.invalid;
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
    const payload = {
      title: v.title!,
      description: v.description!,
      category: v.category!,
      venueId: v.venueId!,
      startDate: new Date(v.startDate!).toISOString(),
      endDate: new Date(v.endDate!).toISOString(),
    };
    const totalCapacity = Number(v.totalCapacity);

    const request =
      this.isEdit && this.original
        ? this.eventService.update(this.original.id, payload, this.original, totalCapacity)
        : this.eventService.create(payload, totalCapacity);

    request.subscribe({
      next: (event) => {
        this.saving = false;
        this.saved = true;
        this.notify.success(this.isEdit ? 'Etkinlik güncellendi.' : 'Etkinlik oluşturuldu.');
        this.router.navigate(['/etkinlikler', event.id]);
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err?.message ?? 'İşlem sırasında bir hata oluştu.');
      },
    });
  }
}
