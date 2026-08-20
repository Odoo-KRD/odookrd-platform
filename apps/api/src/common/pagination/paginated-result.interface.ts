export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}
