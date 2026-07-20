import { Injectable, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { AuditActionType } from '../models/enums';
import { AuditLogEntry } from '../../features/audit-log/models/audit-log-entry.model';
import { AuthService } from './auth.service';

const COLLECTION = 'audit-log';

export interface RecordAuditParams {
  actionType: AuditActionType;
  entityType: string;
  entityId: string;
  entityLabel: string;
  description: string;
  oldValue?: unknown;
  newValue?: unknown;
}

/**
 * Kritik işlemleri (fiyat, kontenjan, iptal, check-in, durum değişikliği)
 * tarih, kullanıcı, eski/yeni değer bilgisiyle kaydeden merkezi servis.
 * Kritik iş kuralı #7: Fiyat, kontenjan, iptal ve check-in işlemleri
 * audit log üretir.
 */
@Injectable({ providedIn: 'root' })
export class AuditLogService {
  /** Reaktif olarak son kayıtları izlemek isteyen ekranlar (ör. dashboard) için. */
  readonly entries = signal<AuditLogEntry[]>([]);

  constructor(private storage: StorageService, private auth: AuthService) {
    this.entries.set(this.storage.read<AuditLogEntry[]>(COLLECTION, []));
  }

  record(params: RecordAuditParams): void {
    const user = this.auth.currentUser();
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      entityLabel: params.entityLabel,
      performedByRole: user.role,
      performedByName: user.name,
      description: params.description,
      oldValue: params.oldValue !== undefined ? this.stringify(params.oldValue) : null,
      newValue: params.newValue !== undefined ? this.stringify(params.newValue) : null,
    };

    const updated = [entry, ...this.storage.read<AuditLogEntry[]>(COLLECTION, [])];
    this.storage.write(COLLECTION, updated);
    this.entries.set(updated);
  }

  private stringify(value: unknown): string {
    if (value == null) return '-';
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

  getAll(): AuditLogEntry[] {
    return this.storage.read<AuditLogEntry[]>(COLLECTION, []);
  }
}
