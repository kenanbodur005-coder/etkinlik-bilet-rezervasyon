import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReservationService } from './reservation.service';
import { EventService } from '../../events/services/event.service';
import { VenueService } from '../../venues/services/venue.service';
import { TicketTypeService } from '../../ticket-types/services/ticket-type.service';
import { AttendeeService } from './attendee.service';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationStatus, CancellationReason, EventStatus } from '../../../core/models/enums';
import { Venue } from '../../venues/models/venue.model';
import { EventEntity } from '../../events/models/event.model';
import { TicketType } from '../../ticket-types/models/ticket-type.model';

describe('ReservationService', () => {
  let reservationService: ReservationService;
  let eventService: EventService;
  let venueService: VenueService;
  let ticketTypeService: TicketTypeService;
  let attendeeService: AttendeeService;
  let storage: StorageService;

  let venue: Venue;
  let event: EventEntity;
  let ticketType: TicketType;
  let attendeeId: string;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    storage.clearAll();

    reservationService = TestBed.inject(ReservationService);
    eventService = TestBed.inject(EventService);
    venueService = TestBed.inject(VenueService);
    ticketTypeService = TestBed.inject(TicketTypeService);
    attendeeService = TestBed.inject(AttendeeService);
    TestBed.inject(AuthService);

    // 20 kişilik küçük bir mekan + etkinlik + 20 kontenjanlı bilet tipi kur.
    venueService
      .create({ name: 'Test Mekanı', city: 'Ankara', address: 'Test Adres', totalCapacity: 20, isActive: true })
      .subscribe((v) => (venue = v));
    tick(1000);

    eventService
      .create(
        {
          title: 'Test Etkinliği',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 10 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 10 * 86400000).toISOString(),
        },
        20
      )
      .subscribe((e) => (event = e));
    tick(1000);
    // Etkinliği satışa açık duruma getir (create varsayılan DRAFT döner)
    eventService.changeStatus(event, EventStatus.PUBLISHED).subscribe((e) => (event = e));
    tick(1000);

    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: 'STANDARD' as any, price: 100, allocatedQuota: 20 })
      .subscribe((t) => (ticketType = t));
    tick(1000);

    attendeeId = attendeeService.findOrCreateSync('Test Kullanıcı', 'test@example.com', '0500 000 00 00').id;
  }));

  it('kalan kontenjanı aşan bir rezervasyon oluşturulamaz', fakeAsync(() => {
    let error: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 25 })
      .subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.message).toContain('kalan kontenjan');
  }));

  it('kalan kontenjan dahilindeki rezervasyon başarıyla oluşturulur', fakeAsync(() => {
    let result: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 5 })
      .subscribe((r) => (result = r));
    tick(1000);

    expect(result).toBeDefined();
    expect(result.status).toBe(ReservationStatus.PENDING);
    expect(result.totalPrice).toBe(500);
    expect(reservationService.remainingQuota(event.id, ticketType.id)).toBe(15);
  }));

  it('iptal edilen rezervasyon kontenjanı geri açar', fakeAsync(() => {
    let reservation: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 10 })
      .subscribe((r) => (reservation = r));
    tick(1000);

    expect(reservationService.remainingQuota(event.id, ticketType.id)).toBe(10);

    reservationService.changeStatus(reservation, ReservationStatus.CONFIRMED).subscribe((r) => (reservation = r));
    tick(1000);

    reservationService
      .cancel(reservation, CancellationReason.CUSTOMER_REQUEST, 'Test iptali')
      .subscribe((r) => (reservation = r));
    tick(1000);

    expect(reservation.status).toBe(ReservationStatus.CANCELLED);
    expect(reservationService.remainingQuota(event.id, ticketType.id)).toBe(20);

    const records = reservationService.cancellationsForReservation(reservation.id);
    expect(records.length).toBe(1);
    expect(records[0].reason).toBe(CancellationReason.CUSTOMER_REQUEST);
  }));

  it('iptal edilmiş bir rezervasyon tekrar onaylanamaz (geçersiz durum geçişi)', fakeAsync(() => {
    let reservation: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 2 })
      .subscribe((r) => (reservation = r));
    tick(1000);

    reservationService
      .cancel(reservation, CancellationReason.CUSTOMER_REQUEST)
      .subscribe((r) => (reservation = r));
    tick(1000);

    let error: any;
    reservationService.changeStatus(reservation, ReservationStatus.CONFIRMED).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.code).toBe('INVALID_TRANSITION');
  }));

  it('etkinlik toplam kapasitesi, bilet tipi kontenjanından bağımsız olarak da uygulanır', fakeAsync(() => {
    // Etkinlik kapasitesi 20; tek bilet tipi de 20 kontenjanlı, bu yüzden 20 adetlik
    // bir rezervasyon başarılı olmalı, 21. adet ise event kapasitesini aşmalı.
    let firstResult: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 20 })
      .subscribe((r) => (firstResult = r));
    tick(1000);
    expect(firstResult).toBeDefined();

    let error: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId, quantity: 1 })
      .subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
  }));
});
