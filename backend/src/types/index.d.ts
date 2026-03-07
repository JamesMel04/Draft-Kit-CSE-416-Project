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
