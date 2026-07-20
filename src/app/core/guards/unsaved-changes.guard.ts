import { CanDeactivateFn } from '@angular/router';

/** Kaydedilmemiş form değişiklikleri varken sayfadan çıkışı onaylatır. */
export interface CanComponentDeactivate {
  hasUnsavedChanges(): boolean;
}

export const unsavedChangesGuard: CanDeactivateFn<CanComponentDeactivate> = (component) => {
  if (!component.hasUnsavedChanges || !component.hasUnsavedChanges()) return true;
  return confirm('Kaydedilmemiş değişiklikleriniz var. Sayfadan ayrılmak istediğinize emin misiniz?');
};
