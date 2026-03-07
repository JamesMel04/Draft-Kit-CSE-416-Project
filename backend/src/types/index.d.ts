export type PlayerData = {
  id: string;
  name: string;
  team: string;
  stats: Record<string, number>;
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
