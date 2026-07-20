import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { EventEntity } from '../../models/event.model';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge.component';
import { TrDatePipe } from '../../../../shared/pipes/date-format.pipe';
import { PermissionDirective } from '../../../../shared/directives/permission.directive';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';
import { EventStatus, EVENT_STATUS_LABELS, UserRole } from '../../../../core/models/enums';
import { VenueService } from '../../../venues/services/venue.service';

@Component({
  selector: 'app-event-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DataTableComponent, StatusBadgeComponent, TrDatePipe, PermissionDirective, ConfirmDialogComponent],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Etkinlikler</h1>
        <p>Tüm etkinlikleri listeleyin, durumlarını yönetin ve detaylarına ulaşın.</p>
      </div>
      <a routerLink="/etkinlikler/yeni" class="btn btn-primary" *appPermission="[UserRole.EVENT_MANAGER]">+ Yeni Etkinlik</a>
    </div>

    <app-data-table
      [columns]="columns"
      [rows]="pageRows"
      [total]="total"
      [page]="page"
      [pageSize]="pageSize"
      [loading]="loading"
      [error]="error"
      emptyTitle="Etkinlik bulunamadı"
      emptySubtitle="Arama kriterlerinizi değiştirin veya yeni bir etkinlik oluşturun."
      (searchChange)="onSearch($event)"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSort($event)"
      (retry)="load()"
    >
      <div toolbar-actions style="display:flex;gap:8px">
        <select class="form-control" style="width:auto" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
          <option [ngValue]="undefined">Tüm Durumlar</option>
          <option *ngFor="let s of statusOptions" [ngValue]="s">{{ statusLabels[s] }}</option>
        </select>
      </div>
      <tr table-rows *ngFor="let e of pageRows">
        <td><a [routerLink]="['/etkinlikler', e.id]"><strong>{{ e.title }}</strong></a></td>
        <td>{{ e.category }}</td>
        <td>{{ venueName(e.venueId) }}</td>
        <td>{{ e.startDate | trDate }}</td>
        <td><app-status-badge [value]="e.status"></app-status-badge></td>
        <td>
          <a [routerLink]="['/etkinlikler', e.id]" class="btn btn-ghost btn-sm">Detay</a>
          <a
            [routerLink]="['/etkinlikler', e.id, 'duzenle']"
            class="btn btn-ghost btn-sm"
            *appPermission="[UserRole.EVENT_MANAGER]"
            >Düzenle</a
          >
          <button
            class="btn btn-ghost btn-sm"
            *appPermission="[UserRole.EVENT_MANAGER]"
            (click)="askDelete(e)"
          >
            Sil
          </button>
        </td>
      </tr>
    </app-data-table>

    <app-confirm-dialog
      *ngIf="confirmData"
      [data]="confirmData"
      (confirmed)="confirmDelete()"
      (cancelled)="confirmData = null"
    ></app-confirm-dialog>
  `,
})
export class EventListPageComponent implements OnInit {
  columns: DataTableColumn[] = [
    { field: 'title', header: 'Etkinlik', sortable: true },
    { field: 'category', header: 'Kategori' },
    { field: 'venueId', header: 'Mekan' },
    { field: 'startDate', header: 'Tarih', sortable: true },
    { field: 'status', header: 'Durum' },
  ];

  pageRows: EventEntity[] = [];
  total = 0;
  page = 1;
  pageSize = 8;
  search = '';
  sortField = 'startDate';
  sortDir: 'asc' | 'desc' = 'desc';
  loading = false;
  error: string | null = null;
  statusFilter?: EventStatus;
  statusOptions = Object.values(EventStatus);
  statusLabels = EVENT_STATUS_LABELS;
  UserRole = UserRole;

  confirmData: ConfirmDialogData | null = null;
  private pendingDelete: EventEntity | null = null;
  private venueNameCache = new Map<string, string>();

  constructor(private eventService: EventService, private venueService: VenueService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.venueService.allActiveSync().forEach((v) => this.venueNameCache.set(v.id, v.name));
    this.load();
  }

  venueName(id: string): string {
    return this.venueNameCache.get(id) ?? '-';
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.eventService
      .list(this.page, this.pageSize, this.search, this.sortField, this.sortDir, this.statusFilter)
      .subscribe({
        next: (result) => {
          this.pageRows = result.items;
          this.total = result.total;
          this.loading = false;
        },
        error: () => {
          this.error = 'Etkinlikler yüklenirken bir sunucu hatası oluştu.';
          this.loading = false;
        },
      });
  }

  onSearch(term: string): void {
    this.search = term;
    this.page = 1;
    this.load();
  }

  onFilterChange(): void {
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

  askDelete(event: EventEntity): void {
    this.pendingDelete = event;
    this.confirmData = {
      title: 'Etkinliği sil',
      message: `"${event.title}" etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      confirmLabel: 'Sil',
      danger: true,
    };
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    this.eventService.softDelete(this.pendingDelete).subscribe({
      next: () => {
        this.notify.success('Etkinlik silindi.');
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
