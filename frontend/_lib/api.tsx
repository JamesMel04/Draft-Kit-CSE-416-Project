/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts";
import {
    DraftData,
    EvaluatedDraftListResponse,
    EvaluatedDraftValue,
    EvaluatedDraftResponse,
    EvaluationPlayerFilters,
    EvaluatedPlayer,
    EvaluatedPlayerListResponse,
    PaginationMeta,
    PlayerData,
    PlayerGetParams,
    PlayerGetResponse,
    SavedDraftListResponse,
    SavedDraftSummary,
} from "./types";
import axios from "axios";

/*
* Config for axios. Much easier to make backend requests this way
*/
const api = axios.create({
    baseURL: `${BACKEND_URL}`,
});

function fallbackTierFromValue(value: number): string {
    if (value >= 35) return "S";
    if (value >= 25) return "A";
    if (value >= 15) return "B";
    return "C";
}

function fallbackScoreFromPlayer(player: PlayerData): number {
    const projectionTotal = Object.values(player.stats?.projection?.hitter ?? {}).reduce(
        (acc, stat) => (typeof stat === "number" ? acc + stat : acc),
        0
    );

    return Number((player.suggestedValue * 2 + projectionTotal * 0.08).toFixed(1));
}

function toEvaluatedPlayer(player: PlayerData): EvaluatedPlayer {
    return {
        id: player.id,
        name: player.name,
        team: player.team,
        positions: player.positions,
        suggestedValue: player.suggestedValue,
        evaluation: {
            score: fallbackScoreFromPlayer(player),
            tier: fallbackTierFromValue(player.suggestedValue),
            confidence: 0.55,
            summary: "Fallback estimate until backend evaluation endpoint is active.",
        },
    };
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

function defaultSorting(filters: EvaluationPlayerFilters) {
    return {
        sort: filters.sort ?? "suggestedValue",
        asc: filters.asc ?? false,
    };
}

function normalizeFilterPosition(pos: string): string {
    const upper = pos.toUpperCase();
    if (["LF", "CF", "RF", "OF"].includes(upper) || /^OF\d+$/.test(upper)) return "OF";
    if (["P", "SP", "RP"].includes(upper) || /^P\d+$/.test(upper)) return "P";
    return upper;
}

function matchesPositionFilter(playerPositions: string[], positionSet: Set<string>): boolean {
    return playerPositions.some((pos) => {
        const normalized = normalizeFilterPosition(pos);
        return positionSet.has(normalized);
    });
}

function applyEvaluationFilters(players: PlayerData[], filters: EvaluationPlayerFilters): PlayerData[] {
    const idSet = filters.playerIds && filters.playerIds.length ? new Set(filters.playerIds) : null;
    const positionSet = filters.positions && filters.positions.length ? new Set(filters.positions.map((pos) => normalizeFilterPosition(pos))) : null;
    const takenSet = filters.alreadyTakenIds && filters.alreadyTakenIds.length ? new Set(filters.alreadyTakenIds) : null;
    const minPrice = filters.minPrice ?? Number.NEGATIVE_INFINITY;
    const maxPrice = filters.maxPrice ?? Number.POSITIVE_INFINITY;
    const nameQuery = filters.name ? filters.name.toLowerCase() : null;

    return players.filter((player) => {
        if (idSet && !idSet.has(player.id)) return false;
        if (positionSet && !matchesPositionFilter(player.positions, positionSet)) return false;
        if (takenSet && takenSet.has(player.id)) return false;
        if (player.suggestedValue < minPrice) return false;
        if (player.suggestedValue > maxPrice) return false;
        if (nameQuery && !player.name.toLowerCase().includes(nameQuery)) return false;
        return true;
    });
}


export async function getPlayer(id : string) : Promise<PlayerData> {
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

export async function getEvaluatedPlayers(filters: EvaluationPlayerFilters = {}): Promise<EvaluatedPlayerListResponse> {
    const requestedPage = filters.page ?? 1;
    const requestedLimit = filters.limit ?? 25;
    const queryPositions = filters.positions?.length ? Array.from(new Set(filters.positions.flatMap((pos) => (pos.toUpperCase() === "P" ? ["P", "SP", "RP"] : [pos])))) : undefined;

    try {
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
        const res = (await api.get<EvaluatedPlayerListResponse>(url)).data;

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
    } catch {
        const fallbackParams: PlayerGetParams = {
            name: filters.name,
            sort: filters.sort,
            asc: filters.asc,
            page: requestedPage,
            limit: requestedLimit,
        };

        const fallback = await getPlayers(fallbackParams);
        const filteredPage = applyEvaluationFilters(fallback.players, {
            ...filters,
            name: undefined,
        });

        return {
            players: filteredPage.map(toEvaluatedPlayer),
            pagination: normalizePagination(
                fallback.pagination,
                requestedPage,
                requestedLimit,
                filteredPage.length
            ),
            sorting: defaultSorting(filters),
            meta: {
                source: "fallback",
                provider: "frontend-fallback",
                generatedAt: new Date().toISOString(),
                notes: "Using fast fallback from backend /players while evaluator is unavailable.",
            },
        };
    }
}

export async function getEvaluatedDrafts(draftIds: string[]): Promise<EvaluatedDraftListResponse> {
    try {
        const query = new URLSearchParams();
        if (draftIds.length) query.append("draftIds", draftIds.join(","));

        const url = query?.toString() ? `/evaluation/drafts?${query.toString()}` : `/evaluation/drafts`;
        const res = (await api.get<EvaluatedDraftListResponse>(url)).data;

        return {
            ...res,
            meta: {
                source: res.meta?.source ?? "backend",
                provider: res.meta?.provider ?? "external-evaluator",
                generatedAt: res.meta?.generatedAt,
                notes: res.meta?.notes,
            },
        };
    } catch {
        const draftValues: EvaluatedDraftValue[] = [];

        for (const draftId of draftIds) {
            try {
                const single = await getEvaluatedDraft(draftId);
                draftValues.push({
                    draftId,
                    value: single.totals.score,
                });
            } catch {
                draftValues.push({ draftId, value: 0 });
            }
        }

        return {
            drafts: draftValues,
            meta: {
                source: "fallback",
                provider: "frontend-fallback",
                generatedAt: new Date().toISOString(),
                notes: "Draft batch evaluation computed from fallback estimates.",
            },
        };
    }
}

export async function getEvaluatedDraft(draftId: string): Promise<EvaluatedDraftResponse> {
    try {
        const res = (await api.get<EvaluatedDraftResponse>(`/evaluation/drafts/${draftId}`)).data;
        return {
            ...res,
            meta: {
                source: res.meta?.source ?? "backend",
                provider: res.meta?.provider ?? "external-evaluator",
                generatedAt: res.meta?.generatedAt,
                notes: res.meta?.notes,
            },
        };
    } catch {
        const fallbackDraft: { draft?: DraftData } = (await api.get(`/drafts/${draftId}`)).data;
        const entries = Object.entries(fallbackDraft?.draft?.roster ?? {});

        const slots = entries.map(([position, player]) => ({
            position,
            player: player ? toEvaluatedPlayer(player as PlayerData) : null,
        }));

        const totals = slots.reduce(
            (acc, slot) => ({
                value: acc.value + (slot.player?.suggestedValue ?? 0),
                score: acc.score + (slot.player?.evaluation.score ?? 0),
            }),
            { value: 0, score: 0 }
        );

        return {
            draftId,
            slots,
            totals: {
                value: totals.value,
                score: Number(totals.score.toFixed(1)),
            },
            meta: {
                source: "fallback",
                provider: "frontend-fallback",
                generatedAt: new Date().toISOString(),
                notes: "Draft evaluation computed from fallback player estimates.",
            },
        };
    }
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