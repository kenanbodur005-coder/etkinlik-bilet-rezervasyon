import { Pipe, PipeTransform } from '@angular/core';

/** Tutarları TL para birimi formatında gösterir. */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  private formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  });

  transform(value: number | null | undefined): string {
    if (value == null || Number.isNaN(value)) return '-';
    return this.formatter.format(value);
  }
}
