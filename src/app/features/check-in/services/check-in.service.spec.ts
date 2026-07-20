import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { CheckInService } from './check-in.service';
import { ReservationService } from '../../reservations/services/reservation.service';
import { EventService } from '../../events/services/event.service';
import { VenueService } from '../../venues/services/venue.service';
import { TicketTypeService } from '../../ticket-types/services/ticket-type.service';
import { AttendeeService } from '../../reservations/services/attendee.service';
import { StorageService } from '../../../core/services/storage.service';
import { ReservationStatus, EventStatus } from '../../../core/models/enums';

describe('CheckInService', () => {
  let checkInService: CheckInService;
  let reservationService: ReservationService;
  let eventService: EventService;
  let venueService: VenueService;
  let ticketTypeService: TicketTypeService;
  let attendeeService: AttendeeService;
  let storage: StorageService;

  let reservationCode: string;
  let reservationId: string;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    storage.clearAll();

    checkInService = TestBed.inject(CheckInService);
    reservationService = TestBed.inject(ReservationService);
    eventService = TestBed.inject(EventService);
    venueService = TestBed.inject(VenueService);
    ticketTypeService = TestBed.inject(TicketTypeService);
    attendeeService = TestBed.inject(AttendeeService);

    let venue: any;
    venueService
      .create({ name: 'Salon', city: 'İzmir', address: 'Adres', totalCapacity: 50, isActive: true })
      .subscribe((v) => (venue = v));
    tick(1000);

    let event: any;
    eventService
      .create(
        {
          title: 'Konser',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
        50
      )
      .subscribe((e) => (event = e));
    tick(1000);
    eventService.changeStatus(event, EventStatus.PUBLISHED).subscribe((e) => (event = e));
    tick(1000);

    let ticketType: any;
    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: 'STANDARD' as any, price: 50, allocatedQuota: 50 })
      .subscribe((t) => (ticketType = t));
    tick(1000);

    const attendee = attendeeService.findOrCreateSync('Katılımcı', 'katilimci@example.com', '0500 111 22 33');

    let reservation: any;
    reservationService
      .create({ eventId: event.id, ticketTypeId: ticketType.id, attendeeId: attendee.id, quantity: 1 })
      .subscribe((r) => (reservation = r));
    tick(1000);

    reservationCode = reservation.reservationCode;
    reservationId = reservation.id;
  }));

  it('onaylanmamış (PENDING) rezervasyon için check-in reddedilir', fakeAsync(() => {
    let error: any;
    checkInService.checkInByCode(reservationCode).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.message).toContain('onaylanmış');
  }));

  it('onaylı rezervasyon için check-in başarılı olur ve rezervasyon durumu güncellenir', fakeAsync(() => {
    const all = reservationService.allSync();
    const reservation = all.find((r) => r.id === reservationId)!;
    reservationService.changeStatus(reservation, ReservationStatus.CONFIRMED).subscribe();
    tick(1000);

    let result: any;
    checkInService.checkInByCode(reservationCode).subscribe((r) => (result = r));
    tick(1000);

    expect(result).toBeDefined();
    expect(result.reservation.status).toBe(ReservationStatus.CHECKED_IN);
    expect(result.record.ticketCode).toBe(reservationCode);
  }));

  it('aynı kod ile ikinci kez check-in yapılamaz', fakeAsync(() => {
    const all = reservationService.allSync();
    const reservation = all.find((r) => r.id === reservationId)!;
    reservationService.changeStatus(reservation, ReservationStatus.CONFIRMED).subscribe();
    tick(1000);

    checkInService.checkInByCode(reservationCode).subscribe();
    tick(1000);

    let error: any;
    checkInService.checkInByCode(reservationCode).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.code).toBe('DUPLICATE');
  }));

  it('var olmayan bir kod için "bulunamadı" hatası döner', fakeAsync(() => {
    let error: any;
    checkInService.checkInByCode('RZV-YOKYOK').subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.code).toBe('NOT_FOUND');
  }));
});
