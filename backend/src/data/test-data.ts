import { PlayerData, DraftData, LeagueData } from "../types";

export const test_player_data_set: PlayerData[] = [
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

export const test_draft_data_set: DraftData[] = [
  {
    id: "draft1",
    roster: {
      "C": test_player_data_set[0],
      "1B": test_player_data_set[1]
    }
  },
  {
    id: "draft2",
    roster: {
      "C": test_player_data_set[2],
      "1B": test_player_data_set[3]
    }
  }
];

export const test_league_data_set: LeagueData[] = [
  {
    name: "Example League",
    teams: {
      "TeamManager 1": test_draft_data_set[0],
      "TeamManager 2": test_draft_data_set[1]
    }
  }
];

export const test_player: PlayerData = test_player_data_set[0];

export const test_draft: DraftData = test_draft_data_set[0];

export const test_league: LeagueData = test_league_data_set[0];
