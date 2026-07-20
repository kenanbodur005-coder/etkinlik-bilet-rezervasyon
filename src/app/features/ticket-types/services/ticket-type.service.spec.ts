import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TicketTypeService } from './ticket-type.service';
import { EventService } from '../../events/services/event.service';
import { VenueService } from '../../venues/services/venue.service';
import { StorageService } from '../../../core/services/storage.service';
import { EventStatus, TicketCategory } from '../../../core/models/enums';
import { EventEntity } from '../../events/models/event.model';
import { Venue } from '../../venues/models/venue.model';

describe('TicketTypeService', () => {
  let ticketTypeService: TicketTypeService;
  let eventService: EventService;
  let venueService: VenueService;
  let storage: StorageService;
  let venue: Venue;
  let event: EventEntity;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    storage.clearAll();

    ticketTypeService = TestBed.inject(TicketTypeService);
    eventService = TestBed.inject(EventService);
    venueService = TestBed.inject(VenueService);

    venueService
      .create({ name: 'Mekan', city: 'Bursa', address: 'Adres', totalCapacity: 100, isActive: true })
      .subscribe((v) => (venue = v));
    tick(1000);

    eventService
      .create(
        {
          title: 'Etkinlik',
          description: 'Açıklama',
          category: 'Seminer',
          venueId: venue.id,
          startDate: new Date(Date.now() + 5 * 86400000).toISOString(),
          endDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
        60 // etkinlik toplam kontenjanı venue kapasitesinden düşük
      )
      .subscribe((e) => (event = e));
    tick(1000);
  }));

  it('bilet tipi kontenjanları toplamı etkinlik kapasitesini aşarsa oluşturma reddedilir', fakeAsync(() => {
    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: TicketCategory.STANDARD, price: 100, allocatedQuota: 40 })
      .subscribe();
    tick(1000);

    let error: any;
    ticketTypeService
      .create({ eventId: event.id, name: 'VIP', category: TicketCategory.VIP, price: 300, allocatedQuota: 30 })
      .subscribe({ error: (e) => (error = e) }); // 40 + 30 = 70 > 60
    tick(1000);

    expect(error).toBeDefined();
    expect(error.message).toContain('aşıyor');
  }));

  it('toplam kapasite dahilindeki bilet tipleri başarıyla oluşturulur', fakeAsync(() => {
    let t1: any;
    let t2: any;
    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: TicketCategory.STANDARD, price: 100, allocatedQuota: 40 })
      .subscribe((t) => (t1 = t));
    tick(1000);
    ticketTypeService
      .create({ eventId: event.id, name: 'VIP', category: TicketCategory.VIP, price: 300, allocatedQuota: 20 })
      .subscribe((t) => (t2 = t));
    tick(1000);

    expect(t1).toBeDefined();
    expect(t2).toBeDefined();
  }));

  it('etkinlik başladıktan sonra bilet fiyatı değiştirilemez', fakeAsync(() => {
    let ticketType: any;
    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: TicketCategory.STANDARD, price: 100, allocatedQuota: 40 })
      .subscribe((t) => (ticketType = t));
    tick(1000);

    eventService.changeStatus(event, EventStatus.PUBLISHED).subscribe((e) => (event = e));
    tick(1000);
    eventService.changeStatus(event, EventStatus.ONGOING).subscribe((e) => (event = e));
    tick(1000);

    let error: any;
    ticketTypeService.update(ticketType.id, { price: 150 }, ticketType).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.message).toContain('fiyat');
  }));

  it('başlamamış etkinlik için fiyat güncellemesi serbesttir', fakeAsync(() => {
    let ticketType: any;
    ticketTypeService
      .create({ eventId: event.id, name: 'Standart', category: TicketCategory.STANDARD, price: 100, allocatedQuota: 40 })
      .subscribe((t) => (ticketType = t));
    tick(1000);

    let updated: any;
    ticketTypeService.update(ticketType.id, { price: 150 }, ticketType).subscribe((t) => (updated = t));
    tick(1000);

    expect(updated).toBeDefined();
    expect(updated.price).toBe(150);
  }));
});
