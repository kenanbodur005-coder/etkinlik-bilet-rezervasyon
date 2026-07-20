import { BaseEntity } from '../../../core/models/base-entity.model';
import { EventStatus } from '../../../core/models/enums';

export interface EventEntity extends BaseEntity {
  title: string;
  description: string;
  category: string;
  venueId: string;
  startDate: string; // ISO
  endDate: string; // ISO
  status: EventStatus;
  isDeleted: boolean; // soft delete
}

/** Etkinliğe ayrılan toplam kontenjan kuralı.
 * Kritik iş kuralı #2: bilet tipi kontenjanları toplamı bu değeri aşamaz.
 * Kritik iş kuralı #1: onaylı rezervasyon adedi bu değeri aşamaz. */
export interface CapacityRule extends BaseEntity {
  eventId: string;
  totalCapacity: number; // venue.totalCapacity'yi aşamaz
  notes?: string;
}
