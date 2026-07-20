import { TestBed } from '@angular/core/testing';
import { AuditLogService } from './audit-log.service';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { AuditActionType, UserRole } from '../models/enums';

describe('AuditLogService', () => {
  let auditLogService: AuditLogService;
  let authService: AuthService;
  let storage: StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    storage.clearAll();
    authService = TestBed.inject(AuthService);
    auditLogService = TestBed.inject(AuditLogService);
  });

  it('yeni bir kayıt eklendiğinde işlemi yapan kullanıcı ve rolü ile birlikte saklanır', () => {
    authService.login('u-1'); // Elif Yönetici - EVENT_MANAGER

    auditLogService.record({
      actionType: AuditActionType.PRICE_CHANGE,
      entityType: 'TicketType',
      entityId: 'tt-1',
      entityLabel: 'VIP Bilet',
      description: 'Fiyat değişti',
      oldValue: 100,
      newValue: 150,
    });

    const all = auditLogService.getAll();
    expect(all.length).toBe(1);
    expect(all[0].actionType).toBe(AuditActionType.PRICE_CHANGE);
    expect(all[0].performedByRole).toBe(UserRole.EVENT_MANAGER);
    expect(all[0].performedByName).toBe('Elif Yönetici');
    expect(all[0].oldValue).toBe('100');
    expect(all[0].newValue).toBe('150');
  });

  it('yeni kayıtlar en başa eklenir (en yeni en üstte)', () => {
    auditLogService.record({
      actionType: AuditActionType.CREATE,
      entityType: 'Event',
      entityId: 'e-1',
      entityLabel: 'Etkinlik 1',
      description: 'İlk kayıt',
    });
    auditLogService.record({
      actionType: AuditActionType.UPDATE,
      entityType: 'Event',
      entityId: 'e-1',
      entityLabel: 'Etkinlik 1',
      description: 'İkinci kayıt',
    });

    const all = auditLogService.getAll();
    expect(all.length).toBe(2);
    expect(all[0].description).toBe('İkinci kayıt');
    expect(all[1].description).toBe('İlk kayıt');
  });

  it('entries signal reaktif olarak güncellenir', () => {
    expect(auditLogService.entries().length).toBe(0);
    auditLogService.record({
      actionType: AuditActionType.CHECK_IN,
      entityType: 'Reservation',
      entityId: 'r-1',
      entityLabel: 'RZV-TEST1',
      description: 'Check-in yapıldı',
    });
    expect(auditLogService.entries().length).toBe(1);
  });
});
