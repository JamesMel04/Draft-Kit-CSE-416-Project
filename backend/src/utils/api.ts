
import axios from 'axios';
import { PlayerData, PlayerEvaluation, PlayerID, PlayerPools, PlayerValuation, ValuationRequest } from '@/types';
import { requiredEnv } from "@/utils/env-reader";
import { convertPlayerPoolsToPlayerData, convertPlayerToPlayerData, convertPlayerValuationToEvaluation } from '@/utils/api-type-converter';
import { MLB_API_KEY } from '@/consts';

type QueryParamValue = string | number | boolean | undefined;
type QueryParams = Record<string, QueryParamValue>;

const API_URL = requiredEnv('API_URL');

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    "mlb-api-key": MLB_API_KEY
  }
});

function cleanParams(params: QueryParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

// Returns the PlayerPools from the /players API endpoint
export async function getPlayers(): Promise<PlayerPools> {
  try {
    const { data } = await api.get<PlayerPools>('/players');
    return data ?? {hitters: [], pitchers: []};
  } catch (err) {
    console.error('Players fetch failed:', err);
    throw err;
  }
}

export async function getPlayerEvaluations(requestBody: ValuationRequest | undefined): Promise<PlayerEvaluation[]> {
  try {
    const { hitters, pitchers } = convertPlayerPoolsToPlayerData(await getPlayers());

    const playersMap = new Map<PlayerID, PlayerData>();
    for (const player of [...hitters, ...pitchers]) {
      playersMap.set(player.id, player);
    }

    const { data } = await api.post<PlayerValuation[]>('/players/valuations', { ...requestBody });

    const evaluationsMap = new Map<PlayerID, PlayerEvaluation>();
    for (const valuation of data) {
      const player = playersMap.get(valuation.id);
      if (!player) continue;
      evaluationsMap.set(valuation.id, convertPlayerValuationToEvaluation(player, valuation));
    }

    const evaluations = Array.from(evaluationsMap.values());

    return evaluations;
  } catch (err) {
    console.error('Evaluated players fetch failed:', err);
    throw err;
  }
}