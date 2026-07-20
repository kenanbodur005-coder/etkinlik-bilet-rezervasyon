import { Pipe, PipeTransform } from '@angular/core';

/** ISO tarihleri dd.MM.yyyy HH:mm biçiminde gösterir. */
@Pipe({ name: 'trDate', standalone: true })
export class TrDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, withTime = true): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
    if (!withTime) return date;
    return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
