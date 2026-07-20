import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { fromEvent } from 'rxjs';

/**
 * Arama kutularında kullanılır: kullanıcı yazmayı bitirdikten belirli bir
 * süre sonra appDebounceInput event'i tetiklenir (search debounce gereksinimi).
 */
@Directive({
  selector: '[appDebounceInput]',
  standalone: true,
})
export class DebounceInputDirective implements OnInit, OnDestroy {
  @Input() debounceMs = 350;
  @Output() debouncedInput = new EventEmitter<string>();

  private sub?: Subscription;
  private input$ = new Subject<string>();

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.sub = fromEvent(this.el.nativeElement, 'input')
      .pipe(debounceTime(this.debounceMs), distinctUntilChanged())
      .subscribe(() => this.debouncedInput.emit(this.el.nativeElement.value));
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
