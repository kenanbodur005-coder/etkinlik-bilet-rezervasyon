import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  template: `
    <div class="state-block">
      <div class="spinner"></div>
      <p style="margin:0">{{ message }}</p>
    </div>
  `,
})
export class LoadingStateComponent {
  @Input() message = 'Yükleniyor...';
}

@Component({
  selector: 'app-error-state',
  standalone: true,
  template: `
    <div class="state-block">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger)" stroke-width="1.5">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <h3 style="color: var(--color-danger)">{{ title }}</h3>
      <p style="margin:0">{{ message }}</p>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px" (click)="retryClick.emit()">
        Tekrar Dene
      </button>
    </div>
  `,
})
export class ErrorStateComponent {
  @Input() title = 'Bir şeyler ters gitti';
  @Input() message = 'Veriler yüklenirken sunucu hatası oluştu.';
  @Output() retryClick = new EventEmitter<void>();
}

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:12.5px;color:var(--color-text-muted);font-weight:600">{{ label }}</span>
          <span
            class="badge"
            [class.badge-success]="trend === 'up'"
            [class.badge-danger]="trend === 'down'"
            [class.badge-neutral]="trend === 'flat' || !trend"
            *ngIf="trendLabel"
            >{{ trendLabel }}</span
          >
        </div>
        <div style="font-size:26px;font-weight:800;letter-spacing:-0.02em">{{ value }}</div>
        <div *ngIf="hint" style="font-size:12px;color:var(--color-text-muted);margin-top:4px">{{ hint }}</div>
      </div>
    </div>
  `,
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() hint?: string;
  @Input() trend?: 'up' | 'down' | 'flat';
  @Input() trendLabel?: string;
}
