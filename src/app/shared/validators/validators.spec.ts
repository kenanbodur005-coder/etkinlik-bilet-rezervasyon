import { FormControl, FormGroup } from '@angular/forms';
import { maxCapacityValidator, positiveIntegerValidator } from './capacity.validator';
import { dateRangeValidator, futureDateValidator } from './date-range.validator';
import { uniqueValueValidator } from './unique-code.validator';

describe('maxCapacityValidator', () => {
  it('kontenjan üst sınırı aşıldığında hata döner', () => {
    const validator = maxCapacityValidator(() => 100);
    const control = new FormControl(150);
    expect(validator(control)).toEqual({ maxCapacity: { max: 100, actual: 150 } });
  });

  it('kontenjan üst sınır içindeyse geçerlidir', () => {
    const validator = maxCapacityValidator(() => 100);
    const control = new FormControl(80);
    expect(validator(control)).toBeNull();
  });

  it('değer üst sınıra eşitse geçerlidir (sınır dahil)', () => {
    const validator = maxCapacityValidator(() => 100);
    const control = new FormControl(100);
    expect(validator(control)).toBeNull();
  });

  it('boş değer için hata döndürmez', () => {
    const validator = maxCapacityValidator(() => 100);
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });
});

describe('positiveIntegerValidator', () => {
  it('negatif sayı için hata döner', () => {
    expect(positiveIntegerValidator(new FormControl(-5))).toEqual({ positiveInteger: true });
  });

  it('sıfır için hata döner', () => {
    expect(positiveIntegerValidator(new FormControl(0))).toEqual({ positiveInteger: true });
  });

  it('ondalıklı sayı için hata döner', () => {
    expect(positiveIntegerValidator(new FormControl(2.5))).toEqual({ positiveInteger: true });
  });

  it('pozitif tam sayı için geçerlidir', () => {
    expect(positiveIntegerValidator(new FormControl(10))).toBeNull();
  });
});

describe('dateRangeValidator', () => {
  it('bitiş tarihi başlangıçtan önceyse hata döner', () => {
    const group = new FormGroup({
      startDate: new FormControl('2026-08-10'),
      endDate: new FormControl('2026-08-05'),
    });
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toEqual({ dateRange: true });
  });

  it('bitiş tarihi başlangıçtan sonraysa geçerlidir', () => {
    const group = new FormGroup({
      startDate: new FormControl('2026-08-10'),
      endDate: new FormControl('2026-08-15'),
    });
    const validator = dateRangeValidator('startDate', 'endDate');
    expect(validator(group)).toBeNull();
  });
});

describe('futureDateValidator', () => {
  it('geçmiş tarih için hata döner', () => {
    const control = new FormControl('2020-01-01');
    expect(futureDateValidator(control)).toEqual({ pastDate: true });
  });

  it('gelecek tarih için geçerlidir', () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString().substring(0, 10);
    const control = new FormControl(future);
    expect(futureDateValidator(control)).toBeNull();
  });
});

describe('uniqueValueValidator', () => {
  it('mevcut listede olan değer için hata döner', () => {
    const validator = uniqueValueValidator(() => ['abc@example.com', 'xyz@example.com']);
    const control = new FormControl('ABC@example.com'); // case-insensitive kontrol
    expect(validator(control)).toEqual({ duplicate: true });
  });

  it('düzenleme sırasında kendi mevcut değeri hariç tutulur', () => {
    const validator = uniqueValueValidator(() => ['abc@example.com'], 'abc@example.com');
    const control = new FormControl('abc@example.com');
    expect(validator(control)).toBeNull();
  });

  it('listede olmayan değer için geçerlidir', () => {
    const validator = uniqueValueValidator(() => ['abc@example.com']);
    const control = new FormControl('new@example.com');
    expect(validator(control)).toBeNull();
  });
});
