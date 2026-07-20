import { BaseEntity } from '../../../core/models/base-entity.model';
import { ReservationStatus } from '../../../core/models/enums';

export interface Reservation extends BaseEntity {
  reservationCode: string; // check-in ekranında manuel girilecek kod
  eventId: string;
  ticketTypeId: string;
  attendeeId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: ReservationStatus;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  checkedInAt?: string | null;
}
