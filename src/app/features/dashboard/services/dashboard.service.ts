import { Injectable } from '@angular/core';
import { RevenueSummary, RevenueByEvent } from '../models/revenue-summary.model';
import { EventService } from '../../events/services/event.service';
import { ReservationService } from '../../reservations/services/reservation.service';
import { ReservationStatus } from '../../../core/models/enums';

/**
 * Dashboard ve rapor ekranları için tüm KPI'lar mevcut kayıtlar üzerinden
 * anlık hesaplanır; statik metin olarak yazılmaz.
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private eventService: EventService, private reservationService: ReservationService) {}

  computeSummary(): RevenueSummary {
    const events = this.eventService.allActiveSync();
    const reservations = this.reservationService.allSync();

    const confirmed = reservations.filter((r) => r.status === ReservationStatus.CONFIRMED);
    const pending = reservations.filter((r) => r.status === ReservationStatus.PENDING);
    const checkedIn = reservations.filter((r) => r.status === ReservationStatus.CHECKED_IN);
    const cancelled = reservations.filter((r) => r.status === ReservationStatus.CANCELLED);
    const refunded = reservations.filter((r) => r.status === ReservationStatus.REFUNDED);

    const revenueEligible = reservations.filter((r) =>
      [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN].includes(r.status)
    );
    const totalRevenue = revenueEligible.reduce((sum, r) => sum + r.totalPrice, 0);

    const revenueByEvent: RevenueByEvent[] = events.map((event) => {
      const eventReservations = reservations.filter((r) => r.eventId === event.id);
      const eventRevenueEligible = eventReservations.filter((r) =>
        [ReservationStatus.CONFIRMED, ReservationStatus.CHECKED_IN].includes(r.status)
      );
      const revenue = eventRevenueEligible.reduce((sum, r) => sum + r.totalPrice, 0);
      const rule = this.eventService.getCapacityRuleSync(event.id);
      const activeQty = eventReservations
        .filter((r) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(r.status))
        .reduce((sum, r) => sum + r.quantity, 0);
      const occupancyRate = rule && rule.totalCapacity > 0 ? Math.min(100, Math.round((activeQty / rule.totalCapacity) * 100)) : 0;

      return {
        eventId: event.id,
        eventTitle: event.title,
        revenue,
        reservationCount: eventReservations.length,
        occupancyRate,
      };
    });

    const totalCapacity = events.reduce((sum, e) => sum + (this.eventService.getCapacityRuleSync(e.id)?.totalCapacity ?? 0), 0);
    const totalActiveQty = reservations
      .filter((r) => ['PENDING', 'CONFIRMED', 'CHECKED_IN'].includes(r.status))
      .reduce((sum, r) => sum + r.quantity, 0);
    const overallOccupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((totalActiveQty / totalCapacity) * 100)) : 0;

    const totalReservations = reservations.length;
    const cancellationRate =
      totalReservations > 0 ? Math.round(((cancelled.length + refunded.length) / totalReservations) * 100) : 0;

    const statusDistribution = [
      { status: 'PENDING', count: pending.length },
      { status: 'CONFIRMED', count: confirmed.length },
      { status: 'CHECKED_IN', count: checkedIn.length },
      { status: 'CANCELLED', count: cancelled.length },
      { status: 'REFUNDED', count: refunded.length },
    ];

    return {
      totalRevenue,
      totalReservations,
      confirmedCount: confirmed.length,
      pendingCount: pending.length,
      checkedInCount: checkedIn.length,
      cancelledCount: cancelled.length,
      refundedCount: refunded.length,
      cancellationRate,
      overallOccupancyRate,
      revenueByEvent: revenueByEvent.sort((a, b) => b.revenue - a.revenue),
      statusDistribution,
    };
  }
}
