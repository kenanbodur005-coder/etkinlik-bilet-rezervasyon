import { BaseEntity } from '../../../core/models/base-entity.model';

/** Mekan ve salon kapasitesi. Bir etkinlik en fazla bu kapasite kadar
 * kontenjana sahip olabilir (üst sınır referansı). */
export interface Venue extends BaseEntity {
  name: string;
  city: string;
  address: string;
  totalCapacity: number;
  description?: string;
  isActive: boolean; // "silme" soft-delete olarak uygulanır
}
