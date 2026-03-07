/* This file should generally match the types file for the server */
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
    [team_manager: string]: DraftData;
  }
};