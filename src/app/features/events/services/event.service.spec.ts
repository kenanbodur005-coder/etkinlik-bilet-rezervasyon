import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EventService } from './event.service';
import { VenueService } from '../../venues/services/venue.service';
import { StorageService } from '../../../core/services/storage.service';
import { EventStatus } from '../../../core/models/enums';
import { Venue } from '../../venues/models/venue.model';

describe('EventService', () => {
  let eventService: EventService;
  let venueService: VenueService;
  let storage: StorageService;
  let venue: Venue;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({});
    storage = TestBed.inject(StorageService);
    storage.clearAll();
    eventService = TestBed.inject(EventService);
    venueService = TestBed.inject(VenueService);

    venueService
      .create({ name: 'Salon', city: 'Ankara', address: 'Adres', totalCapacity: 100, isActive: true })
      .subscribe((v) => (venue = v));
    tick(1000);
  }));

  it('etkinlik kontenjanı mekan kapasitesini aşarsa oluşturma reddedilir', fakeAsync(() => {
    let error: any;
    eventService
      .create(
        {
          title: 'Büyük Etkinlik',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        150 // mekan kapasitesi 100
      )
      .subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.message).toContain('kapasitesini');
  }));

  it('yeni etkinlik varsayılan olarak DRAFT durumunda oluşturulur', fakeAsync(() => {
    let event: any;
    eventService
      .create(
        {
          title: 'Etkinlik',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        50
      )
      .subscribe((e) => (event = e));
    tick(1000);

    expect(event.status).toBe(EventStatus.DRAFT);
  }));

  it('DRAFT durumundan doğrudan ONGOING durumuna geçiş yapılamaz', fakeAsync(() => {
    let event: any;
    eventService
      .create(
        {
          title: 'Etkinlik',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        50
      )
      .subscribe((e) => (event = e));
    tick(1000);

    let error: any;
    eventService.changeStatus(event, EventStatus.ONGOING).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.code).toBe('INVALID_TRANSITION');
  }));

  it('geçerli durum sırası DRAFT -> PUBLISHED -> ONGOING -> COMPLETED şeklinde ilerleyebilir', fakeAsync(() => {
    let event: any;
    eventService
      .create(
        {
          title: 'Etkinlik',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        50
      )
      .subscribe((e) => (event = e));
    tick(1000);

    eventService.changeStatus(event, EventStatus.PUBLISHED).subscribe((e) => (event = e));
    tick(1000);
    expect(event.status).toBe(EventStatus.PUBLISHED);

    eventService.changeStatus(event, EventStatus.ONGOING).subscribe((e) => (event = e));
    tick(1000);
    expect(event.status).toBe(EventStatus.ONGOING);

    eventService.changeStatus(event, EventStatus.COMPLETED).subscribe((e) => (event = e));
    tick(1000);
    expect(event.status).toBe(EventStatus.COMPLETED);
  }));

  it('COMPLETED durumundan başka bir duruma geçiş yapılamaz', fakeAsync(() => {
    let event: any;
    eventService
      .create(
        {
          title: 'Etkinlik',
          description: 'Açıklama',
          category: 'Konser',
          venueId: venue.id,
          startDate: new Date(Date.now() + 86400000).toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
        },
        50
      )
      .subscribe((e) => (event = e));
    tick(1000);

    eventService.changeStatus(event, EventStatus.PUBLISHED).subscribe((e) => (event = e));
    tick(1000);
    eventService.changeStatus(event, EventStatus.ONGOING).subscribe((e) => (event = e));
    tick(1000);
    eventService.changeStatus(event, EventStatus.COMPLETED).subscribe((e) => (event = e));
    tick(1000);

    let error: any;
    eventService.changeStatus(event, EventStatus.CANCELLED).subscribe({ error: (e) => (error = e) });
    tick(1000);

    expect(error).toBeDefined();
    expect(error.code).toBe('INVALID_TRANSITION');
  }));
});
