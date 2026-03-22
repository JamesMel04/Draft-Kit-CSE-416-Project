import { PaginationMeta, UpstreamPlayersPayload } from '@/types';

export function buildPagination(total: number, page: number, limit: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  return {
    total,
    page: safePage,
    limit,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1
  };
}

export function normalizeUpstreamPlayers(payload: UpstreamPlayersPayload) {
  if (Array.isArray(payload)) {
    return { players: payload, pagination: null as Partial<PaginationMeta> | null, isPaginated: false };
  }

  const players = payload.players ?? payload.data ?? payload.items ?? [];
  const pagination = {
    total: payload.pagination?.total ?? payload.total,
    page: payload.pagination?.page ?? payload.page,
    limit: payload.pagination?.limit ?? payload.limit,
    totalPages: payload.pagination?.totalPages ?? payload.totalPages
  };

  const isPaginated = [pagination.total, pagination.page, pagination.limit, pagination.totalPages]
    .some(value => typeof value === 'number');

  return {
    players,
    pagination,
    isPaginated
  };
}