import { PlayerData, DraftData, LeagueData } from "../types";

export const testPlayerDataSet: PlayerData[] = [
  {
    id: "player1",
    name: "PlayerName 1",
    team: "PlayerTeam 1",
    stats: {"Homeruns": 1000}
  },
  {
    id: "player2",
    name: "PlayerName 2",
    team: "PlayerTeam 2",
    stats: {}
  },
  {
    id: "player3",
    name: "PlayerName 3",
    team: "PlayerTeam 3",
    stats: {}
  },
  {
    id: "player4",
    name: "PlayerName 4",
    team: "PlayerTeam 4",
    stats: {}
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
