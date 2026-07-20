import { BaseEntity } from '../../../core/models/base-entity.model';
import { CancellationReason } from '../../../core/models/enums';

/** İptal/iade işleminin kaydı (audit ve raporlama için ayrı model). */
export interface CancellationRequest extends BaseEntity {
  reservationId: string;
  reason: CancellationReason;
  note?: string;
  refundAmount: number;
  processedByRole: string;
  processedByName: string;
}
