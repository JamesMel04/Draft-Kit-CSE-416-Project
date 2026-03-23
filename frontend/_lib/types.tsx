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
}