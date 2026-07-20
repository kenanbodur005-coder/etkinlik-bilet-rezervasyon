import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../dashboard/services/dashboard.service';
import { RevenueSummary } from '../../dashboard/models/revenue-summary.model';
import { ReservationService } from '../../reservations/services/reservation.service';
import { TicketTypeService } from '../../ticket-types/services/ticket-type.service';
import { EventService } from '../../events/services/event.service';
import { KpiCardComponent } from '../../../shared/components/state-and-kpi.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

interface TicketTypeBreakdown {
  ticketTypeName: string;
  eventTitle: string;
  category: string;
  price: number;
  sold: number;
  quota: number;
  revenue: number;
}

@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [CommonModule, KpiCardComponent, MoneyPipe, StatusLabelPipe, EmptyStateComponent],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Raporlar</h1>
        <p>Gelir, doluluk ve iptal oranlarının detaylı dökümü.</p>
      </div>
    </div>

    <div class="kpi-grid">
      <app-kpi-card label="Toplam Gelir" [value]="summary.totalRevenue | money"></app-kpi-card>
      <app-kpi-card label="Onaylanmış Rezervasyon" [value]="summary.confirmedCount"></app-kpi-card>
      <app-kpi-card label="Check-in Yapılan" [value]="summary.checkedInCount"></app-kpi-card>
      <app-kpi-card label="İptal / İade" [value]="summary.cancelledCount + summary.refundedCount"></app-kpi-card>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-body">
        <h2>Etkinlik Bazında Detaylı Gelir ve Doluluk</h2>
        <div class="data-table-wrap" *ngIf="summary.revenueByEvent.length > 0; else noData">
          <table class="data-table">
            <thead><tr><th>Etkinlik</th><th>Rezervasyon Sayısı</th><th>Doluluk Oranı</th><th>Toplam Gelir</th></tr></thead>
            <tbody>
              <tr *ngFor="let r of summary.revenueByEvent">
                <td>{{ r.eventTitle }}</td>
                <td>{{ r.reservationCount }}</td>
                <td>{{ r.occupancyRate }}%</td>
                <td><strong>{{ r.revenue | money }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noData><app-empty-state title="Henüz veri yok"></app-empty-state></ng-template>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px">
      <div class="card-body">
        <h2>Bilet Tipi Bazında Satış Dökümü</h2>
        <div class="data-table-wrap" *ngIf="ticketBreakdown.length > 0; else noTicketData">
          <table class="data-table">
            <thead><tr><th>Bilet Tipi</th><th>Etkinlik</th><th>Kategori</th><th>Fiyat</th><th>Satılan / Kontenjan</th><th>Gelir</th></tr></thead>
            <tbody>
              <tr *ngFor="let t of ticketBreakdown">
                <td>{{ t.ticketTypeName }}</td>
                <td>{{ t.eventTitle }}</td>
                <td>{{ t.category | statusLabel }}</td>
                <td>{{ t.price | money }}</td>
                <td>{{ t.sold }} / {{ t.quota }}</td>
                <td><strong>{{ t.revenue | money }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noTicketData><app-empty-state title="Henüz bilet tipi verisi yok"></app-empty-state></ng-template>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h2>Durum Dağılımı</h2>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead><tr><th>Durum</th><th>Adet</th><th>Oran</th></tr></thead>
            <tbody>
              <tr *ngFor="let s of summary.statusDistribution">
                <td>{{ s.status | statusLabel }}</td>
                <td>{{ s.count }}</td>
                <td>{{ percentage(s.count) }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class ReportsPageComponent implements OnInit {
  summary!: RevenueSummary;
  ticketBreakdown: TicketTypeBreakdown[] = [];

  constructor(
    private dashboardService: DashboardService,
    private reservationService: ReservationService,
    private ticketTypeService: TicketTypeService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.summary = this.dashboardService.computeSummary();

    const events = this.eventService.allActiveSync();
    const reservations = this.reservationService.allSync();
    const eventTitleById = new Map(events.map((e) => [e.id, e.title]));

    const allTicketTypes = events.flatMap((e) => this.ticketTypeService.byEventSync(e.id));
    this.ticketBreakdown = allTicketTypes
      .map((t) => {
        const relevant = reservations.filter(
          (r) => r.ticketTypeId === t.id && ['CONFIRMED', 'CHECKED_IN'].includes(r.status)
        );
        const sold = this.ticketTypeService.soldQuantitySync(t.id, reservations);
        const revenue = relevant.reduce((sum, r) => sum + r.totalPrice, 0);
        return {
          ticketTypeName: t.name,
          eventTitle: eventTitleById.get(t.eventId) ?? '-',
          category: t.category,
          price: t.price,
          sold,
          quota: t.allocatedQuota,
          revenue,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }

  percentage(count: number): number {
    return this.summary.totalReservations > 0 ? Math.round((count / this.summary.totalReservations) * 100) : 0;
  }
}
