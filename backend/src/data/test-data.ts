import { PlayerData, DraftData, LeagueData } from '@/types';

// Draft rosters are typed as full slot maps; empty string means slot not filled yet.
const emptyRoster: DraftData["roster"] = {
  "C": undefined,
  "1B": undefined,
  "2B": undefined,
  "3B": undefined,
  "SS": undefined,
  "CI": undefined,
  "MI": undefined,
  "OF1": undefined,
  "OF2": undefined,
  "OF3": undefined,
  "OF4": undefined,
  "OF5": undefined,
  "UTIL": undefined,
  "P1": undefined,
  "P2": undefined,
  "P3": undefined,
  "P4": undefined,
  "P5": undefined,
  "P6": undefined,
  "P7": undefined,
  "P8": undefined,
  "P9": undefined,
};

export const testPlayerDataSet: PlayerData[] = [
  {
    id: 1,
    name: "PlayerName 1",
    team: "PlayerTeam 1",
    positions: ["OF1"],
    suggestedValue: 32,
    stats: {
      projection: {
        seasons: [2026],
        hitter: {"Homeruns": 1}
      },
      lastYear: {
        seasons: [2025],
        hitter: {"Homeruns": 1}
      },
      threeYearAvg: {
        seasons: [2023, 2024, 2025],
        hitter: {"Homeruns": 3}
      }
    }
  },
  {
    id: 2,
    name: "PlayerName 2",
    team: "PlayerTeam 2",
    positions: ["OF1"],
    suggestedValue: 32,
    stats: {
      projection: {
        seasons: [2026],
        hitter: {"Homeruns": 2}
      },
      lastYear: {
        seasons: [2025],
        hitter: {"Homeruns": 2}
      },
      threeYearAvg: {
        seasons: [2023, 2024, 2025],
        hitter: {"Homeruns": 6}
      }
    }
  },
  {
    id: 3,
    name: "PlayerName 3",
    team: "PlayerTeam 3",
    positions: ["OF1"],
    suggestedValue: 32,
    stats: {
      projection: {
        seasons: [2026],
        hitter: {"Homeruns": 3}
      },
      lastYear: {
        seasons: [2025],
        hitter: {"Homeruns": 3}
      },
      threeYearAvg: {
        seasons: [2023, 2024, 2025],
        hitter: {"Homeruns": 9}
      }
    }
  },
  {
    id: 4,
    name: "PlayerName 4",
    team: "PlayerTeam 4",
    positions: ["OF1"],
    suggestedValue: 32,
    stats: {
      projection: {
        seasons: [2026],
        hitter: {"Homeruns": 4}
      },
      lastYear: {
        seasons: [2025],
        hitter: {"Homeruns": 4}
      },
      threeYearAvg: {
        seasons: [2023, 2024, 2025],
        hitter: {"Homeruns": 12}
      }
    }
  }
];

export const testDraftDataSet: DraftData[] = [
  {
    userId: 'anonymous-user',
    id: "draft1",
    teamName: "Team1",
    roster: {
      ...emptyRoster,
      "C": testPlayerDataSet[0].id,
      "1B": testPlayerDataSet[1].id
    }
  },
  {
    userId: 'anonymous-user',
    id: "draft2",
    teamName: "Team2",
    roster: {
      ...emptyRoster,
      "C": testPlayerDataSet[2].id,
      "1B": testPlayerDataSet[3].id
    }
  }
];

export const testLeagueDataSet: LeagueData[] = [
  {
    id: "league1",
    name: "Example League",
    startingBudget: 300,
    teams: {
      "Team1": {
        roster: {
          ...emptyRoster,
          "C": testPlayerDataSet[0].id,
          "1B": testPlayerDataSet[1].id
        }
      },
      "Team2": {
        roster: {
          ...emptyRoster,
          "C": testPlayerDataSet[2].id,
          "1B": testPlayerDataSet[3].id
        }
      }
    }
  }
];

export const testPlayer: PlayerData = testPlayerDataSet[0];

export const testDraft: DraftData = testDraftDataSet[0];

export const testLeague: LeagueData = testLeagueDataSet[0];
