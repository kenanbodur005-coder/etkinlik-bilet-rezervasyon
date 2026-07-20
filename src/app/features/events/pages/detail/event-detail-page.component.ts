import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { VenueService } from '../../../venues/services/venue.service';
import { TicketTypeService } from '../../../ticket-types/services/ticket-type.service';
import { ReservationService } from '../../../reservations/services/reservation.service';
import { AttendeeService } from '../../../reservations/services/attendee.service';
import { EventEntity, CapacityRule } from '../../models/event.model';
import { Venue } from '../../../venues/models/venue.model';
import { TicketType } from '../../../ticket-types/models/ticket-type.model';
import { Reservation } from '../../../reservations/models/reservation.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge.component';
import { TrDatePipe } from '../../../../shared/pipes/date-format.pipe';
import { MoneyPipe } from '../../../../shared/pipes/money.pipe';
import { StatusLabelPipe } from '../../../../shared/pipes/status-label.pipe';
import { LoadingStateComponent, ErrorStateComponent } from '../../../../shared/components/state-and-kpi.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog.component';
import { PermissionDirective } from '../../../../shared/directives/permission.directive';
import { EventStatus, EVENT_STATUS_TRANSITIONS, EVENT_STATUS_LABELS, UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-event-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatusBadgeComponent,
    TrDatePipe,
    MoneyPipe,
    StatusLabelPipe,
    LoadingStateComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    ConfirmDialogComponent,
    PermissionDirective,
  ],
  template: `
    <app-loading-state *ngIf="loading"></app-loading-state>
    <app-error-state *ngIf="error && !loading" [message]="error" (retryClick)="load()"></app-error-state>

    <ng-container *ngIf="event && !loading && !error">
      <div class="page-header">
        <div class="page-header__title">
          <h1>{{ event.title }}</h1>
          <p>{{ venue?.name }} · {{ venue?.city }} · {{ event.category }}</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <app-status-badge [value]="event.status"></app-status-badge>
          <a [routerLink]="['/etkinlikler', event.id, 'duzenle']" class="btn btn-secondary" *appPermission="[UserRole.EVENT_MANAGER]">
            Düzenle
          </a>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600;margin-bottom:6px">Toplam Kontenjan</div>
          <div style="font-size:24px;font-weight:800">{{ capacityRule?.totalCapacity ?? '-' }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600;margin-bottom:6px">Kalan Kontenjan</div>
          <div style="font-size:24px;font-weight:800">{{ remainingCapacity }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600;margin-bottom:6px">Toplam Rezervasyon</div>
          <div style="font-size:24px;font-weight:800">{{ reservations.length }}</div>
        </div></div>
        <div class="card"><div class="card-body">
          <div style="font-size:12.5px;color:var(--color-text-muted);font-weight:600;margin-bottom:6px">Tarih</div>
          <div style="font-size:16px;font-weight:700">{{ event.startDate | trDate }}</div>
        </div></div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-body">
          <h2>Açıklama</h2>
          <p>{{ event.description }}</p>

          <div *appPermission="[UserRole.EVENT_MANAGER]" style="margin-top:16px;padding-top:16px;border-top:1px solid var(--color-border)">
            <h3 style="margin-bottom:10px">Durum Değiştir</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button
                *ngFor="let s of nextStatuses"
                class="btn btn-secondary btn-sm"
                (click)="askStatusChange(s)"
              >
                {{ statusLabels[s] }} yap
              </button>
              <span *ngIf="nextStatuses.length === 0" style="color:var(--color-text-muted);font-size:13px">
                Bu durumdan başka bir duruma geçiş tanımlı değil.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:24px">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h2 style="margin:0">Bilet Tipleri</h2>
            <a routerLink="/bilet-tipleri" class="btn btn-ghost btn-sm">Tümünü Yönet</a>
          </div>
          <div class="data-table-wrap" *ngIf="ticketTypes.length > 0; else noTicketTypes">
            <table class="data-table">
              <thead><tr><th>Bilet Tipi</th><th>Fiyat</th><th>Kontenjan</th><th>Satılan</th><th>Kalan</th></tr></thead>
              <tbody>
                <tr *ngFor="let t of ticketTypes">
                  <td>{{ t.name }}</td>
                  <td>{{ t.price | money }}</td>
                  <td>{{ t.allocatedQuota }}</td>
                  <td>{{ sold(t.id) }}</td>
                  <td>{{ t.allocatedQuota - sold(t.id) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noTicketTypes>
            <app-empty-state title="Bilet tipi tanımlı değil" subtitle="Bilet Tipleri sayfasından ekleyebilirsiniz."></app-empty-state>
          </ng-template>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h2 style="margin:0">Rezervasyonlar</h2>
            <span style="color:var(--color-text-muted);font-size:12.5px">Toplam {{ reservations.length }} kayıt</span>
          </div>
          <div class="data-table-wrap" *ngIf="pagedReservations.length > 0; else noRes">
            <table class="data-table">
              <thead><tr><th>Kod</th><th>Bilet Tipi</th><th>Adet</th><th>Tutar</th><th>Durum</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of pagedReservations">
                  <td><a [routerLink]="['/rezervasyonlar', r.id]">{{ r.reservationCode }}</a></td>
                  <td>{{ ticketTypeName(r.ticketTypeId) }}</td>
                  <td>{{ r.quantity }}</td>
                  <td>{{ r.totalPrice | money }}</td>
                  <td>{{ r.status | statusLabel }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noRes>
            <app-empty-state title="Rezervasyon bulunamadı"></app-empty-state>
          </ng-template>
          <div class="table-footer" *ngIf="reservations.length > resPageSize">
            <span>Sayfa {{ resPage }} / {{ resTotalPages }}</span>
            <div class="pagination">
              <button [disabled]="resPage <= 1" (click)="resPage = resPage - 1">‹</button>
              <button [disabled]="resPage >= resTotalPages" (click)="resPage = resPage + 1">›</button>
            </div>
          </div>
        </div>
      </div>
    </ng-container>

    <app-confirm-dialog
      *ngIf="confirmData"
      [data]="confirmData"
      (confirmed)="confirmStatusChange()"
      (cancelled)="confirmData = null"
    ></app-confirm-dialog>
  `,
})
export class EventDetailPageComponent implements OnInit {
  @Input() id!: string;

