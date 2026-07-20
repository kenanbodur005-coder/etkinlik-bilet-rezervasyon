import { Injectable, computed, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { UserRole } from '../models/enums';

export interface DemoUser {
  id: string;
  name: string;
  role: UserRole;
}

const SESSION_KEY = 'session-user';

/**
 * Backend olmadığı için gerçek kimlik doğrulama yerine rol tabanlı bir
 * "demo kullanıcı seçimi" simüle edilir. Route guard'lar ve permission
 * directive'i bu servisin verdiği role göre çalışır.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly demoUsers: DemoUser[] = [
    { id: 'u-1', name: 'Elif Yönetici', role: UserRole.EVENT_MANAGER },
    { id: 'u-2', name: 'Barış Gişe', role: UserRole.BOX_OFFICE_OPERATOR },
    { id: 'u-3', name: 'Deniz Kontrol', role: UserRole.CHECKIN_STAFF },
  ];

  private readonly _currentUser = signal<DemoUser>(this.demoUsers[0]);
  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => !!this._currentUser());

  constructor(private storage: StorageService) {
    this._currentUser.set(this.restore());
  }

  private restore(): DemoUser {
    const saved = this.storage.read<DemoUser | null>(SESSION_KEY, null);
    if (!saved) return this.demoUsers[0];
    // Kayıtlı kullanıcı listesiyle eşleştir (rol adları vs. güncel kalsın)
    return this.demoUsers.find((u) => u.id === saved.id) ?? this.demoUsers[0];
  }

  login(userId: string): void {
    const user = this.demoUsers.find((u) => u.id === userId) ?? this.demoUsers[0];
    this._currentUser.set(user);
    this.storage.write(SESSION_KEY, user);
  }

  hasRole(...roles: UserRole[]): boolean {
    return roles.includes(this._currentUser().role);
  }

  logout(): void {
    this.storage.remove(SESSION_KEY);
    this._currentUser.set(this.demoUsers[0]);
  }
}
