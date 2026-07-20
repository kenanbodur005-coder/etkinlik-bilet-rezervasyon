import { Injectable } from '@angular/core';

/**
 * localStorage tabanlı kalıcılık katmanı.
 * Component veya feature servisleri doğrudan localStorage'a erişmez;
 * tüm okuma/yazma işlemleri bu servis üzerinden yapılır.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly prefix = 'ebr:'; // Etkinlik-Bilet-Rezervasyon namespace

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T): void {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // localStorage dolu / kullanılamıyor olabilir; sessizce yut, uygulama
      // in-memory state ile çalışmaya devam eder.
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  clearAll(): void {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(this.prefix))
      .forEach((k) => localStorage.removeItem(k));
  }

  hasSeed(key: string): boolean {
    return localStorage.getItem(this.prefix + key) !== null;
  }
}
