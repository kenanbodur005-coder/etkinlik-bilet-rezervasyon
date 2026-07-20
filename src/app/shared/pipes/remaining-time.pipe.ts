import { Pipe, PipeTransform } from '@angular/core';

/** Bir tarihe kalan süreyi (veya geçen süreyi) okunabilir biçimde gösterir. */
@Pipe({ name: 'remainingTime', standalone: true, pure: false })
export class RemainingTimePipe implements PipeTransform {
  transform(dateValue: string | Date | null | undefined): string {
    if (!dateValue) return '-';
    const target = new Date(dateValue).getTime();
    const now = Date.now();
    const diffMs = target - now;
    const abs = Math.abs(diffMs);

    const minutes = Math.floor(abs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let text: string;
    if (days > 0) text = `${days} gün ${hours % 24} saat`;
    else if (hours > 0) text = `${hours} saat ${minutes % 60} dk`;
    else if (minutes > 0) text = `${minutes} dk`;
    else text = 'az önce';

    return diffMs >= 0 ? `${text} sonra` : `${text} önce`;
  }
}
