import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { AuditLogEntry } from '../models/audit-log-entry.model';
import { DataTableComponent, DataTableColumn } from '../../../shared/components/data-table.component';
import { StatusLabelPipe } from '../../../shared/pipes/status-label.pipe';
import { TrDatePipe } from '../../../shared/pipes/date-format.pipe';
import { AuditActionType, AUDIT_ACTION_LABELS } from '../../../core/models/enums';

@Component({
  selector: 'app-audit-log-page',
  standalone: true,
  imports: [CommonModule, FormsModule, DataTableComponent, StatusLabelPipe, TrDatePipe],
  template: `
    <div class="page-header">
      <div class="page-header__title">
        <h1>Audit Log</h1>
        <p>Fiyat, kontenjan, iptal, check-in ve durum değişikliği gibi kritik işlemlerin kaydı.</p>
      </div>
    </div>

    <app-data-table
      [columns]="columns"
      [rows]="pageRows"
      [total]="filtered.length"
      [page]="page"
      [pageSize]="pageSize"
      [hasActions]="false"
      emptyTitle="Kayıt bulunamadı"
      emptySubtitle="Filtreleri değiştirin."
      (searchChange)="onSearch($event)"
      (pageChange)="onPageChange($event)"
    >
      <div toolbar-actions>
        <select class="form-control" style="width:auto" [(ngModel)]="actionFilter" (ngModelChange)="applyFilter()">
          <option [ngValue]="undefined">Tüm İşlem Tipleri</option>
          <option *ngFor="let a of actionTypes" [ngValue]="a">{{ actionLabels[a] }}</option>
        </select>
      </div>
      <tr table-rows *ngFor="let entry of pageRows">
        <td>{{ entry.timestamp | trDate }}</td>
        <td><span class="badge badge-info">{{ entry.actionType | statusLabel }}</span></td>
        <td>{{ entry.entityType }}</td>
        <td>{{ entry.entityLabel }}</td>
        <td>{{ entry.description }}</td>
        <td>{{ entry.performedByName }}</td>
      </tr>
    </app-data-table>
  `,
})
export class AuditLogPageComponent implements OnInit {
  columns: DataTableColumn[] = [
    { field: 'timestamp', header: 'Tarih' },
    { field: 'actionType', header: 'İşlem' },
    { field: 'entityType', header: 'Varlık' },
    { field: 'entityLabel', header: 'Kayıt' },
    { field: 'description', header: 'Açıklama' },
    { field: 'performedByName', header: 'Kullanıcı' },
  ];

  all: AuditLogEntry[] = [];
  filtered: AuditLogEntry[] = [];
  pageRows: AuditLogEntry[] = [];
  page = 1;
  pageSize = 12;
  search = '';
  actionFilter?: AuditActionType;
  actionTypes = Object.values(AuditActionType);
  actionLabels = AUDIT_ACTION_LABELS;

  constructor(private auditLogService: AuditLogService) {}

  ngOnInit(): void {
    this.all = this.auditLogService.getAll();
    this.applyFilter();
  }

  applyFilter(): void {
    let items = this.all;
    if (this.actionFilter) items = items.filter((e) => e.actionType === this.actionFilter);
    if (this.search) {
      const term = this.search.toLowerCase();
      items = items.filter((e) => JSON.stringify(e).toLowerCase().includes(term));
    }
    this.filtered = items;
    this.page = 1;
    this.updatePage();
  }

  onSearch(term: string): void {
    this.search = term;
    this.applyFilter();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.updatePage();
  }

  private updatePage(): void {
    const start = (this.page - 1) * this.pageSize;
    this.pageRows = this.filtered.slice(start, start + this.pageSize);
  }
}