  event: EventEntity | null = null;
  venue: Venue | null = null;
  capacityRule: CapacityRule | undefined;
  ticketTypes: TicketType[] = [];
  reservations: Reservation[] = [];
  loading = false;
  error: string | null = null;
  UserRole = UserRole;
  statusLabels = EVENT_STATUS_LABELS;

  resPage = 1;
  resPageSize = 5;
  confirmData: ConfirmDialogData | null = null;
  private pendingStatus: EventStatus | null = null;
  private ticketTypeNameCache = new Map<string, string>();

  constructor(
    private eventService: EventService,
    private venueService: VenueService,
    private ticketTypeService: TicketTypeService,
    private reservationService: ReservationService,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.eventService.getById(this.id).subscribe({
      next: (event) => {
        this.event = event;
        this.venue = this.venueService.allActiveSync().find((v) => v.id === event.venueId) ?? null;
        this.capacityRule = this.eventService.getCapacityRuleSync(event.id);
        this.ticketTypes = this.ticketTypeService.byEventSync(event.id);
        this.ticketTypes.forEach((t) => this.ticketTypeNameCache.set(t.id, t.name));
        this.reservations = this.reservationService
          .byEventSync(event.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: () => {
        this.error = 'Etkinlik bilgileri yüklenirken bir hata oluştu.';
        this.loading = false;
      },
    });
  }

  get remainingCapacity(): number {
    return this.event ? this.reservationService.remainingEventCapacity(this.event.id) : 0;
  }

  get nextStatuses(): EventStatus[] {
    return this.event ? EVENT_STATUS_TRANSITIONS[this.event.status] : [];
  }

  get pagedReservations(): Reservation[] {
    const start = (this.resPage - 1) * this.resPageSize;
    return this.reservations.slice(start, start + this.resPageSize);
  }

  get resTotalPages(): number {
    return Math.max(1, Math.ceil(this.reservations.length / this.resPageSize));
  }

  ticketTypeName(id: string): string {
    return this.ticketTypeNameCache.get(id) ?? '-';
  }

  sold(ticketTypeId: string): number {
    return this.ticketTypeService.soldQuantitySync(ticketTypeId, this.reservationService.allSync());
  }

  askStatusChange(status: EventStatus): void {
    this.pendingStatus = status;
    this.confirmData = {
      title: 'Etkinlik durumunu değiştir',
      message: `Etkinliği "${this.statusLabels[status]}" durumuna almak istediğinize emin misiniz?`,
      confirmLabel: 'Onayla',
    };
  }

  confirmStatusChange(): void {
    if (!this.event || !this.pendingStatus) return;
    this.eventService.changeStatus(this.event, this.pendingStatus).subscribe({
      next: (updated) => {
        this.event = updated;
        this.notify.success('Etkinlik durumu güncellendi.');
        this.confirmData = null;
      },
      error: (err) => {
        this.notify.error(err?.message ?? 'Durum değiştirilemedi.');
        this.confirmData = null;
      },
    });
  }
}
