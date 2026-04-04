/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts";
import {
    DraftEvaluationGetResponse,
    PlayerEvaluationFilters,
    PlayerEvaluationGetResponse,
    PaginationMeta,
    PlayerData,
    PlayerGetParams,
    PlayerGetResponse,
    SavedDraftListResponse,
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
export async function getPlayers(params : PlayerGetParams) : Promise<PlayerGetResponse> {
    try {
        const query = new URLSearchParams();
        let k: keyof typeof params;
        for (k in params) {
            const v = params[k];
            if (v !== null && v !== undefined) query.append(k, v.toString());
        }

        // Now query to the backend
        const url = query?.toString() ? `/players?${query.toString()}` : `/players`;
        console.log(`Querying ${url}`);
        const res = (await api.get<PlayerGetResponse>(url)).data;

        return res;
    } catch (err) {
        console.error("Players query failed: ", err);
        throw err;
    }
}

export async function getEvaluatedPlayers(filters: PlayerEvaluationFilters = {}): Promise<PlayerEvaluationGetResponse> {
    const requestedPage = filters.page ?? 1;
    const requestedLimit = filters.limit ?? 25;
    const queryPositions = filters.positions?.length ? Array.from(new Set(filters.positions.flatMap((pos) => (pos.toUpperCase() === "P" ? ["P", "SP", "RP"] : [pos])))) : undefined;

    const query = new URLSearchParams();
    if (filters.playerIds?.length) query.append("playerIds", filters.playerIds.join(","));
    if (queryPositions?.length) query.append("positions", queryPositions.join(","));
    if (filters.alreadyTakenIds?.length) query.append("alreadyTakenIds", filters.alreadyTakenIds.join(","));
    if (filters.minPrice !== undefined) query.append("minPrice", filters.minPrice.toString());
    if (filters.maxPrice !== undefined) query.append("maxPrice", filters.maxPrice.toString());
    if (filters.name) query.append("name", filters.name);
    if (filters.sort) query.append("sort", filters.sort);
    if (filters.asc !== undefined) query.append("asc", filters.asc.toString());
    if (filters.page !== undefined) query.append("page", filters.page.toString());
    if (filters.limit !== undefined) query.append("limit", filters.limit.toString());

    const url = query?.toString() ? `/evaluation/players?${query.toString()}` : `/evaluation/players`;
    const res = (await api.get<PlayerEvaluationGetResponse>(url)).data;

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

export async function getEvaluatedDrafts(draftIds: DraftID[]): Promise<DraftEvaluationGetResponse> {
    const query = new URLSearchParams();
    query.append("draftIds", draftIds.join(","));

    const url = query?.toString() ? `/evaluation/drafts?${query.toString()}` : `/evaluation/drafts`;
    const res = (await api.get<DraftEvaluationGetResponse>(url)).data;

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

export async function getSavedDrafts(userId: string): Promise<SavedDraftSummary[]> {
    try {
        const query = new URLSearchParams();
        if (userId) query.append("userId", userId);

        const url = query?.toString() ? `/drafts/saved?${query.toString()}` : "/drafts/saved";
        const res = (await api.get<SavedDraftListResponse>(url)).data;
        return res.drafts ?? [];
    } catch {
        return [];
    }
}