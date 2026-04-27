/* This file should generally match the types file for the server */
export type PlayerID = string;
export type DraftID = string;
export type LeagueID = string;

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

// ==================== Player positions from source data ====================
export const PLAYER_POSITIONS = [
    "C",    // Catcher
    "1B",   // First base
    "2B",   // Second base
    "3B",   // Third base
    "SS",   // Shortstop
    "CI",   // Corner infield
    "MI",   // Middle infield
    "IF",   // Infield
    "LF",   // Left field
    "CF",   // Center field
    "RF",   // Right field
    "OF",   // Outfield
    "DH",   // Designated hitter
    "U",    // Utility
    "P",    // Pitcher
    "SP",   // Starting pitcher
    "RP",   // Relief pitcher
    "TWP", // Two-way player
] as const;
export type PlayerPosition = typeof PLAYER_POSITIONS[number];


export type SearchFilterPosition = "C" | "1B" | "2B" | "3B" | "SS" | "OF" | "P" | "UTIL";

export type PlayerStats = {
  seasons: number[];
  hitter: Record<string, number>;
};

/** Stats Data */

export interface HitterStats {
    ab: number; // at bats, how many times they appeared to bat
    r: number; // runs scored, home run = 1 run. any other players on plates also score runs
    h: number; // Hits
    "1b": number; // singles
    "2b": number; // doubles
    "3b": number; // Triples
    hr: number; // Home runs
    rbi: number; // runs batted in, how many runners scored from your hit
    bb: number; // walks
    k: number; // strikeouts
    sb: number; // stolen base, advance base without hit
    cs: number; // caught stealing, tagged out
    avg: number; // batting average, hits / at bats
    obp: number; // on-base percentage
    slg: number; // slugging percentage, total bases / at bats
    fpts: number; // fantasy points
}

export interface PitcherStats {
    gp: number;    // games pitched
    era: number;  // earned run average
    gs: number;   // games started
    w: number;    // wins
    l: number;    // losses
    sho: number;  // shutouts
    sv: number;   // saves
    ip: number;   // innings pitched
    h: number;    // hits allowed
    er: number;   // earned runs allowed
    r: number;    // runs allowed per 9 inning game (total runs not available in API)
    hr: number;   // home runs allowed per 9 inning game (total homeruns not available in API)
    hld: number;  // holds
    hb: number;   // hit batters, how many times the pitcher has hit batters
    bb: number;   // walks allowed
    so: number;   // strikeouts
    whip: number; // walks + hits per inning pitched
    avg: number;  // opponent batting average, not in API, initialized as 0
    fpts: number; // fantasy points
}

/** Types for sorting by pitcher or hitter stats */
export type SortParamHitter = keyof HitterStats | "name" | "team" | "positions";
export type SortParamPitcher = keyof PitcherStats | "name" | "team" | "positions";
export type SortField = SortParamHitter | SortParamPitcher;
export type SortAsc = boolean;

/** Season stats, storing the seasons as well as the type of stat, hitting or pitching */
export interface SeasonStats {
    seasons: number[];
    hitting?: HitterStats;
    pitching?: PitcherStats;
}
export interface HitterSeasonStats extends SeasonStats {
    hitting: HitterStats;
}
export interface PitcherSeasonStats extends SeasonStats {
    pitching: PitcherStats;
}


/** Player types */
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

export interface Player {
    id: PlayerID;
    name: string;
    team: string;
    teamId: number;
    position: string;
    age: number;
    positions: PlayerPosition[];
    suggestedValue: number;
     /**
         * 
         * Status   |   Meaning
         * -------------------------
         * A        |   Active, no injury
         * D7       |   Injured 7-day
         * D10      |   Injured 10-Day
         * D15      |   Injured 15-Day
         * D60      |   Injured 60-Day
         * 
    */
    injuryStatus: string,
    stats: {
        projection: SeasonStats;
        lastYear: SeasonStats;
        threeYearAvg: SeasonStats;
    };
}

export interface HitterPlayer extends Player {
    stats: {
        projection: HitterSeasonStats;
        lastYear: HitterSeasonStats;
        threeYearAvg: HitterSeasonStats;
    };
}

export interface PitcherPlayer extends Player {
    stats: {
        projection: PitcherSeasonStats;
        lastYear: PitcherSeasonStats;
        threeYearAvg: PitcherSeasonStats;
    };
};

/** Player Pool type */
export interface PlayerPools {
    hitters: HitterPlayer[];
    pitchers: PitcherPlayer[];
}



/** Evaluation response */
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
  userId: string;
  id: DraftID;
  teamName: string;
  roster: Record<Position, PlayerID>;
};

export type DraftEvaluation = {
  id: DraftID;
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
  id: LeagueID;
  name: string;
  startingBudget: number;
  teams: Record<string, Partial<Record<Position, string | null>>>;
};



export type QueryParams = Record<string, string | number | boolean | undefined>;

export type CleanQueryParams = Record<string, string | number | boolean>;

export type PlayerQueryParams = {
  name?: string; // Name of player to filter by (partial match)
};

/** Response from /players API endpoint */
export type PlayerGetResponse = {
  players: PlayerPools;
  fallback?: boolean;
};

export type PlayerEvaluationQueryParams = {
  name?: string;
  playerIds?: PlayerID[];
  positions?: Position[];
  minPrice?: number;
  maxPrice?: number;
  alreadyTakenIds?: PlayerID[];
};

export type PlayerEvaluationResponse = {
  players: PlayerEvaluation[];
  meta: EvaluationMeta;
};

export type DraftGetResponse = {
  drafts: DraftData[];
  meta: EvaluationMeta;
};

export type DraftEvaluationResponse = {
  drafts: DraftEvaluation[];
  meta: EvaluationMeta;
};

export type SavedDraftsResponse = {
  drafts: DraftData[];
};