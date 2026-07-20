/** Dashboard ve rapor ekranları için hesaplanmış özet veri (view model, persist edilmez). */
export interface RevenueByEvent {
  eventId: string;
  eventTitle: string;
  revenue: number;
  reservationCount: number;
  occupancyRate: number; // 0-100
}

export interface RevenueSummary {
  totalRevenue: number;
  totalReservations: number;
  confirmedCount: number;
  pendingCount: number;
  checkedInCount: number;
  cancelledCount: number;
  refundedCount: number;
  cancellationRate: number; // 0-100
  overallOccupancyRate: number; // 0-100
  revenueByEvent: RevenueByEvent[];
  statusDistribution: { status: string; count: number }[];
}
