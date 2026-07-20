import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Kritik iş kuralı #5: Aynı bilet kodu ile ikinci kez check-in yapılamaz.
 * Bu validator, verilen koleksiyonda kodun daha önce kullanılıp
 * kullanılmadığını senkron biçimde kontrol eder (liste component
 * tarafından servis üzerinden sağlanır).
 */
export function uniqueValueValidator(existingValues: () => string[], currentValue?: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    if (currentValue && control.value === currentValue) return null;
    const values = existingValues().map((v) => v.trim().toLowerCase());
    return values.includes(String(control.value).trim().toLowerCase()) ? { duplicate: true } : null;
  };
}
