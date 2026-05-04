import fs from 'fs';
import path from 'path';
import { PlayerData, DraftData, LeagueData } from '../types';
import { getPlayers } from '../utils/api';

// Path where fetched player JSON will be written for later inspection.
const playersJsonPath = path.join(__dirname, 'players.json');

// Draft rosters are typed as full slot maps; empty value means slot not filled yet.
const emptyRoster: DraftData['roster'] = {
  C: undefined,
  '1B': undefined,
  '2B': undefined,
  '3B': undefined,
  SS: undefined,
  CI: undefined,
  MI: undefined,
  OF1: undefined,
  OF2: undefined,
  OF3: undefined,
  OF4: undefined,
  OF5: undefined,
  UTIL: undefined,
  P1: undefined,
  P2: undefined,
  P3: undefined,
  P4: undefined,
  P5: undefined,
  P6: undefined,
  P7: undefined,
  P8: undefined,
  P9: undefined,
};

// Exports populated by `initTestData()` below. There is no local mock fallback;
// if fetching fails, initialization will throw so the server can decide how to proceed.
export const testPlayerDataSet: PlayerData[] = [];
export const testDraftDataSet: DraftData[] = [];
export const testLeagueDataSet: LeagueData[] = [];

export let testPlayer: PlayerData | undefined;
export let testDraft: DraftData | undefined;
export let testLeague: LeagueData | undefined;

export async function initTestData(): Promise<void> {
  try {
    const { hitters, pitchers } = await getPlayers();
    const combined: PlayerData[] = [...hitters, ...pitchers];

    // Write fetched players to players.json for debugging/inspection.
    try {
      fs.writeFileSync(playersJsonPath, JSON.stringify(combined, null, 2), 'utf8');
    } catch (writeErr) {
      console.error('Failed to write players.json:', writeErr);
    }

    // Populate exported arrays in-place so other modules holding references see updates.
    testPlayerDataSet.length = 0;
    testPlayerDataSet.push(...combined);

    // Build minimal drafts/leagues from available players (may be empty arrays if not enough players).
    testDraftDataSet.length = 0;
    testLeagueDataSet.length = 0;

    if (testPlayerDataSet.length >= 4) {
      testDraftDataSet.push(
        {
          userId: 'anonymous-user',
          id: 'draft1',
          teamName: 'Team1',
          roster: { ...emptyRoster, C: testPlayerDataSet[0].id, '1B': testPlayerDataSet[1].id },
        },
        {
          userId: 'anonymous-user',
          id: 'draft2',
          teamName: 'Team2',
          roster: { ...emptyRoster, C: testPlayerDataSet[2].id, '1B': testPlayerDataSet[3].id },
        }
      );

      testLeagueDataSet.push({
        id: 'league1',
        name: 'Example League',
        startingBudget: 300,
        teams: {
          Team1: { roster: { ...emptyRoster, C: testPlayerDataSet[0].id, '1B': testPlayerDataSet[1].id } },
          Team2: { roster: { ...emptyRoster, C: testPlayerDataSet[2].id, '1B': testPlayerDataSet[3].id } },
        },
      });

      testPlayer = testPlayerDataSet[0];
      testDraft = testDraftDataSet[0];
      testLeague = testLeagueDataSet[0];
    }
  } catch (err) {
    console.error('initTestData failed:', err);
    throw err;
  }
}
