/** Tüm ana veri modellerinin miras aldığı temel alanlar. */
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Basit sayfalanmış sonuç sarmalayıcısı (mock API tarafından üretilir). */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  [key: string]: unknown;
}
