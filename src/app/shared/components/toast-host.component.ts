import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack">
      <div class="toast" *ngFor="let t of notify.toasts()" [class]="t.type" (click)="notify.dismiss(t.id)">
        {{ t.message }}
      </div>
    </div>
  `,
})
export class ToastHostComponent {
  constructor(public notify: NotificationService) {}
}
