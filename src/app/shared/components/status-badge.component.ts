import { Component, Input, computed } from '@angular/core';
import { StatusLabelPipe } from '../pipes/status-label.pipe';

type BadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONE_MAP: Record<string, BadgeTone> = {
  // Event status
  DRAFT: 'neutral',
  PUBLISHED: 'info',
  ONGOING: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'danger',
  // Reservation status
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  REFUNDED: 'neutral',
};

/** Enum durum değerini renkli rozet olarak gösterir (ör. rezervasyon/etkinlik durumu). */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [StatusLabelPipe],
  template: `<span class="badge" [class]="'badge-' + tone">{{ value | statusLabel }}</span>`,
})
export class StatusBadgeComponent {
  @Input({ required: true }) value!: string;

  get tone(): BadgeTone {
    return TONE_MAP[this.value] ?? 'neutral';
  }
}
