/**
 * Uygulama genelinde kullanılan enum / union type tanımları.
 * Durum alanlarında asla serbest metin kullanılmaz; tüm workflow'lar bu
 * enum'lara bağlıdır.
 */

export enum UserRole {
  EVENT_MANAGER = 'EVENT_MANAGER', // Etkinlik Yöneticisi
  BOX_OFFICE_OPERATOR = 'BOX_OFFICE_OPERATOR', // Gişe Operatörü
  CHECKIN_STAFF = 'CHECKIN_STAFF', // Kontrol Görevlisi
}

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.EVENT_MANAGER]: 'Etkinlik Yöneticisi',
  [UserRole.BOX_OFFICE_OPERATOR]: 'Gişe Operatörü',
  [UserRole.CHECKIN_STAFF]: 'Kontrol Görevlisi',
};

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: 'Taslak',
  [EventStatus.PUBLISHED]: 'Yayında',
  [EventStatus.ONGOING]: 'Devam Ediyor',
  [EventStatus.COMPLETED]: 'Tamamlandı',
  [EventStatus.CANCELLED]: 'İptal Edildi',
};

/** İzin verilen etkinlik durum geçişleri. Rastgele geçişe izin verilmez. */
export const EVENT_STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PUBLISHED, EventStatus.CANCELLED],
  [EventStatus.PUBLISHED]: [EventStatus.ONGOING, EventStatus.CANCELLED],
  [EventStatus.ONGOING]: [EventStatus.COMPLETED, EventStatus.CANCELLED],
  [EventStatus.COMPLETED]: [],
  [EventStatus.CANCELLED]: [],
};

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: 'Beklemede',
  [ReservationStatus.CONFIRMED]: 'Onaylandı',
  [ReservationStatus.CHECKED_IN]: 'Giriş Yapıldı',
  [ReservationStatus.CANCELLED]: 'İptal Edildi',
  [ReservationStatus.REFUNDED]: 'İade Edildi',
};

/** İzin verilen rezervasyon durum geçişleri. */
export const RESERVATION_STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [ReservationStatus.CHECKED_IN, ReservationStatus.CANCELLED],
  [ReservationStatus.CHECKED_IN]: [ReservationStatus.REFUNDED],
  [ReservationStatus.CANCELLED]: [ReservationStatus.REFUNDED],
  [ReservationStatus.REFUNDED]: [],
};

export enum TicketCategory {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  STUDENT = 'STUDENT',
  EARLY_BIRD = 'EARLY_BIRD',
}

export const TICKET_CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.STANDARD]: 'Standart',
  [TicketCategory.VIP]: 'VIP',
  [TicketCategory.STUDENT]: 'Öğrenci',
  [TicketCategory.EARLY_BIRD]: 'Erken Kayıt',
};

export enum CancellationReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  EVENT_CANCELLED = 'EVENT_CANCELLED',
  PAYMENT_ISSUE = 'PAYMENT_ISSUE',
  DUPLICATE = 'DUPLICATE',
  OTHER = 'OTHER',
}

export const CANCELLATION_REASON_LABELS: Record<CancellationReason, string> = {
  [CancellationReason.CUSTOMER_REQUEST]: 'Müşteri Talebi',
  [CancellationReason.EVENT_CANCELLED]: 'Etkinlik İptali',
  [CancellationReason.PAYMENT_ISSUE]: 'Ödeme Sorunu',
  [CancellationReason.DUPLICATE]: 'Mükerrer Kayıt',
  [CancellationReason.OTHER]: 'Diğer',
};

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PRICE_CHANGE = 'PRICE_CHANGE',
  CAPACITY_CHANGE = 'CAPACITY_CHANGE',
  CANCELLATION = 'CANCELLATION',
  CHECK_IN = 'CHECK_IN',
}

export const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  [AuditActionType.CREATE]: 'Oluşturma',
  [AuditActionType.UPDATE]: 'Güncelleme',
  [AuditActionType.DELETE]: 'Silme',
  [AuditActionType.STATUS_CHANGE]: 'Durum Değişikliği',
  [AuditActionType.PRICE_CHANGE]: 'Fiyat Değişikliği',
  [AuditActionType.CAPACITY_CHANGE]: 'Kontenjan Değişikliği',
  [AuditActionType.CANCELLATION]: 'İptal',
  [AuditActionType.CHECK_IN]: 'Check-in',
};
