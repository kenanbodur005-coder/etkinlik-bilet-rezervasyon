import { Component, Input } from '@angular/core';

/** Liste ekranlarında kayıt bulunamadığında gösterilen ortak boş durum bileşeni. */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="state-block">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path
          d="M3 7h18M3 7l1.5 12a2 2 0 0 0 2 1.8h11a2 2 0 0 0 2-1.8L21 7M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        />
      </svg>
      <h3>{{ title }}</h3>
      <p style="margin:0">{{ subtitle }}</p>
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() title = 'Kayıt bulunamadı';
  @Input() subtitle = 'Filtreleri değiştirin veya yeni bir kayıt oluşturun.';
}
