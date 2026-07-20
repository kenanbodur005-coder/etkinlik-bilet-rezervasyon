import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { AttendeeService } from '../../services/attendee.service';
import { EventService } from '../../../events/services/event.service';
import { TicketTypeService } from '../../../ticket-types/services/ticket-type.service';
import { Reservation } from '../../models/reservation.model';
import { DataTableComponent, DataTableColumn } from '../../../../shared/components/data-table.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge.component';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { TrDatePipe } from '../../../../shared/pipes/date-format.pipe';
import { PermissionDirective } from '../../../../shared/directives/permission.directive';
import { ReservationStatus, RESERVATION_STATUS_LABELS, UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-reservation-list-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DataTableComponent, StatusBadgeComponent, MoneyPipe, TrDatePipe, PermissionDirective],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Rezervasyonlar</h1>
        <p>Tüm rezervasyonları görüntüleyin, filtreleyin ve detaylarını inceleyin.</p>
      </div>
      <a routerLink="/rezervasyonlar/yeni" class="btn btn-primary" *appPermission="[UserRole.EVENT_MANAGER, UserRole.BOX_OFFICE_OPERATOR]">
        + Yeni Rezervasyon
      </a>
    </div>

    <app-data-table
      [columns]="columns"
      [rows]="pageRows"
      [total]="total"
      [page]="page"
      [pageSize]="pageSize"
      [loading]="loading"
      [error]="error"
      emptyTitle="Rezervasyon bulunamadı"
      emptySubtitle="Filtreleri değiştirin veya yeni bir rezervasyon oluşturun."
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
        <select class="form-control" style="width:auto" [(ngModel)]="eventFilter" (ngModelChange)="onFilterChange()">
          <option [ngValue]="undefined">Tüm Etkinlikler</option>
          <option *ngFor="let e of events" [value]="e.id">{{ e.title }}</option>
        </select>
      </div>
      <tr table-rows *ngFor="let r of pageRows">
        <td><a [routerLink]="['/rezervasyonlar', r.id]"><strong>{{ r.reservationCode }}</strong></a></td>
        <td>{{ eventTitle(r.eventId) }}</td>
        <td>{{ attendeeName(r.attendeeId) }}</td>
        <td>{{ r.quantity }}</td>
        <td>{{ r.totalPrice | money }}</td>
        <td>{{ r.createdAt | trDate }}</td>
        <td><app-status-badge [value]="r.status"></app-status-badge></td>
        <td><a [routerLink]="['/rezervasyonlar', r.id]" class="btn btn-ghost btn-sm">Detay</a></td>
      </tr>
    </app-data-table>
  `,
})
export class ReservationListPageComponent implements OnInit {
  columns: DataTableColumn[] = [
    { field: 'reservationCode', header: 'Kod', sortable: true },
    { field: 'eventId', header: 'Etkinlik' },
    { field: 'attendeeId', header: 'Katılımcı' },
    { field: 'quantity', header: 'Adet' },
    { field: 'totalPrice', header: 'Tutar', sortable: true },
    { field: 'createdAt', header: 'Tarih', sortable: true },
    { field: 'status', header: 'Durum' },
  ];

  pageRows: Reservation[] = [];
  total = 0;
  page = 1;
  pageSize = 8;
  search = '';
  sortField = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';
  loading = false;
  error: string | null = null;

  statusFilter?: ReservationStatus;
  eventFilter?: string;
  statusOptions = Object.values(ReservationStatus);
  statusLabels = RESERVATION_STATUS_LABELS;
  UserRole = UserRole;
  events: { id: string; title: string }[] = [];

  private eventTitleCache = new Map<string, string>();
  private attendeeNameCache = new Map<string, string>();

  constructor(
    private reservationService: ReservationService,
    private attendeeService: AttendeeService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.events = this.eventService.allActiveSync().map((e) => ({ id: e.id, title: e.title }));
    this.events.forEach((e) => this.eventTitleCache.set(e.id, e.title));
    this.attendeeService.allSync().forEach((a) => this.attendeeNameCache.set(a.id, a.fullName));
    this.load();
  }

  eventTitle(id: string): string {
    return this.eventTitleCache.get(id) ?? '-';
  }

  attendeeName(id: string): string {
    return this.attendeeNameCache.get(id) ?? '-';
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.reservationService
      .list(this.page, this.pageSize, this.search, this.sortField, this.sortDir, this.statusFilter, this.eventFilter)
      .subscribe({
        next: (result) => {
          this.pageRows = result.items;
          this.total = result.total;
          this.loading = false;
        },
        error: () => {
          this.error = 'Rezervasyonlar yüklenirken bir sunucu hatası oluştu.';
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
}
