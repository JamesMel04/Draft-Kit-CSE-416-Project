/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts";
import {
    CleanQueryParams,
    DraftEvaluationResponse,
    PlayerEvaluationQueryParams,
    PlayerEvaluationResponse,
    PlayerData,
    PlayerQueryParams,
    PlayerGetResponse,
    QueryParams,
    SavedDraftsResponse,
    SavedDraftSummary,
    DraftID,
    PlayerID,
} from "./types";
import axios from "axios";

/*
* Config for axios. Much easier to make backend requests this way
*/
const api = axios.create({
    baseURL: `${BACKEND_URL}`,
});

function cleanParams(params: QueryParams): CleanQueryParams {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined)
    ) as CleanQueryParams;
}


export async function getPlayer(id : PlayerID) : Promise<PlayerData> {
    try {
        const res: { player: PlayerData } = (await api.get(`/players/${id}`)).data;
        return res.player;
    } catch (err) {
        console.error("Player fetch failed: ", err);
        throw err;
    }
}

/*
Get players with backend filtering parameters
*/
export async function getPlayers(params : PlayerQueryParams) : Promise<PlayerGetResponse> {
    try {
        const res = (await api.get<PlayerGetResponse>(`/players`, {
            params: cleanParams({
                name: params.name,
            }),
        })).data;

        return res;
    } catch (err) {
        console.error("Players query failed: ", err);
        throw err;
    }
}

export async function getEvaluatedPlayers(filters: PlayerEvaluationQueryParams = {}): Promise<PlayerEvaluationResponse> {
    const queryPositions = filters.positions?.length ? Array.from(new Set(filters.positions.flatMap((pos) => (pos.toUpperCase() === "P" ? ["P", "SP", "RP"] : [pos])))) : undefined;

    const res = (await api.get<PlayerEvaluationResponse>(`/evaluation/players`, {
        params: cleanParams({
            playerIds: filters.playerIds?.length ? filters.playerIds.join(",") : undefined,
            positions: queryPositions?.length ? queryPositions.join(",") : undefined,
            alreadyTakenIds: filters.alreadyTakenIds?.length ? filters.alreadyTakenIds.join(",") : undefined,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            name: filters.name,
        }),
    })).data;

    return {
        ...res,
        meta: {
            source: res.meta?.source ?? "backend",
            provider: res.meta?.provider ?? "external-evaluator",
            generatedAt: res.meta?.generatedAt,
            notes: res.meta?.notes,
        },
    };
}

export async function getEvaluatedDrafts(draftIds: DraftID[]): Promise<DraftEvaluationResponse> {
    const res = (await api.get<DraftEvaluationResponse>(`/evaluation/drafts`, {
        params: { draftIds: draftIds.join(",") },
    })).data;

    return {
        ...res,
        meta: {
            source: res.meta?.source ?? "backend",
            provider: res.meta?.provider ?? "external-evaluator",
            generatedAt: res.meta?.generatedAt,
            notes: res.meta?.notes,
        },
    };
}

export async function getSavedDrafts(userId?: string): Promise<SavedDraftSummary[]> {
    try {
        if (!userId) return [];

        const res = (await api.get<SavedDraftsResponse>("/drafts/saved", {
            headers: {
                "x-user-id": userId,
            },
        })).data;
        return res.drafts ?? [];
    } catch {
        return [];
    }
}