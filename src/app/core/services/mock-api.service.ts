import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { StorageService } from './storage.service';
import { BaseEntity, PageQuery, PagedResult } from '../models/base-entity.model';

export class ApiError extends Error {
  constructor(message: string, public readonly code: string = 'UNKNOWN') {
    super(message);
  }
}

/**
 * Backend bulunmadığı için generic bir "fake async API" katmanı.
 * Her feature servisi (EventService, ReservationService, ...) bu sınıfın
 * üzerine kurulur; component içinde veri erişimi / gecikme / hata
 * simülasyonu yazılmaz.
 *
 * - Gerçekçi ağ gecikmesi simüle eder (250-650ms)
 * - %6 ihtimalle rastgele "sunucu hatası" fırlatır (hata senaryolarını
 *   test edebilmek için)
 * - CRUD + sayfalama/arama/sıralama sağlar
 * - Kalıcılık StorageService (localStorage) üzerinden yapılır
 */
@Injectable({ providedIn: 'root' })
export class MockApiService<T extends BaseEntity> {
  constructor(private storage: StorageService) {}

  private randomDelay(): number {
    return 250 + Math.random() * 400;
  }

  private maybeFail(errorRate: number): void {
    if (Math.random() < errorRate) {
      throw new ApiError('Sunucuya ulaşılamadı, lütfen tekrar deneyin.', 'NETWORK');
    }
  }

  private load(collection: string): T[] {
    return this.storage.read<T[]>(collection, []);
  }

  private save(collection: string, items: T[]): void {
    this.storage.write(collection, items);
  }

  seedIfEmpty(collection: string, seed: T[]): void {
    if (!this.storage.hasSeed(collection)) {
      this.save(collection, seed);
    }
  }

  list(collection: string, query?: Partial<PageQuery>, errorRate = 0.03): Observable<PagedResult<T>> {
    return of(null).pipe(
      delay(this.randomDelay()),
      mergeMap(() => {
        try {
          this.maybeFail(errorRate);
          let items = [...this.load(collection)];

          if (query?.search) {
            const term = query.search.toLowerCase();
            items = items.filter((it) => JSON.stringify(it).toLowerCase().includes(term));
          }

          if (query?.sortField) {
            const field = query.sortField as keyof T;
            const dir = query.sortDir === 'desc' ? -1 : 1;
            items = items.sort((a, b) => {
              const av = a[field];
              const bv = b[field];
              if (av == null && bv == null) return 0;
              if (av == null) return -1 * dir;
              if (bv == null) return 1 * dir;
              if (av < bv) return -1 * dir;
              if (av > bv) return 1 * dir;
              return 0;
            });
          }

          const total = items.length;
          const page = query?.page ?? 1;
          const pageSize = query?.pageSize ?? 10;
          const start = (page - 1) * pageSize;
          const pageItems = pageSize > 0 ? items.slice(start, start + pageSize) : items;

          return of({ items: pageItems, total, page, pageSize });
        } catch (e) {
          return throwError(() => e);
        }
      })
    );
  }

  getById(collection: string, id: string, errorRate = 0.02): Observable<T> {
    return of(null).pipe(
      delay(this.randomDelay()),
      mergeMap(() => {
        try {
          this.maybeFail(errorRate);
          const found = this.load(collection).find((it) => it.id === id);
          if (!found) {
            return throwError(() => new ApiError('Kayıt bulunamadı.', 'NOT_FOUND'));
          }
          return of(found);
        } catch (e) {
          return throwError(() => e);
        }
      })
    );
  }

  create(collection: string, entity: T, errorRate = 0.04): Observable<T> {
    return of(null).pipe(
      delay(this.randomDelay()),
      mergeMap(() => {
        try {
          this.maybeFail(errorRate);
          const items = this.load(collection);
          items.push(entity);
          this.save(collection, items);
          return of(entity);
        } catch (e) {
          return throwError(() => e);
        }
      })
    );
  }

  update(collection: string, id: string, patch: Partial<T>, errorRate = 0.04): Observable<T> {
    return of(null).pipe(
      delay(this.randomDelay()),
      mergeMap(() => {
        try {
          this.maybeFail(errorRate);
          const items = this.load(collection);
          const idx = items.findIndex((it) => it.id === id);
          if (idx === -1) {
            return throwError(() => new ApiError('Kayıt bulunamadı.', 'NOT_FOUND'));
          }
          const updated = { ...items[idx], ...patch, updatedAt: new Date().toISOString() } as T;
          items[idx] = updated;
          this.save(collection, items);
          return of(updated);
        } catch (e) {
          return throwError(() => e);
        }
      })
    );
  }

  remove(collection: string, id: string, errorRate = 0.03): Observable<void> {
    return of(null).pipe(
      delay(this.randomDelay()),
      mergeMap(() => {
        try {
          this.maybeFail(errorRate);
          const items = this.load(collection).filter((it) => it.id !== id);
          this.save(collection, items);
          return of(void 0);
        } catch (e) {
          return throwError(() => e);
        }
      })
    );
  }

  /** Sayfalama olmadan tüm koleksiyonu okur (dashboard hesaplamaları için). */
  allSync(collection: string): T[] {
    return this.load(collection);
  }

  saveAllSync(collection: string, items: T[]): void {
    this.save(collection, items);
  }
}
