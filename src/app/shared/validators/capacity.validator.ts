import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Kritik iş kuralı #2: Bilet tipi kontenjanı, etkinliğin toplam
 * kapasitesinden fazla olamaz.
 * Kritik iş kuralı #1: Rezervasyon sayısı mekan kapasitesini aşamaz
 * (bu validator reservation formunda "kalan kontenjan" değeriyle de kullanılır).
 */
export function maxCapacityValidator(getMax: () => number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = Number(control.value);
    if (control.value === null || control.value === '' || Number.isNaN(value)) return null;
    const max = getMax();
    if (max == null || Number.isNaN(max)) return null;
    return value > max ? { maxCapacity: { max, actual: value } } : null;
  };
}

export function positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return { positiveInteger: true };
  }
  return null;
}
