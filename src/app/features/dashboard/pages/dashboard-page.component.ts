import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from '../services/dashboard.service';
import { RevenueSummary } from '../models/revenue-summary.model';
import { KpiCardComponent } from '../../../shared/components/state-and-kpi.component';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterModule, KpiCardComponent, MoneyPipe, StatusLabelPipe, EmptyStateComponent],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Dashboard</h1>
        <p>Mevcut verilere göre anlık hesaplanan genel bakış.</p>
      </div>
    </div>

    <div class="kpi-grid">
      <app-kpi-card label="Toplam Gelir" [value]="summary.totalRevenue | money" hint="Onaylı + check-in yapılmış rezervasyonlar"></app-kpi-card>
      <app-kpi-card label="Toplam Rezervasyon" [value]="summary.totalReservations"></app-kpi-card>
      <app-kpi-card
        label="Doluluk Oranı"
        [value]="summary.overallOccupancyRate + '%'"
        [trend]="summary.overallOccupancyRate > 60 ? 'up' : 'flat'"
        trendLabel="genel"
      ></app-kpi-card>
      <app-kpi-card
        label="İptal Oranı"
        [value]="summary.cancellationRate + '%'"
        [trend]="summary.cancellationRate > 20 ? 'down' : 'flat'"
        trendLabel="genel"
      ></app-kpi-card>
    </div>

    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;align-items:start" class="dashboard-grid">
      <div class="card">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <h2 style="margin:0">Etkinlik Bazında Gelir</h2>
            <a routerLink="/raporlar" class="btn btn-ghost btn-sm">Tüm Raporlar</a>
          </div>
          <div class="data-table-wrap" *ngIf="summary.revenueByEvent.length > 0; else noRevenue">
            <table class="data-table">
              <thead><tr><th>Etkinlik</th><th>Rezervasyon</th><th>Doluluk</th><th>Gelir</th></tr></thead>
              <tbody>
                <tr *ngFor="let r of summary.revenueByEvent">
                  <td>{{ r.eventTitle }}</td>
                  <td>{{ r.reservationCount }}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div style="width:70px;height:6px;background:var(--color-neutral-soft);border-radius:4px;overflow:hidden">
                        <div [style.width.%]="r.occupancyRate" style="height:100%;background:var(--color-primary)"></div>
                      </div>
                      <span style="font-size:12px;color:var(--color-text-muted)">{{ r.occupancyRate }}%</span>
                    </div>
                  </td>
                  <td><strong>{{ r.revenue | money }}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noRevenue><app-empty-state title="Henüz gelir verisi yok"></app-empty-state></ng-template>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h2>Rezervasyon Durumları</h2>
          <div *ngFor="let s of summary.statusDistribution" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
              <span>{{ s.status | statusLabel }}</span>
              <strong>{{ s.count }}</strong>
            </div>
            <div style="width:100%;height:6px;background:var(--color-neutral-soft);border-radius:4px;overflow:hidden">
              <div [style.width.%]="percentage(s.count)" style="height:100%;background:var(--color-primary)"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @media (max-width: 900px) {
        .dashboard-grid {
          grid-template-columns: 1fr !important;
        }
      }
    `,
  ],
})
export class DashboardPageComponent implements OnInit {
  summary!: RevenueSummary;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.summary = this.dashboardService.computeSummary();
  }

  percentage(count: number): number {
    return this.summary.totalReservations > 0 ? Math.round((count / this.summary.totalReservations) * 100) : 0;
  }
}
