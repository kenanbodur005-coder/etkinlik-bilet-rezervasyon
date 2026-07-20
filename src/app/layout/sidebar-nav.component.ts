import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PermissionDirective } from '../shared/directives/permission.directive';
import { UserRole } from '../core/models/enums';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  roles?: UserRole[];
}

@Component({
  selector: 'app-sidebar-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, PermissionDirective],
  template: `
    <aside class="sidebar">
      <div class="sidebar__brand">
        <div class="sidebar__logo">EB</div>
        <div>
          <div class="sidebar__brand-title">Etkinlik Paneli</div>
          <div class="sidebar__brand-sub">Bilet & Rezervasyon</div>
        </div>
      </div>

      <nav class="sidebar__nav">
        <ng-container *ngFor="let item of items">
          <a
            *appPermission="item.roles ?? []"
            [routerLink]="item.path"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.path === '/dashboard' }"
            class="sidebar__link"
          >
            <span class="sidebar__icon" [innerHTML]="item.icon"></span>
            <span>{{ item.label }}</span>
          </a>
        </ng-container>
      </nav>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        width: var(--sidebar-width);
        background: #161b2c;
        color: #cfd4e4;
        display: flex;
        flex-direction: column;
        z-index: 10;
        overflow-y: auto;
      }
      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 20px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .sidebar__logo {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        background: linear-gradient(135deg, #3454d1, #6d8bff);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        color: #fff;
        flex-shrink: 0;
      }
      .sidebar__brand-title {
        font-size: 13.5px;
        font-weight: 700;
        color: #fff;
      }
      .sidebar__brand-sub {
        font-size: 11px;
        color: #8c93ab;
      }
      .sidebar__nav {
        padding: 14px 10px;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .sidebar__link {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 12px;
        border-radius: 8px;
        color: #b7bdd1;
        font-size: 13.2px;
        font-weight: 500;
        transition: background 0.15s ease, color 0.15s ease;
      }
      .sidebar__link:hover {
        background: rgba(255, 255, 255, 0.06);
        color: #fff;
      }
      .sidebar__link.active {
        background: var(--color-primary);
        color: #fff;
      }
      .sidebar__icon {
        display: flex;
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }
      @media (max-width: 900px) {
        .sidebar {
          display: none;
        }
      }
    `,
  ],
})
export class SidebarNavComponent {
  private icon = {
    dashboard: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
    events: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    venues: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>',
    tickets: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9z"/></svg>',
    reservations: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 14l2 2 4-4"/></svg>',
    checkin: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>',
    reports: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3v18h18M7 15l4-6 3 3 5-7"/></svg>',
    audit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 2h6l6 6v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M9 12h6M9 16h6M9 8h2"/></svg>',
  };

  items: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: this.icon.dashboard },
    { path: '/etkinlikler', label: 'Etkinlikler', icon: this.icon.events },
    { path: '/mekanlar', label: 'Mekanlar', icon: this.icon.venues, roles: [UserRole.EVENT_MANAGER] },
    { path: '/bilet-tipleri', label: 'Bilet Tipleri', icon: this.icon.tickets },
    { path: '/rezervasyonlar', label: 'Rezervasyonlar', icon: this.icon.reservations },
    { path: '/check-in', label: 'Check-in', icon: this.icon.checkin, roles: [UserRole.CHECKIN_STAFF, UserRole.EVENT_MANAGER] },
    { path: '/raporlar', label: 'Raporlar', icon: this.icon.reports, roles: [UserRole.EVENT_MANAGER] },
    { path: '/audit-log', label: 'Audit Log', icon: this.icon.audit, roles: [UserRole.EVENT_MANAGER] },
  ];
}
