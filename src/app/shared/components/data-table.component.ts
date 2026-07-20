import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DebounceInputDirective } from '../directives/debounce-input.directive';
import { LoadingStateComponent, ErrorStateComponent } from './state-and-kpi.component';
import { EmptyStateComponent } from './empty-state.component';

export interface DataTableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
}

/**
 * Liste ekranlarının ortak iskeleti: arama (debounce), sıralama,
 * sayfalama, loading/empty/error state.
 * Veri erişimi bu bileşen içinde yapılmaz; parent component MockApiService
 * tabanlı feature servisini çağırıp sonucu bu bileşene input olarak verir.
 */
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, DebounceInputDirective, LoadingStateComponent, ErrorStateComponent, EmptyStateComponent],
  template: `
    <div class="card">
      <div class="table-toolbar">
        <input
          class="form-control"
          style="max-width:260px"
          type="text"
          placeholder="Ara..."
          appDebounceInput
          [debounceMs]="350"
          (debouncedInput)="searchChange.emit($event)"
        />
        <div class="spacer"></div>
        <ng-content select="[toolbar-actions]"></ng-content>
      </div>

      <div class="data-table-wrap" *ngIf="!loading && !error">
        <table class="data-table" *ngIf="rows.length > 0">
          <thead>
            <tr>
              <th
                *ngFor="let col of columns"
                [class.sortable]="col.sortable"
                [style.width]="col.width"
                (click)="col.sortable && onSort(col.field)"
              >
                {{ col.header }}
                <span *ngIf="sortField === col.field">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th *ngIf="hasActions" style="width:1%">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <ng-content select="[table-rows]"></ng-content>
          </tbody>
        </table>

        <app-empty-state
          *ngIf="rows.length === 0"
          [title]="emptyTitle"
          [subtitle]="emptySubtitle"
        ></app-empty-state>
      </div>

      <div *ngIf="loading" style="padding: 24px 0">
        <app-loading-state message="Kayıtlar yükleniyor..."></app-loading-state>
      </div>

      <div *ngIf="error && !loading">
        <app-error-state [message]="error" (retryClick)="retry.emit()"></app-error-state>
      </div>

      <div class="table-footer" *ngIf="!loading && !error && total > 0">
        <span>Toplam {{ total }} kayıttan {{ rangeStart }}-{{ rangeEnd }} gösteriliyor</span>
        <div class="pagination">
          <button [disabled]="page <= 1" (click)="pageChange.emit(page - 1)">‹</button>
          <button
            *ngFor="let p of pageNumbers"
            [class.active]="p === page"
            (click)="pageChange.emit(p)"
          >
            {{ p }}
          </button>
          <button [disabled]="page >= totalPages" (click)="pageChange.emit(page + 1)">›</button>
        </div>
      </div>
    </div>
  `,
})
export class DataTableComponent<T = any> {
  @Input() columns: DataTableColumn[] = [];
  @Input() rows: T[] = [];
  @Input() total = 0;
  @Input() page = 1;
  @Input() pageSize = 10;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() hasActions = true;
  @Input() sortField?: string;
  @Input() sortDir: 'asc' | 'desc' = 'asc';
  @Input() emptyTitle = 'Kayıt bulunamadı';
  @Input() emptySubtitle = 'Filtreleri değiştirin veya yeni bir kayıt oluşturun.';

  @Output() searchChange = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ field: string; dir: 'asc' | 'desc' }>();
  @Output() retry = new EventEmitter<void>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get rangeStart(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min(this.page * this.pageSize, this.total);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const span = 2;
    const start = Math.max(1, current - span);
    const end = Math.min(total, current + span);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }

  onSort(field: string): void {
    const dir = this.sortField === field && this.sortDir === 'asc' ? 'desc' : 'asc';
    this.sortChange.emit({ field, dir });
  }
}
