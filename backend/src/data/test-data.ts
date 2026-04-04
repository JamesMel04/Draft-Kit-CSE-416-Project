import { PlayerData, DraftData, LeagueData } from '@/types';

// Draft rosters are typed as full slot maps; empty string means slot not filled yet.
const emptyRoster: DraftData["roster"] = {
  "C": "",
  "1B": "",
  "2B": "",
  "3B": "",
  "SS": "",
  "CI": "",
  "MI": "",
  "OF1": "",
  "OF2": "",
  "OF3": "",
  "OF4": "",
  "OF5": "",
  "UTIL": "",
  "P1": "",
  "P2": "",
  "P3": "",
  "P4": "",
  "P5": "",
  "P6": "",
  "P7": "",
  "P8": "",
  "P9": "",
};

export const testPlayerDataSet: PlayerData[] = [
  {
    id: "player1",
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
    id: "player2",
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
    id: "player3",
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
    id: "player4",
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
    id: "draft1",
    roster: {
      ...emptyRoster,
      "C": testPlayerDataSet[0].id,
      "1B": testPlayerDataSet[1].id
    }
  },
  {
    id: "draft2",
    roster: {
      ...emptyRoster,
      "C": testPlayerDataSet[2].id,
      "1B": testPlayerDataSet[3].id
    }
  }
];

export const testLeagueDataSet: LeagueData[] = [
  {
    name: "Example League",
    teams: {
      "TeamManager 1": testDraftDataSet[0],
      "TeamManager 2": testDraftDataSet[1]
    }
  }
];

export const testPlayer: PlayerData = testPlayerDataSet[0];

export const testDraft: DraftData = testDraftDataSet[0];

export const testLeague: LeagueData = testLeagueDataSet[0];
