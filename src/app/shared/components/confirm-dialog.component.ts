import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * Silme/iptal/onay gibi kritik işlemler bu dialog onaylanmadan
 * gerçekleştirilmez (Projeye özel kabul kriteri).
 * Kullanım: <app-confirm-dialog *ngIf="showConfirm" [data]="confirmData"
 *              (confirmed)="onConfirm()" (cancelled)="showConfirm=false" />
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" (click)="onCancel()">
      <div class="modal-panel" (click)="$event.stopPropagation()">
        <h2>{{ data.title }}</h2>
        <p style="color: var(--color-text-muted)">{{ data.message }}</p>
        <div class="modal-panel__actions">
          <button class="btn btn-secondary" (click)="onCancel()">
            {{ data.cancelLabel ?? 'Vazgeç' }}
          </button>
          <button
            class="btn"
            [class.btn-danger]="data.danger"
            [class.btn-primary]="!data.danger"
            (click)="onConfirm()"
          >
            {{ data.confirmLabel ?? 'Onayla' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input({ required: true }) data!: ConfirmDialogData;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
