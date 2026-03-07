import { PlayerData, DraftData, LeagueData } from "../types";

export const testPlayerDataSet: PlayerData[] = [
  {
    id: "player1",
    name: "PlayerName 1",
    team: "PlayerTeam 1",
    positions: ["OF"],
    suggestedValue: 32,
    stats: {
      projection: {
        season: [2026],
        hitter: {"Homeruns": 1}
      },
      lastYear: {
        season: [2025],
        hitter: {"Homeruns": 1}
      },
      threeYearAvg: {
        season: [2023, 2024, 2025],
        hitter: {"Homeruns": 3}
      }
    }
  },
  {
    id: "player2",
    name: "PlayerName 2",
    team: "PlayerTeam 2",
    positions: ["OF"],
    suggestedValue: 32,
    stats: {
      projection: {
        season: [2026],
        hitter: {"Homeruns": 2}
      },
      lastYear: {
        season: [2025],
        hitter: {"Homeruns": 2}
      },
      threeYearAvg: {
        season: [2023, 2024, 2025],
        hitter: {"Homeruns": 6}
      }
    }
  },
  {
    id: "player3",
    name: "PlayerName 3",
    team: "PlayerTeam 3",
    positions: ["OF"],
    suggestedValue: 32,
    stats: {
      projection: {
        season: [2026],
        hitter: {"Homeruns": 3}
      },
      lastYear: {
        season: [2025],
        hitter: {"Homeruns": 3}
      },
      threeYearAvg: {
        season: [2023, 2024, 2025],
        hitter: {"Homeruns": 9}
      }
    }
  },
  {
    id: "player4",
    name: "PlayerName 4",
    team: "PlayerTeam 4",
    positions: ["OF"],
    suggestedValue: 32,
    stats: {
      projection: {
        season: [2026],
        hitter: {"Homeruns": 4}
      },
      lastYear: {
        season: [2025],
        hitter: {"Homeruns": 4}
      },
      threeYearAvg: {
        season: [2023, 2024, 2025],
        hitter: {"Homeruns": 12}
      }
    }
  }
];

export const testDraftDataSet: DraftData[] = [
  {
    id: "draft1",
    roster: {
      "C": testPlayerDataSet[0],
      "1B": testPlayerDataSet[1]
    }
  },
  {
    id: "draft2",
    roster: {
      "C": testPlayerDataSet[2],
      "1B": testPlayerDataSet[3]
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
