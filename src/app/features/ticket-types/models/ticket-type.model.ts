import { BaseEntity } from '../../../core/models/base-entity.model';
import { TicketCategory } from '../../../core/models/enums';

export interface TicketType extends BaseEntity {
  eventId: string;
  name: string;
  category: TicketCategory;
  price: number;
  allocatedQuota: number; // bu bilet tipine ayrılan kontenjan
  isActive: boolean; // soft delete
}
