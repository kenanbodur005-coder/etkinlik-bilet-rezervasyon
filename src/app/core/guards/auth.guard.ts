import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Demo projede gerçek bir login akışı yoktur; ancak yetkilendirme
 * mimarisinin varlığını göstermek için bir "oturum var mı" kontrolü
 * uygulanır. Varsayılan olarak her zaman bir demo kullanıcı seçili gelir.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  return router.parseUrl('/dashboard');
};
