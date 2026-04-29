import { HITTER_SCORING_CATEGORIES, PITCHER_SCORING_CATEGORIES, ROSTER_SLOTS } from "../consts";

export type PlayerID = number;
export type DraftID = string;
export type LeagueID = string;
export type TeamName = string; // User made team name

export type Position =
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'CI'
  | 'MI'
  | 'OF1'
  | 'OF2'
  | 'OF3'
  | 'OF4'
  | 'OF5'
  | 'UTIL'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'P5'
  | 'P6'
  | 'P7'
  | 'P8'
  | 'P9';

export type SearchFilterPosition =
  | 'C'
  | '1B'
  | '2B'
  | '3B'
  | 'SS'
  | 'OF'
  | 'P'
  | 'UTIL';

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
  teams: Record<TeamName, RosterData>;
};

// ===================== API TYPES ==============================
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

export type HitterScoringCategory = typeof HITTER_SCORING_CATEGORIES[number];
export type PitcherScoringCategory = typeof PITCHER_SCORING_CATEGORIES[number];

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

export interface Player {
    id: number;
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
}

// ===================== API REQUEST TYPES ======================
export type RosterSlot = typeof ROSTER_SLOTS[number];
export type RosterSlotCounts = Record<RosterSlot, number>;

export interface LeagueSettings {
    budget: number;
    teamCount: number;
    rosterSlots: RosterSlotCounts;
}

export interface LeagueState {
    teams: Record<TeamName, RosterData>;
}

export interface ValuationRequest {
    leagueSettings?: LeagueSettings;
    leagueState?: LeagueState;
}

// ===================== API RESPONSE TYPES =====================
export interface PlayerPools {
    hitters: HitterPlayer[];
    pitchers: PitcherPlayer[];
}

export interface PlayerValuation {
    id: PlayerID;
    normalizedValue: number;
    auctionPrice: number;
}