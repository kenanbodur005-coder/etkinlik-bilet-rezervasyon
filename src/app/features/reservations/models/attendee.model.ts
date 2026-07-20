import { BaseEntity } from '../../../core/models/base-entity.model';

export interface Attendee extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
}
