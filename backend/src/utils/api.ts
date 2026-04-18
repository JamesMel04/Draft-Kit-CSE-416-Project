
import axios from 'axios';
import { PlayerData, PlayerEvaluation } from '@/types';
import { requiredEnv } from "@/utils/env-reader";

type QueryParamValue = string | number | boolean | undefined;
type QueryParams = Record<string, QueryParamValue>;

const API_URL = requiredEnv('API_URL');

const api = axios.create({
  baseURL: API_URL,
  timeout: 5000,
  headers: { 'Content-Type': 'application/json' }
});

function cleanParams(params: QueryParams): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number | boolean>;
}

export async function getPlayers(): Promise<PlayerData[]> {
  try {
    const { data } = await api.get<PlayerData[]>('/players');
    return data ?? [];
  } catch (err) {
    console.error('Players fetch failed:', err);
    throw err;
  }
}


export async function getPlayerEvaluations(params: QueryParams = {}): Promise<PlayerEvaluation[]> {
  try {
    const { data } = await api.get<PlayerEvaluation[]>('/evaluation/players', {
      params: cleanParams(params),
    });
    return data ?? [];
  } catch (err) {
    console.error('Evaluated players fetch failed:', err);
    throw err;
  }
}