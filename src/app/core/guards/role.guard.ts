import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { UserRole } from '../models/enums';

/**
 * route.data['roles'] içinde tanımlı rollerden birine sahip olmayan
 * kullanıcıların ilgili sayfaya erişimini engeller.
 * Kullanım: { path: 'audit-log', canActivate: [roleGuard], data: { roles: [UserRole.EVENT_MANAGER] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notify = inject(NotificationService);

  const allowed = (route.data?.['roles'] as UserRole[] | undefined) ?? [];
  if (allowed.length === 0 || auth.hasRole(...allowed)) {
    return true;
  }

  notify.error('Bu sayfaya erişim yetkiniz bulunmuyor.');
  return router.parseUrl('/dashboard');
};
