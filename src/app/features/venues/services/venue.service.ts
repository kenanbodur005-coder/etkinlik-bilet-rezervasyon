import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MockApiService } from '../../../core/services/mock-api.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { Venue } from '../models/venue.model';
import { PagedResult } from '../../../core/models/base-entity.model';
import { AuditActionType } from '../../../core/models/enums';

const COLLECTION = 'venues';

/**
 * Mekan/salon kapasitesi yönetimi facade servisi.
 * Component'ler doğrudan MockApiService veya storage'a erişmez; bu servis
 * üzerinden CRUD + iş kuralı (audit log üretimi) sağlanır.
 */
@Injectable({ providedIn: 'root' })
export class VenueService {
  constructor(private api: MockApiService<Venue>, private audit: AuditLogService) {}

  list(page: number, pageSize: number, search?: string, sortField = 'name', sortDir: 'asc' | 'desc' = 'asc'): Observable<PagedResult<Venue>> {
    return this.api.list(COLLECTION, { page, pageSize, search, sortField, sortDir });
  }

  getById(id: string): Observable<Venue> {
    return this.api.getById(COLLECTION, id);
  }

  create(input: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>): Observable<Venue> {
    const now = new Date().toISOString();
    const venue: Venue = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    return this.api.create(COLLECTION, venue).pipe(
      tap((created) =>
        this.audit.record({
          actionType: AuditActionType.CREATE,
          entityType: 'Venue',
          entityId: created.id,
          entityLabel: created.name,
          description: `"${created.name}" mekanı oluşturuldu (kapasite: ${created.totalCapacity}).`,
        })
      )
    );
  }

  update(id: string, patch: Partial<Venue>, previous: Venue): Observable<Venue> {
    return this.api.update(COLLECTION, id, patch).pipe(
      tap((updated) =>
        this.audit.record({
          actionType: AuditActionType.UPDATE,
          entityType: 'Venue',
          entityId: id,
          entityLabel: updated.name,
          description: `"${updated.name}" mekanı güncellendi.`,
          oldValue: { totalCapacity: previous.totalCapacity },
          newValue: { totalCapacity: updated.totalCapacity },
        })
      )
    );
  }

  softDelete(venue: Venue): Observable<Venue> {
    return this.update(venue.id, { isActive: false }, venue).pipe(
      tap(() =>
        this.audit.record({
          actionType: AuditActionType.DELETE,
          entityType: 'Venue',
          entityId: venue.id,
          entityLabel: venue.name,
          description: `"${venue.name}" mekanı pasife alındı.`,
        })
      )
    );
  }

  allActiveSync(): Venue[] {
    return this.api.allSync(COLLECTION).filter((v) => v.isActive);
  }
}
