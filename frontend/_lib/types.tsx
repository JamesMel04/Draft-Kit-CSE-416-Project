/* This file should generally match the types file for the server */
export type PlayerID = number;
export type DraftID = string;
export type LeagueID = string;
export type TeamName = string; // User made team name

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
  priceSold?: number;
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
	evaluation: {
    normalizedValue: number;
    auctionPrice: number;
	};
};

export type DraftSlotEvaluation = {
  position: Position;
  player: PlayerEvaluation | null;
};

export type RosterData = {
  roster: Partial<Record<Position, PlayerID | undefined>>;
};

export type DraftData = {
  userId: string;
  id: DraftID;
  teamName: string;
  roster: Partial<Record<Position, PlayerID | undefined>>;
};

export type DraftEvaluation = {
  id: DraftID;
  slots: DraftSlotEvaluation[];
  totals: {
    value: number;
    score: number;
  };
};

export type LeagueData = {
  id: LeagueID;
  name: string;
  startingBudget: number;
  teams: Record<TeamName, RosterData>;
};

export type SortField = string;
export type SortAsc = boolean;

// ===================== BACKEND REQUEST TYPES ==============================
export type QueryParams = Record<string, string | number | boolean | undefined>;

export type CleanQueryParams = Record<string, string | number | boolean>;

export type PlayerQueryParams = {
  name?: string; // Name of player to filter by (partial match)
};

export type PlayerEvaluationQueryParams = {
  name?: string;
  playerIds?: PlayerID[];
  positions?: SearchFilterPosition[];
  minPrice?: number;
  maxPrice?: number;
  alreadyTakenIds?: PlayerID[];
};

// ===================== BACKEND RESPONSE TYPES =============================
export type PlayerGetResponse = {
  players: PlayerData[];
  fallback?: boolean;
};

export type PlayerEvaluationResponse = {
  players: PlayerEvaluation[];
};

export type DraftGetResponse = {
  drafts: DraftData[];
};

export type DraftEvaluationResponse = {
  drafts: DraftEvaluation[];
};

export type SavedDraftsResponse = {
  drafts: DraftData[];
};