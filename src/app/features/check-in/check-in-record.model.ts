import { BaseEntity } from '../../core/models/base-entity.model';

/** Kritik iş kuralı #5 ve #6: aynı kodla ikinci check-in yapılamaz;
 * check-in yalnızca onaylı (CONFIRMED) rezervasyon için yapılabilir. */
export interface CheckInRecord extends BaseEntity {
  reservationId: string;
  ticketCode: string;
  checkedInByRole: string;
  checkedInByName: string;
  checkedInAt: string;
}
