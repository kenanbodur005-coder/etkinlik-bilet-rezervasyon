import { BaseEntity } from '../../../core/models/base-entity.model';
import { AuditActionType } from '../../../core/models/enums';

export interface AuditLogEntry extends BaseEntity {
  actionType: AuditActionType;
  entityType: string; // 'Event' | 'Reservation' | 'TicketType' | ...
  entityId: string;
  entityLabel: string; // ekranda gösterilecek kısa ad (ör. etkinlik adı)
  performedByRole: string; // UserRole
  performedByName: string;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
  timestamp: string; // ISO
}
