import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MockApiService } from '../../../core/services/mock-api.service';
import { Attendee } from '../models/attendee.model';

const COLLECTION = 'attendees';

@Injectable({ providedIn: 'root' })
export class AttendeeService {
  constructor(private api: MockApiService<Attendee>) {}

  findOrCreateSync(fullName: string, email: string, phone: string): Attendee {
    const all = this.api.allSync(COLLECTION);
    const existing = all.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (existing) return existing;

    const now = new Date().toISOString();
    const attendee: Attendee = { id: crypto.randomUUID(), fullName, email, phone, createdAt: now, updatedAt: now };
    this.api.saveAllSync(COLLECTION, [...all, attendee]);
    return attendee;
  }

  getByIdSync(id: string): Attendee | undefined {
    return this.api.allSync(COLLECTION).find((a) => a.id === id);
  }

  allSync(): Attendee[] {
    return this.api.allSync(COLLECTION);
  }
}
