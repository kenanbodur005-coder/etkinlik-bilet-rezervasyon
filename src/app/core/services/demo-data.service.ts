import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { EventStatus, ReservationStatus, TicketCategory, CancellationReason, AuditActionType } from '../models/enums';

const SEED_FLAG = 'seeded-v1';

/**
 * Uygulama ilk açıldığında (veya localStorage temizlendiğinde) gerçekçi bir
 * demo veri seti oluşturur: 4 mekan, 6 etkinlik, ~14 bilet tipi,
 * 12 katılımcı, 30+ rezervasyon (farklı durumlarda), iptaller,
 * check-in kayıtları ve audit log girdileri.
 * Tek kayıtla teslim kabul edilmeyeceği için veri seti bilinçli olarak zengindir.
 */
@Injectable({ providedIn: 'root' })
export class DemoDataService {
  constructor(private storage: StorageService) {}

  seedIfNeeded(): void {
    if (this.storage.hasSeed(SEED_FLAG)) return;

    const now = () => new Date().toISOString();
    const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();
    const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
    const uuid = () => crypto.randomUUID();

    // ---------- Venues ----------
    const venues = [
      { id: uuid(), name: 'Ankara Kongre ve Kültür Merkezi', city: 'Ankara', address: 'Söğütözü Cd. No:1', totalCapacity: 600, description: 'Çok amaçlı büyük salon.', isActive: true, createdAt: daysAgo(90), updatedAt: daysAgo(90) },
      { id: uuid(), name: 'İstanbul Lütfi Kırdar Salonu', city: 'İstanbul', address: 'Darülbedai Cd. No:1', totalCapacity: 900, description: 'Konser ve konferanslar için ana salon.', isActive: true, createdAt: daysAgo(85), updatedAt: daysAgo(85) },
      { id: uuid(), name: 'İzmir Kültürpark Açıkhava', city: 'İzmir', address: 'Kültürpark', totalCapacity: 1200, description: 'Açık hava konser alanı.', isActive: true, createdAt: daysAgo(80), updatedAt: daysAgo(80) },
      { id: uuid(), name: 'Bursa Eğitim Merkezi B Salonu', city: 'Bursa', address: 'Nilüfer, Üniversite Cd.', totalCapacity: 150, description: 'Seminer ve eğitim etkinlikleri için.', isActive: true, createdAt: daysAgo(70), updatedAt: daysAgo(70) },
    ];

    // ---------- Events ----------
    const events = [
      { id: uuid(), title: 'Anadolu Rock Gecesi', description: 'Yerli rock gruplarının buluştuğu açık hava konseri.', category: 'Konser', venueId: venues[2].id, startDate: daysFromNow(21), endDate: daysFromNow(21), status: EventStatus.PUBLISHED, isDeleted: false, createdAt: daysAgo(40), updatedAt: daysAgo(5) },
      { id: uuid(), title: 'Dijital Pazarlama Zirvesi', description: 'Sektör liderleriyle dijital pazarlama trendleri semineri.', category: 'Seminer', venueId: venues[3].id, startDate: daysFromNow(10), endDate: daysFromNow(10), status: EventStatus.PUBLISHED, isDeleted: false, createdAt: daysAgo(35), updatedAt: daysAgo(3) },
      { id: uuid(), title: 'Klasik Müzik Akşamı', description: 'Oda orkestrası eşliğinde klasik müzik dinletisi.', category: 'Konser', venueId: venues[1].id, startDate: daysFromNow(-2), endDate: daysFromNow(-2), status: EventStatus.ONGOING, isDeleted: false, createdAt: daysAgo(60), updatedAt: daysAgo(1) },
      { id: uuid(), title: 'Girişimcilik Eğitimi: Sıfırdan Bire', description: 'Erken aşama girişimciler için uygulamalı eğitim.', category: 'Eğitim', venueId: venues[3].id, startDate: daysAgo(15), endDate: daysAgo(14), status: EventStatus.COMPLETED, isDeleted: false, createdAt: daysAgo(50), updatedAt: daysAgo(13) },
      { id: uuid(), title: 'Caz Festivali Açılış Konseri', description: 'Uluslararası caz sanatçılarının katılımıyla açılış konseri.', category: 'Konser', venueId: venues[0].id, startDate: daysFromNow(35), endDate: daysFromNow(35), status: EventStatus.DRAFT, isDeleted: false, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
      { id: uuid(), title: 'Yapay Zeka ve Gelecek Konferansı', description: 'YZ alanında güncel gelişmelerin tartışıldığı konferans.', category: 'Konferans', venueId: venues[0].id, startDate: daysFromNow(-30), endDate: daysFromNow(-29), status: EventStatus.CANCELLED, isDeleted: false, createdAt: daysAgo(75), updatedAt: daysAgo(32) },
    ];

    // ---------- Capacity rules (event totalCapacity <= venue.totalCapacity) ----------
    const capacityRules = [
      { id: uuid(), eventId: events[0].id, totalCapacity: 800, createdAt: events[0].createdAt, updatedAt: events[0].createdAt },
      { id: uuid(), eventId: events[1].id, totalCapacity: 120, createdAt: events[1].createdAt, updatedAt: events[1].createdAt },
      { id: uuid(), eventId: events[2].id, totalCapacity: 500, createdAt: events[2].createdAt, updatedAt: events[2].createdAt },
      { id: uuid(), eventId: events[3].id, totalCapacity: 100, createdAt: events[3].createdAt, updatedAt: events[3].createdAt },
      { id: uuid(), eventId: events[4].id, totalCapacity: 550, createdAt: events[4].createdAt, updatedAt: events[4].createdAt },
      { id: uuid(), eventId: events[5].id, totalCapacity: 400, createdAt: events[5].createdAt, updatedAt: events[5].createdAt },
    ];

    // ---------- Ticket types ----------
    const tt = (eventId: string, name: string, category: TicketCategory, price: number, quota: number, created: string) => ({
      id: uuid(), eventId, name, category, price, allocatedQuota: quota, isActive: true, createdAt: created, updatedAt: created,
    });

    const ticketTypes = [
      tt(events[0].id, 'Standart Bilet', TicketCategory.STANDARD, 450, 500, events[0].createdAt),
      tt(events[0].id, 'VIP Bilet', TicketCategory.VIP, 950, 150, events[0].createdAt),
      tt(events[0].id, 'Öğrenci Bileti', TicketCategory.STUDENT, 250, 150, events[0].createdAt),

      tt(events[1].id, 'Standart Katılım', TicketCategory.STANDARD, 300, 90, events[1].createdAt),
      tt(events[1].id, 'Erken Kayıt', TicketCategory.EARLY_BIRD, 200, 30, events[1].createdAt),

      tt(events[2].id, 'Koltuk - Standart', TicketCategory.STANDARD, 380, 350, events[2].createdAt),
      tt(events[2].id, 'Koltuk - VIP Loca', TicketCategory.VIP, 750, 150, events[2].createdAt),

      tt(events[3].id, 'Eğitim Katılım Bileti', TicketCategory.STANDARD, 1200, 100, events[3].createdAt),

      tt(events[4].id, 'Erken Kayıt', TicketCategory.EARLY_BIRD, 500, 200, events[4].createdAt),
      tt(events[4].id, 'Standart Bilet', TicketCategory.STANDARD, 650, 250, events[4].createdAt),
      tt(events[4].id, 'VIP Bilet', TicketCategory.VIP, 1400, 100, events[4].createdAt),

      tt(events[5].id, 'Standart Bilet', TicketCategory.STANDARD, 300, 400, events[5].createdAt),
    ];

    // ---------- Attendees ----------
    const names = [
      ['Ahmet Yılmaz', 'ahmet.yilmaz@example.com', '0532 111 22 33'],
      ['Zeynep Kaya', 'zeynep.kaya@example.com', '0533 222 33 44'],
      ['Mehmet Demir', 'mehmet.demir@example.com', '0534 333 44 55'],
      ['Elif Şahin', 'elif.sahin@example.com', '0535 444 55 66'],
      ['Can Aydın', 'can.aydin@example.com', '0536 555 66 77'],
      ['Ayşe Çelik', 'ayse.celik@example.com', '0537 666 77 88'],
      ['Burak Arslan', 'burak.arslan@example.com', '0538 777 88 99'],
      ['Selin Koç', 'selin.koc@example.com', '0539 888 99 00'],
      ['Emre Yıldız', 'emre.yildiz@example.com', '0530 999 00 11'],
      ['Deniz Kurt', 'deniz.kurt@example.com', '0531 000 11 22'],
      ['Gizem Aksoy', 'gizem.aksoy@example.com', '0532 121 21 21'],
      ['Kerem Polat', 'kerem.polat@example.com', '0533 232 32 32'],
    ];
    const attendees = names.map(([fullName, email, phone], i) => ({
      id: uuid(), fullName, email, phone, createdAt: daysAgo(30 - i), updatedAt: daysAgo(30 - i),
    }));

    // ---------- Reservations ----------
    type Res = any;
    const reservations: Res[] = [];
    const cancellationRequests: any[] = [];
    const checkInRecords: any[] = [];
    const auditEntries: any[] = [];

    const genCode = () => `RZV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const addAudit = (actionType: AuditActionType, entityType: string, entityId: string, entityLabel: string, description: string, ts: string, oldValue?: string, newValue?: string) => {
      auditEntries.push({
        id: uuid(), actionType, entityType, entityId, entityLabel,
        performedByRole: 'EVENT_MANAGER', performedByName: 'Elif Yönetici',
        description, oldValue: oldValue ?? null, newValue: newValue ?? null,
        timestamp: ts, createdAt: ts, updatedAt: ts,
      });
    };

    const makeReservation = (
      eventId: string, ticketTypeId: string, attendeeId: string, quantity: number, unitPrice: number,
      status: ReservationStatus, createdOffsetDays: number
    ) => {
      const created = daysAgo(createdOffsetDays);
      const code = genCode();
      const reservation: Res = {
        id: uuid(), reservationCode: code, eventId, ticketTypeId, attendeeId, quantity, unitPrice,
        totalPrice: unitPrice * quantity, status,
        confirmedAt: status !== ReservationStatus.PENDING ? daysAgo(createdOffsetDays - 1) : null,
        cancelledAt: [ReservationStatus.CANCELLED, ReservationStatus.REFUNDED].includes(status) ? daysAgo(Math.max(0, createdOffsetDays - 2)) : null,
        checkedInAt: status === ReservationStatus.CHECKED_IN ? daysAgo(Math.max(0, createdOffsetDays - 3)) : null,
        createdAt: created, updatedAt: created,
      };
      reservations.push(reservation);
      addAudit(AuditActionType.CREATE, 'Reservation', reservation.id, code, `${code} kodlu rezervasyon oluşturuldu (${quantity} adet).`, created);

      if (status === ReservationStatus.CANCELLED || status === ReservationStatus.REFUNDED) {
        const cancelTs = reservation.cancelledAt!;
        cancellationRequests.push({
          id: uuid(), reservationId: reservation.id, reason: CancellationReason.CUSTOMER_REQUEST,
          note: 'Müşteri talebi üzerine iptal edildi.', refundAmount: reservation.totalPrice,
          processedByRole: 'BOX_OFFICE_OPERATOR', processedByName: 'Barış Gişe',
          createdAt: cancelTs, updatedAt: cancelTs,
        });
        addAudit(AuditActionType.CANCELLATION, 'Reservation', reservation.id, code, `${code} kodlu rezervasyon iptal edildi. Kontenjan geri açıldı.`, cancelTs, 'Onaylandı', 'İptal Edildi');
      }

      if (status === ReservationStatus.CHECKED_IN) {
        const ts = reservation.checkedInAt!;
        checkInRecords.push({
          id: uuid(), reservationId: reservation.id, ticketCode: code,
          checkedInByRole: 'CHECKIN_STAFF', checkedInByName: 'Deniz Kontrol',
          checkedInAt: ts, createdAt: ts, updatedAt: ts,
        });
        addAudit(AuditActionType.CHECK_IN, 'Reservation', reservation.id, code, `${code} kodlu bilet ile check-in yapıldı.`, ts);
      }

      return reservation;
    };

    // Rock gecesi (events[0]) - standart/VIP/öğrenci karışık
    makeReservation(events[0].id, ticketTypes[0].id, attendees[0].id, 2, 450, ReservationStatus.CONFIRMED, 6);
    makeReservation(events[0].id, ticketTypes[0].id, attendees[1].id, 4, 450, ReservationStatus.CONFIRMED, 5);
    makeReservation(events[0].id, ticketTypes[1].id, attendees[2].id, 1, 950, ReservationStatus.PENDING, 1);
    makeReservation(events[0].id, ticketTypes[2].id, attendees[3].id, 3, 250, ReservationStatus.CONFIRMED, 4);
    makeReservation(events[0].id, ticketTypes[0].id, attendees[4].id, 2, 450, ReservationStatus.CANCELLED, 8);
    makeReservation(events[0].id, ticketTypes[1].id, attendees[5].id, 2, 950, ReservationStatus.CONFIRMED, 3);

    // Dijital Pazarlama Zirvesi (events[1])
    makeReservation(events[1].id, ticketTypes[3].id, attendees[6].id, 1, 300, ReservationStatus.CONFIRMED, 5);
    makeReservation(events[1].id, ticketTypes[4].id, attendees[7].id, 2, 200, ReservationStatus.CONFIRMED, 9);
    makeReservation(events[1].id, ticketTypes[3].id, attendees[8].id, 1, 300, ReservationStatus.PENDING, 1);
    makeReservation(events[1].id, ticketTypes[4].id, attendees[9].id, 1, 200, ReservationStatus.CANCELLED, 10);

    // Klasik Müzik Akşamı (events[2]) - ongoing, check-in var
    makeReservation(events[2].id, ticketTypes[5].id, attendees[0].id, 2, 380, ReservationStatus.CHECKED_IN, 12);
    makeReservation(events[2].id, ticketTypes[5].id, attendees[1].id, 1, 380, ReservationStatus.CHECKED_IN, 11);
    makeReservation(events[2].id, ticketTypes[6].id, attendees[2].id, 2, 750, ReservationStatus.CONFIRMED, 7);
    makeReservation(events[2].id, ticketTypes[6].id, attendees[3].id, 1, 750, ReservationStatus.PENDING, 2);
    makeReservation(events[2].id, ticketTypes[5].id, attendees[10].id, 3, 380, ReservationStatus.CHECKED_IN, 10);

    // Girişimcilik Eğitimi (events[3]) - completed, refund örneği
    makeReservation(events[3].id, ticketTypes[7].id, attendees[4].id, 1, 1200, ReservationStatus.CHECKED_IN, 20);
    makeReservation(events[3].id, ticketTypes[7].id, attendees[5].id, 1, 1200, ReservationStatus.REFUNDED, 18);
    makeReservation(events[3].id, ticketTypes[7].id, attendees[6].id, 1, 1200, ReservationStatus.CHECKED_IN, 19);

    // Caz Festivali (events[4]) - draft ama erken kayıt rezervasyonları var
    makeReservation(events[4].id, ticketTypes[8].id, attendees[7].id, 2, 500, ReservationStatus.CONFIRMED, 4);
    makeReservation(events[4].id, ticketTypes[8].id, attendees[8].id, 1, 500, ReservationStatus.PENDING, 2);
    makeReservation(events[4].id, ticketTypes[9].id, attendees[9].id, 2, 650, ReservationStatus.CONFIRMED, 3);
    makeReservation(events[4].id, ticketTypes[10].id, attendees[11].id, 1, 1400, ReservationStatus.PENDING, 1);

    // Yapay Zeka Konferansı (events[5]) - cancelled event, rezervasyonlar iptal
    makeReservation(events[5].id, ticketTypes[11].id, attendees[10].id, 2, 300, ReservationStatus.CANCELLED, 33);
    makeReservation(events[5].id, ticketTypes[11].id, attendees[11].id, 1, 300, ReservationStatus.REFUNDED, 32);

    // ---------- Genel oluşturma / güncelleme audit kayıtları (mekan, etkinlik) ----------
    venues.forEach((v) => addAudit(AuditActionType.CREATE, 'Venue', v.id, v.name, `"${v.name}" mekanı oluşturuldu (kapasite: ${v.totalCapacity}).`, v.createdAt));
    events.forEach((e) => addAudit(AuditActionType.CREATE, 'Event', e.id, e.title, `"${e.title}" etkinliği oluşturuldu.`, e.createdAt));
    addAudit(AuditActionType.STATUS_CHANGE, 'Event', events[5].id, events[5].title, `"${events[5].title}" etkinliğinin durumu değiştirildi.`, daysAgo(32), 'Yayında', 'İptal Edildi');
    addAudit(AuditActionType.PRICE_CHANGE, 'TicketType', ticketTypes[0].id, ticketTypes[0].name, `"${ticketTypes[0].name}" bilet tipi fiyatı değiştirildi.`, daysAgo(15), '400', '450');

    // Zaman sırasına göre diz (en yeni en üstte)
    auditEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // ---------- Persist ----------
    this.storage.write('venues', venues);
    this.storage.write('events', events);
    this.storage.write('capacity-rules', capacityRules);
    this.storage.write('ticket-types', ticketTypes);
    this.storage.write('attendees', attendees);
    this.storage.write('reservations', reservations);
    this.storage.write('cancellation-requests', cancellationRequests);
    this.storage.write('check-in-records', checkInRecords);
    this.storage.write('audit-log', auditEntries);
    this.storage.write(SEED_FLAG, true);
  }
}
