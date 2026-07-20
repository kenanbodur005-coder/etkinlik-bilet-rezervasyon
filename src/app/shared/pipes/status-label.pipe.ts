import { Pipe, PipeTransform } from '@angular/core';
import {
  EVENT_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  CANCELLATION_REASON_LABELS,
  AUDIT_ACTION_LABELS,
  ROLE_LABELS,
} from '../../core/models/enums';

const ALL_MAPS: Record<string, string>[] = [
  EVENT_STATUS_LABELS,
  RESERVATION_STATUS_LABELS,
  TICKET_CATEGORY_LABELS,
  CANCELLATION_REASON_LABELS,
  AUDIT_ACTION_LABELS,
  ROLE_LABELS,
];

/**
 * Enum değerlerini kullanıcıya gösterilecek Türkçe etikete çevirir.
 * Kullanım: {{ event.status | statusLabel }}
 */
@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '-';
    for (const map of ALL_MAPS) {
      if (value in map) return map[value];
    }
    return value;
  }
}
