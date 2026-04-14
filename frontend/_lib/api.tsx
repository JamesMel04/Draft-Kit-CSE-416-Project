/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts";
import {
    CleanQueryParams,
    DraftEvaluationResponse,
    PlayerEvaluationQueryParams,
    PlayerEvaluationResponse,
    PaginationMeta,
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

function normalizePagination(
    raw: PaginationMeta | undefined,
    requestedPage: number,
    requestedLimit: number,
    currentCount: number
): PaginationMeta {
    const limit = requestedLimit > 0 ? requestedLimit : raw?.limit ?? 25;
    const total = Math.max(raw?.total ?? currentCount, currentCount);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(Math.max(raw?.page ?? requestedPage, 1), totalPages);

    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
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
Get players on specific page, based off parameters specified in backend documentation (README)
*/
export async function getPlayers(params : PlayerQueryParams) : Promise<PlayerGetResponse> {
    try {
        const res = (await api.get<PlayerGetResponse>(`/players`, {
            params: cleanParams(params),
        })).data;

        return res;
    } catch (err) {
        console.error("Players query failed: ", err);
        throw err;
    }
}

export async function getEvaluatedPlayers(filters: PlayerEvaluationQueryParams = {}): Promise<PlayerEvaluationResponse> {
    const requestedPage = filters.page ?? 1;
    const requestedLimit = filters.limit ?? 25;
    const queryPositions = filters.positions?.length ? Array.from(new Set(filters.positions.flatMap((pos) => (pos.toUpperCase() === "P" ? ["P", "SP", "RP"] : [pos])))) : undefined;

    const res = (await api.get<PlayerEvaluationResponse>(`/evaluation/players`, {
        params: cleanParams({
            playerIds: filters.playerIds?.length ? filters.playerIds.join(",") : undefined,
            positions: queryPositions?.length ? queryPositions.join(",") : undefined,
            alreadyTakenIds: filters.alreadyTakenIds?.length ? filters.alreadyTakenIds.join(",") : undefined,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            name: filters.name,
            sort: filters.sort,
            asc: filters.asc,
            page: filters.page,
            limit: filters.limit,
        }),
    })).data;

    return {
        ...res,
        pagination: normalizePagination(res.pagination, requestedPage, requestedLimit, res.players.length),
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
            params: { userId },
            headers: {
                "x-user-id": userId,
            },
        })).data;
        return res.drafts ?? [];
    } catch {
        return [];
    }
}