/* This file should generally match the types file for the server */
export type PlayerID = string;
export type DraftID = string;
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

export type PlayerStats = {
  seasons: number[];
  hitter: Record<string, number>;
};

export type PlayerData = {
  id: PlayerID;
  name: string;
  team: string;
  positions: Position[];
  suggestedValue: number;
  stats: {
    projection: PlayerStats,
    lastYear: PlayerStats,
    threeYearAvg: PlayerStats
  };
};

export type PlayerEvaluation = {
	id: PlayerID;
	name: string;
	team: string;
	positions: Position[];
	suggestedValue: number;
	evaluation: {
		score: number;
		tier: string;
		confidence: number;
		summary: string;
	};
};

export type DraftSlotEvaluation = {
  position: Position;
  player: PlayerEvaluation | null;
};

export type DraftData = {
  id: DraftID;
  roster: Record<Position, PlayerID>;
};

export type DraftEvaluation = {
  draftId: DraftID;
  slots: DraftSlotEvaluation[];
  totals: {
    value: number;
    score: number;
  };
};

export type EvaluationMeta = {
  source: 'backend';
  provider: string;
  generatedAt: string;
  notes: string;
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

export type PlayerEvaluationGetResponse = {
  players: PlayerEvaluation[];
  pagination: PaginationMeta;
  sorting: {
    sort: string;
    asc: boolean;
  };
  meta: EvaluationMeta;
};

export type PlayerEvaluationFilters = {
  playerIds?: PlayerID[];
  positions?: Position[];
  minPrice?: number;
  maxPrice?: number;
  alreadyTakenIds?: PlayerID[];
  name?: string;
  sort?: string;
  asc?: boolean;
  page?: number;
  limit?: number;
};

export type DraftGetResponse = {
  drafts: DraftData[];
  meta: EvaluationMeta;
};

export type DraftEvaluationGetResponse = {
  drafts: DraftEvaluation[];
  meta: EvaluationMeta;
};

export type SavedDraftSummary = {
  draftId: DraftID;
  name: string;
  userId: string;
  updatedAt: string;
};

export type SavedDraftListResponse = {
  drafts: SavedDraftSummary[];
};