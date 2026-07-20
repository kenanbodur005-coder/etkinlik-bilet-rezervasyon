import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TicketTypeService } from '../services/ticket-type.service';
import { TicketType } from '../models/ticket-type.model';
import { EventService } from '../../events/services/event.service';
import { EventEntity } from '../../events/models/event.model';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { NotificationService } from '../../../core/services/notification.service';
import { ReservationService } from '../../reservations/services/reservation.service';
import { TicketCategory, TICKET_CATEGORY_LABELS } from '../../../core/models/enums';
import { positiveIntegerValidator } from '../../../shared/validators/capacity.validator';
import { PermissionDirective } from '../../../shared/directives/permission.directive';
import { UserRole } from '../../../core/models/enums';

@Component({
  selector: 'app-ticket-type-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DataTableComponent, ConfirmDialogComponent, MoneyPipe, StatusLabelPipe, PermissionDirective],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Bilet Tipleri</h1>
        <p>Etkinliklere bağlı bilet tiplerini, fiyatlarını ve kontenjanlarını yönetin.</p>
      </div>
      <button class="btn btn-primary" *appPermission="[UserRole.EVENT_MANAGER]" (click)="openCreate()">+ Yeni Bilet Tipi</button>
    </div>

    <app-data-table
      [columns]="columns"
      [rows]="filteredRows"
      [total]="filteredRows.length"
      [page]="1"
      [pageSize]="1000"
      [loading]="loading"
      [error]="error"
      emptyTitle="Bilet tipi bulunamadı"
      emptySubtitle="Bir etkinlik seçin veya yeni bilet tipi oluşturun."
      (searchChange)="onSearch($event)"
      (retry)="load()"
    >
      <div toolbar-actions>
        <select class="form-control" style="width:auto" [(ngModel)]="eventFilter" (ngModelChange)="applyFilter()">
          <option [ngValue]="undefined">Tüm Etkinlikler</option>
          <option *ngFor="let e of events" [value]="e.id">{{ e.title }}</option>
        </select>
      </div>
      <tr table-rows *ngFor="let t of filteredRows">
        <td><strong>{{ t.name }}</strong></td>
        <td>{{ eventTitle(t.eventId) }}</td>
        <td>{{ t.category | statusLabel }}</td>
        <td>{{ t.price | money }}</td>
        <td>{{ t.allocatedQuota }}</td>
        <td>{{ soldCount(t.id) }} / {{ t.allocatedQuota }}</td>
        <td>
          <button class="btn btn-ghost btn-sm" *appPermission="[UserRole.EVENT_MANAGER]" (click)="openEdit(t)">Düzenle</button>
          <button class="btn btn-ghost btn-sm" *appPermission="[UserRole.EVENT_MANAGER]" (click)="askDelete(t)">Pasife Al</button>
        </td>
      </tr>
    </app-data-table>

    <div class="modal-backdrop" *ngIf="showForm" (click)="closeForm()">
      <div class="modal-panel" style="max-width:520px" (click)="$event.stopPropagation()">
        <h2>{{ editing ? 'Bilet Tipini Düzenle' : 'Yeni Bilet Tipi' }}</h2>
        <form [formGroup]="form" (ngSubmit)="save()">
          <div class="form-field">
            <label class="required">Etkinlik</label>
            <select class="form-control" formControlName="eventId" [attr.disabled]="editing ? true : null">
              <option [ngValue]="null" disabled>Etkinlik seçin</option>
              <option *ngFor="let e of events" [value]="e.id">{{ e.title }}</option>
            </select>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label class="required">Bilet Adı</label>
              <input class="form-control" formControlName="name" />
            </div>
            <div class="form-field">
              <label class="required">Kategori</label>
              <select class="form-control" formControlName="category">
                <option *ngFor="let c of categories" [value]="c">{{ categoryLabels[c] }}</option>
              </select>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-field">
              <label class="required">Fiyat (₺)</label>
              <input class="form-control" type="number" formControlName="price" />
              <div class="field-error" *ngIf="form.get('price')?.touched && form.get('price')?.invalid">
                Geçerli bir fiyat girin.
              </div>
            </div>
            <div class="form-field">
              <label class="required">Kontenjan</label>
              <input class="form-control" type="number" formControlName="allocatedQuota" />
              <div class="field-error" *ngIf="form.get('allocatedQuota')?.touched && form.get('allocatedQuota')?.invalid">
                Kontenjan pozitif bir tam sayı olmalıdır.
              </div>
            </div>
          </div>
          <p *ngIf="editing" style="color:var(--color-text-muted);font-size:12.5px">
            Not: Başlamış veya tamamlanmış bir etkinlik için fiyat değiştirilemez.
          </p>
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
export class TicketTypeListPageComponent implements OnInit {
  columns: DataTableColumn[] = [
    { field: 'name', header: 'Bilet Tipi' },
    { field: 'eventId', header: 'Etkinlik' },
    { field: 'category', header: 'Kategori' },
    { field: 'price', header: 'Fiyat' },
    { field: 'allocatedQuota', header: 'Kontenjan' },
    { field: 'sold', header: 'Satılan/Kontenjan' },
  ];

  UserRole = UserRole;
  categories = Object.values(TicketCategory);
  categoryLabels = TICKET_CATEGORY_LABELS;

  allRows: TicketType[] = [];
  filteredRows: TicketType[] = [];
  events: EventEntity[] = [];
  search = '';
  eventFilter?: string;
  loading = false;
  error: string | null = null;

  showForm = false;
  editing: TicketType | null = null;
  saving = false;
  confirmData: ConfirmDialogData | null = null;
  private pendingDelete: TicketType | null = null;
  private eventTitleCache = new Map<string, string>();

  form = this.fb.group({
    eventId: [null as string | null, Validators.required],
    name: ['', Validators.required],
    category: [TicketCategory.STANDARD, Validators.required],
    price: [100, [Validators.required, Validators.min(0)]],
    allocatedQuota: [50, [Validators.required, positiveIntegerValidator]],
  });

  constructor(
    private ticketTypeService: TicketTypeService,
    private eventService: EventService,
    private reservationService: ReservationService,
    private fb: FormBuilder,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.events = this.eventService.allActiveSync();
    this.events.forEach((e) => this.eventTitleCache.set(e.id, e.title));
    this.load();
  }

  eventTitle(id: string): string {
    return this.eventTitleCache.get(id) ?? '-';
  }

  soldCount(ticketTypeId: string): number {
    return this.ticketTypeService.soldQuantitySync(ticketTypeId, this.reservationService.allSync());
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.ticketTypeService.list(1, 1000, this.search).subscribe({
      next: (result) => {
        this.allRows = result.items;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.error = 'Bilet tipleri yüklenirken bir hata oluştu.';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    this.filteredRows = this.eventFilter ? this.allRows.filter((t) => t.eventId === this.eventFilter) : this.allRows;
  }

  onSearch(term: string): void {
    this.search = term;
    this.load();
  }

  openCreate(): void {
    this.editing = null;
    this.form.reset({
      eventId: this.eventFilter ?? null,
      name: '',
      category: TicketCategory.STANDARD,
      price: 100,
      allocatedQuota: 50,
    });
    this.form.get('eventId')!.enable();
    this.showForm = true;
  }

  openEdit(ticketType: TicketType): void {
    this.editing = ticketType;
    this.form.reset({
      eventId: ticketType.eventId,
      name: ticketType.name,
      category: ticketType.category,
      price: ticketType.price,
      allocatedQuota: ticketType.allocatedQuota,
    });
    this.form.get('eventId')!.disable();
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editing = null;
    this.form.get('eventId')!.enable();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const v = this.form.getRawValue();

    const request = this.editing
      ? this.ticketTypeService.update(
          this.editing.id,
          { name: v.name!, category: v.category!, price: Number(v.price), allocatedQuota: Number(v.allocatedQuota) },
          this.editing
        )
      : this.ticketTypeService.create({
          eventId: v.eventId!,
          name: v.name!,
          category: v.category!,
          price: Number(v.price),
          allocatedQuota: Number(v.allocatedQuota),
        });

    request.subscribe({
      next: () => {
        this.saving = false;
        this.notify.success(this.editing ? 'Bilet tipi güncellendi.' : 'Bilet tipi oluşturuldu.');
        this.closeForm();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.notify.error(err?.message ?? 'İşlem sırasında bir hata oluştu.');
      },
    });
  }

  askDelete(ticketType: TicketType): void {
    this.pendingDelete = ticketType;
    this.confirmData = {
      title: 'Bilet tipini pasife al',
      message: `"${ticketType.name}" bilet tipini pasife almak istediğinize emin misiniz?`,
      confirmLabel: 'Pasife Al',
      danger: true,
    };
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.ticketTypeService.softDelete(this.pendingDelete).subscribe({
      next: () => {
        this.notify.success('Bilet tipi pasife alındı.');
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
