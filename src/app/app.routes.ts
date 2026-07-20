import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';
import { UserRole } from './core/models/enums';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/pages/dashboard-page.component').then((m) => m.DashboardPageComponent),
    title: 'Dashboard',
  },

  {
    path: 'etkinlikler',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/pages/list/event-list-page.component').then((m) => m.EventListPageComponent),
    title: 'Etkinlikler',
  },
  {
    path: 'etkinlikler/yeni',
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { roles: [UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/events/pages/form/event-form-page.component').then((m) => m.EventFormPageComponent),
    title: 'Yeni Etkinlik',
  },
  {
    path: 'etkinlikler/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/pages/detail/event-detail-page.component').then((m) => m.EventDetailPageComponent),
    title: 'Etkinlik Detayı',
  },
  {
    path: 'etkinlikler/:id/duzenle',
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { roles: [UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/events/pages/form/event-form-page.component').then((m) => m.EventFormPageComponent),
    title: 'Etkinliği Düzenle',
  },

  {
    path: 'mekanlar',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/venues/pages/venue-list-page.component').then((m) => m.VenueListPageComponent),
    title: 'Mekanlar',
  },

  {
    path: 'bilet-tipleri',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/ticket-types/pages/ticket-type-list-page.component').then((m) => m.TicketTypeListPageComponent),
    title: 'Bilet Tipleri',
  },

  {
    path: 'rezervasyonlar',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/pages/list/reservation-list-page.component').then((m) => m.ReservationListPageComponent),
    title: 'Rezervasyonlar',
  },
  {
    path: 'rezervasyonlar/yeni',
    canActivate: [authGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { roles: [UserRole.EVENT_MANAGER, UserRole.BOX_OFFICE_OPERATOR] },
    loadComponent: () =>
      import('./features/reservations/pages/form/reservation-form-page.component').then((m) => m.ReservationFormPageComponent),
    title: 'Yeni Rezervasyon',
  },
  {
    path: 'rezervasyonlar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/reservations/pages/detail/reservation-detail-page.component').then((m) => m.ReservationDetailPageComponent),
    title: 'Rezervasyon Detayı',
  },

  {
    path: 'check-in',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.CHECKIN_STAFF, UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/check-in/pages/check-in-page.component').then((m) => m.CheckInPageComponent),
    title: 'Check-in',
  },

  {
    path: 'raporlar',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/reports/pages/reports-page.component').then((m) => m.ReportsPageComponent),
    title: 'Raporlar',
  },

  {
    path: 'audit-log',
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.EVENT_MANAGER] },
    loadComponent: () => import('./features/audit-log/pages/audit-log-page.component').then((m) => m.AuditLogPageComponent),
    title: 'Audit Log',
  },

  { path: '**', redirectTo: 'dashboard' },
];
