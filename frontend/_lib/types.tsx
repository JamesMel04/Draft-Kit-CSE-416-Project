/* This file should generally match the types file for the server */
export type PlayerStats = {
  seasons: number[];
  hitter: Record<string, number>;
};

export type PlayerData = {
  id: string;
  name: string;
  team: string;
  positions: string[];
  suggestedValue: number;
  stats: {
    projection: PlayerStats,
    lastYear: PlayerStats,
    threeYearAvg: PlayerStats
  };
};

export type DraftData = {
  id: string;
  roster: {
    [position: string]: PlayerData;
  };
};

export type LeagueData = {
  name: string;
  teams: {
    [teamManager: string]: DraftData;
  }
};

/*
Type for backend player GET parameters. Should always match backend, update as needed
*/
export type PlayerGetParams = {
  name?: string; // Name of player to filter
  sort?: string; // Key to sort by
  asc?: boolean; // Ascending or not
  page?: number; // Current page
  limit?: number; // Number of players per page
}

/*
Type for pagination meta, returned by backend, update as needed
*/
export type PaginationMeta = {
  total: number; // Total number of players
  page: number; // Current Page
  limit: number; // Limit per page
  totalPages: number; // Total number of pages
  hasNext: boolean; // Next page or not
  hasPrev: boolean; // Previous page or not
};

/*
Type of object that backend player request returns. update as needed
*/
export type PlayerGetResponse = {
  players: PlayerData[];
  pagination: PaginationMeta;
  sorting: {
    sort: string,
    asc: boolean
  };
};

export type EvaluationMeta = {
  source: "backend" | "fallback";
  provider?: string;
  generatedAt?: string;
  notes?: string;
};

export type EvaluatedPlayer = {
  id: string;
  name: string;
  team: string;
  positions: string[];
  suggestedValue: number;
  evaluation: {
    score: number;
    tier: string;
    confidence: number;
    summary?: string;
  };
};

export type EvaluatedPlayerListResponse = {
  players: EvaluatedPlayer[];
  pagination: PaginationMeta;
  sorting: {
    sort: string;
    asc: boolean;
  };
  meta: EvaluationMeta;
};

export type EvaluationPlayerFilters = {
  playerIds?: string[];
  positions?: string[];
  minPrice?: number;
  maxPrice?: number;
  alreadyTakenIds?: string[];
  name?: string;
  sort?: string;
  asc?: boolean;
  page?: number;
  limit?: number;
};

export type EvaluatedDraftSlot = {
  position: string;
  player: EvaluatedPlayer | null;
};

export type EvaluatedDraftResponse = {
  draftId: string;
  slots: EvaluatedDraftSlot[];
  totals: {
    value: number;
    score: number;
  };
  meta: EvaluationMeta;
};

export type EvaluatedDraftValue = {
  draftId: string;
  value: number;
};

export type EvaluatedDraftListResponse = {
  drafts: EvaluatedDraftValue[];
  meta: EvaluationMeta;
};

export type SavedDraftSummary = {
  draftId: string;
  name: string;
  userId: string;
  updatedAt: string;
};

export type SavedDraftListResponse = {
  drafts: SavedDraftSummary[];
};

export type Position =
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "CI"
  | "MI"
  | "OF1"
  | "OF2"
  | "OF3"
  | "OF4"
  | "OF5"
  | "UTIL"
  | "P1"
  | "P2"
  | "P3"
  | "P4"
  | "P5"
  | "P6"
  | "P7"
  | "P8"
  | "P9";

export type SearchFilterPosition = "C" | "1B" | "2B" | "3B" | "SS" | "OF" | "P" | "UTIL";