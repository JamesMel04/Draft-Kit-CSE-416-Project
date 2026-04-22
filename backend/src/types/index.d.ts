export type PlayerID = string;
export type DraftID = string;

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
  name: string;
  teams: {
    [teamManager: string]: DraftData;
  }
};
