import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ROLE_LABELS } from '../core/models/enums';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="topbar">
      <div class="topbar__title">
        <h1 style="margin:0">Etkinlik, Bilet ve Rezervasyon Yönetim Paneli</h1>
      </div>
      <div class="topbar__user">
        <span class="topbar__role-label">Demo kullanıcı</span>
        <select class="form-control" style="width:auto" [value]="auth.currentUser().id" (change)="onSwitch($event)">
          <option *ngFor="let u of auth.demoUsers" [value]="u.id">{{ u.name }} — {{ roleLabels[u.role] }}</option>
        </select>
      </div>
    </header>
  `,
  styles: [
    `
      .topbar {
        height: var(--topbar-height);
        background: var(--color-surface);
        border-bottom: 1px solid var(--color-border);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-6);
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .topbar__title h1 {
        font-size: 15px;
        font-weight: 700;
      }
      .topbar__user {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .topbar__role-label {
        font-size: 12px;
        color: var(--color-text-muted);
      }
    `,
  ],
})
export class TopbarComponent {
  roleLabels = ROLE_LABELS;
  constructor(public auth: AuthService) {}

  onSwitch(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    this.auth.login(id);
  }
}
