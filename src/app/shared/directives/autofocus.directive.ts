import { AfterViewInit, Directive, ElementRef } from '@angular/core';

/** Form açıldığında ilk alana otomatik odaklanmayı sağlar. */
@Directive({
  selector: '[appAutofocus]',
  standalone: true,
})
export class AutofocusDirective implements AfterViewInit {
  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.el.nativeElement.focus(), 0);
  }
}
