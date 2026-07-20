import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VenueService } from '../services/venue.service';
import { Venue } from '../models/venue.model';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog.component';
import { NotificationService } from '../../../core/services/notification.service';
import { positiveIntegerValidator } from '../../../shared/validators/capacity.validator';
import { AutofocusDirective } from '../../../shared/directives/autofocus.directive';

@Component({
  selector: 'app-venue-list-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DataTableComponent, ConfirmDialogComponent, AutofocusDirective],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Mekanlar</h1>
        <p>Etkinliklerin gerçekleştirileceği mekan ve salon kapasitelerini yönetin.</p>
      </div>
      <button class="btn btn-primary" (click)="openCreate()">+ Yeni Mekan</button>
    </div>

    <app-data-table
      [columns]="columns"
      [rows]="pageRows"
      [total]="total"
      [page]="page"
      [pageSize]="pageSize"
      [loading]="loading"
      [error]="error"
      emptyTitle="Henüz mekan eklenmemiş"
      emptySubtitle="Yeni bir mekan oluşturarak başlayın."
      (searchChange)="onSearch($event)"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSort($event)"
      (retry)="load()"
    >
      <tr table-rows *ngFor="let v of pageRows">
        <td><strong>{{ v.name }}</strong></td>
        <td>{{ v.city }}</td>
        <td>{{ v.address }}</td>
        <td>{{ v.totalCapacity }} kişi</td>
        <td>
          <span class="badge" [class.badge-success]="v.isActive" [class.badge-neutral]="!v.isActive">
            {{ v.isActive ? 'Aktif' : 'Pasif' }}
          </span>
        </td>
        <td>
          <button class="btn btn-ghost btn-sm" (click)="openEdit(v)">Düzenle</button>
          <button class="btn btn-ghost btn-sm" *ngIf="v.isActive" (click)="askDelete(v)">Pasife Al</button>
        </td>
      </tr>
    </app-data-table>

    <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
      <div class="modal-panel" style="max-width:520px" (click)="$event.stopPropagation()">
        <h2>{{ editing ? 'Mekanı Düzenle' : 'Yeni Mekan' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-field">
            <label class="required">Mekan Adı</label>
            <input class="form-control" formControlName="name" appAutofocus />
            <div class="field-error" *ngIf="form.get('name')?.touched && form.get('name')?.hasError('required')">
              Mekan adı zorunludur.
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label class="required">Şehir</label>
              <input class="form-control" formControlName="city" />
            </div>
            <div class="form-field">
              <label class="required">Toplam Kapasite</label>
              <input class="form-control" type="number" formControlName="totalCapacity" />
              <div class="field-error" *ngIf="form.get('totalCapacity')?.touched && form.get('totalCapacity')?.invalid">
                Kapasite pozitif bir tam sayı olmalıdır.
              </div>
            </div>
          </div>
          <div class="form-field">
            <label class="required">Adres</label>
            <input class="form-control" formControlName="address" />
          </div>
          <div class="form-field">
            <label>Açıklama</label>
            <textarea class="form-control" formControlName="description"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="closeForm()">Vazgeç</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving">
              {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <app-confirm-dialog
      *ngIf="confirmData"
      [data]="confirmData"
      (confirmed)="confirmDelete()"
      (cancelled)="confirmData = null"
    ></app-confirm-dialog>
  `,
})
export class VenueListPageComponent implements OnInit {
  columns: DataTableColumn[] = [
    { field: 'name', header: 'Mekan', sortable: true },
    { field: 'city', header: 'Şehir', sortable: true },
    { field: 'address', header: 'Adres' },
    { field: 'totalCapacity', header: 'Kapasite', sortable: true },
    { field: 'isActive', header: 'Durum' },
  ];

  pageRows: Venue[] = [];
  total = 0;
  page = 1;
  pageSize = 8;
  search = '';
  sortField = 'name';
  sortDir: 'asc' | 'desc' = 'asc';
  loading = false;
  error: string | null = null;

  showForm = false;
  editing: Venue | null = null;
  saving = false;
  confirmData: ConfirmDialogData | null = null;
  private pendingDelete: Venue | null = null;

  form = this.fb.group({
    name: ['', Validators.required],
    city: ['', Validators.required],
    address: ['', Validators.required],
    totalCapacity: [100, [Validators.required, positiveIntegerValidator]],
    description: [''],
  });

  constructor(private venueService: VenueService, private fb: FormBuilder, private notify: NotificationService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.venueService.list(this.page, this.pageSize, this.search, this.sortField, this.sortDir).subscribe({
      next: (result) => {
        this.pageRows = result.items;
        this.total = result.total;
        this.loading = false;
      },
      error: () => {
        this.error = 'Mekanlar yüklenirken bir sunucu hatası oluştu.';
        this.loading = false;
      },
    });
  }

  onSearch(term: string): void {
    this.search = term;
    this.page = 1;
    this.load();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.load();
  }

  onSort(e: { field: string; dir: 'asc' | 'desc' }): void {
    this.sortField = e.field;
    this.sortDir = e.dir;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({ name: '', city: '', address: '', totalCapacity: 100, description: '' });
    this.showForm = true;
  }

  openEdit(venue: Venue): void {
    this.editing = venue;
    this.form.reset({
      name: venue.name,
      city: venue.city,
      address: venue.address,
      totalCapacity: venue.totalCapacity,
      description: venue.description ?? '',
    });
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editing = null;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const value = this.form.getRawValue();

    const request = this.editing
      ? this.venueService.update(this.editing.id, { ...value, totalCapacity: Number(value.totalCapacity) } as any, this.editing)
      : this.venueService.create({
          name: value.name!,
          city: value.city!,
          address: value.address!,
          totalCapacity: Number(value.totalCapacity),
          description: value.description ?? '',
          isActive: true,
        });

    request.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editing ? 'Mekan güncellendi.' : 'Mekan oluşturuldu.');
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err?.message ?? 'İşlem sırasında bir hata oluştu.');
      },
    });
  }

  askDelete(venue: Venue): void {
    this.pendingDelete = venue;
    this.confirmData = {
      title: 'Mekanı pasife al',
      message: `"${venue.name}" mekanını pasife almak istediğinize emin misiniz? Bu mekana bağlı geçmiş etkinlikler etkilenmez.`,
      confirmLabel: 'Pasife Al',
      danger: true,
    };
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.venueService.softDelete(this.pendingDelete).subscribe({
      next: () => {
        this.notify.success('Mekan pasife alındı.');
        this.confirmData = null;
        this.pendingDelete = null;
        this.load();
      },
      error: (err) => {
        this.notify.error(err?.message ?? 'İşlem başarısız.');
        this.confirmData = null;
      },
    });
  }
}
