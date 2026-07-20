import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Bitiş tarihi başlangıç tarihinden önce olamaz. */
export function dateRangeValidator(startField: string, endField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start = group.get(startField)?.value;
    const end = group.get(endField)?.value;
    if (!start || !end) return null;
    return new Date(end).getTime() < new Date(start).getTime() ? { dateRange: true } : null;
  };
}

/** Etkinlik tarihi geçmişte olamaz (yeni kayıt oluştururken). */
export function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(control.value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() < today.getTime() ? { pastDate: true } : null;
}
