"use client";

import { getEvaluatedDrafts, getSavedDrafts } from "@/_lib/api";
import { allSearchFilterPositions } from "@/_lib/consts";
import { EvaluatedDraftValue, EvaluatedPlayer, EvaluationMeta, SavedDraftSummary } from "@/_lib/types";
import PlayerEvaluationPanel from "@/components/players/player_evaluation_panel";
import { useEffect, useMemo, useState } from "react";

export default function Evaluation() {
    const [savedDrafts, setSavedDrafts] = useState<SavedDraftSummary[]>([]);
    const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
    const [savedDraftsLoading, setSavedDraftsLoading] = useState(false);
    const [savedDraftsError, setSavedDraftsError] = useState<string | null>(null);

    const [playerResults, setPlayerResults] = useState<EvaluatedPlayer[]>([]);
    const [draftResults, setDraftResults] = useState<EvaluatedDraftValue[]>([]);

    const [draftMeta, setDraftMeta] = useState<EvaluationMeta | null>(null);

    const [draftLoading, setDraftLoading] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);

    useEffect(() => {
        const loadSavedDrafts = async () => {
            try {
                setSavedDraftsLoading(true);
                setSavedDraftsError(null);
                const drafts = await getSavedDrafts("demo-user");
                setSavedDrafts(drafts);
            } catch {
                setSavedDraftsError("Failed to load saved drafts.");
            } finally {
                setSavedDraftsLoading(false);
            }
        };

        loadSavedDrafts();
    }, []);

    const runDraftEvaluation = async () => {
        const ids = Array.from(new Set(selectedDraftIds));
        if (!ids.length) {
            setDraftError("Select at least one saved draft.");
            setDraftResults([]);
            setDraftMeta(null);
            return;
        }

        try {
            setDraftLoading(true);
            setDraftError(null);

            const res = await getEvaluatedDrafts(ids);
            setDraftResults(res.drafts);
            setDraftMeta(res.meta);
        } catch {
            setDraftError("Failed to evaluate drafts.");
            setDraftResults([]);
            setDraftMeta(null);
        } finally {
            setDraftLoading(false);
        }
    };

    const toggleDraftSelection = (draftId: string) => {
        setSelectedDraftIds((prev) =>
            prev.includes(draftId) ? prev.filter((id) => id !== draftId) : [...prev, draftId]
        );
    };

    const bestDraft = useMemo(() => {
        if (!draftResults.length) return null;
        return [...draftResults].sort((a, b) => b.value - a.value)[0];
    }, [draftResults]);

    const bestPlayer = useMemo(() => {
        if (!playerResults.length) return null;
        return [...playerResults].sort((a, b) => b.evaluation.score - a.evaluation.score)[0];
    }, [playerResults]);

    const playerColumns = [
        {
            header: "Player",
            renderCell: (player: EvaluatedPlayer) => <span className="font-semibold">{player.name}</span>,
        },
        {
            header: "Team",
            renderCell: (player: EvaluatedPlayer) => player.team,
        },
        {
            header: "Pos",
            renderCell: (player: EvaluatedPlayer) => player.positions.join(", "),
        },
        {
            header: "Value",
            renderCell: (player: EvaluatedPlayer) => `$${player.suggestedValue}`,
        },
        {
            header: "Eval Score",
            renderCell: (player: EvaluatedPlayer) => player.evaluation.score,
        },
        {
            header: "Tier",
            renderCell: (player: EvaluatedPlayer) => player.evaluation.tier,
        },
    ];

    return (
        <div className="space-y-5 text-slate-900">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight">Evaluation Center</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Evaluate players and drafts on demand.
                </p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <div className="space-y-3">
                    <PlayerEvaluationPanel
                        title="Player Evaluation"
                        description="Evaluate players using practical filters."
                        positionOptions={allSearchFilterPositions}
                        columns={playerColumns}
                        emptyMessage="No player evaluations yet."
                        onResultsChange={({ players }) => setPlayerResults(players)}
                    />

                    {bestPlayer && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                            Best result: <span className="font-semibold">{bestPlayer.name}</span> | Score {bestPlayer.evaluation.score}
                        </div>
                    )}
                </div>

                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-xl font-bold">Draft Evaluation</h2>
                    <p className="text-xs text-slate-500">Choose saved drafts to evaluate.</p>

                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold uppercase text-slate-600">Saved drafts (from backend)</div>

                        {savedDraftsLoading ? (
                            <p className="mt-2 text-xs text-slate-500">Loading saved drafts...</p>
                        ) : savedDraftsError ? (
                            <p className="mt-2 text-xs font-semibold text-rose-700">{savedDraftsError}</p>
                        ) : savedDrafts.length === 0 ? (
                            <p className="mt-2 text-xs text-slate-500">No saved drafts found.</p>
                        ) : (
                            <div className="mt-2 space-y-2">
                                {savedDrafts.map((draft) => {
                                    const selected = selectedDraftIds.includes(draft.draftId);
                                    return (
                                        <label
                                            key={draft.draftId}
                                            className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2"
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{draft.name}</div>
                                                <div className="text-xs text-slate-500">
                                                    {draft.draftId} | {new Date(draft.updatedAt).toLocaleString()}
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() => toggleDraftSelection(draft.draftId)}
                                            />
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={runDraftEvaluation}
                        className="rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                        {draftLoading ? "Evaluating..." : "Evaluate Drafts"}
                    </button>

                    {draftMeta && (
                        <div className="rounded-md bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                            Source: {draftMeta.source}
                            {draftMeta.provider ? ` | Provider: ${draftMeta.provider}` : ""}
                        </div>
                    )}

                    {draftError && (
                        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                            {draftError}
                        </div>
                    )}

                    {bestDraft && (
                        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                            Best draft: <span className="font-semibold">{bestDraft.draftId}</span> | Value {bestDraft.value}
                        </div>
                    )}

                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-slate-100 text-slate-800">
                                <tr>
                                    <th className="px-3 py-2 text-left font-bold">Draft ID</th>
                                    <th className="px-3 py-2 text-left font-bold">Evaluated Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!draftResults.length ? (
                                    <tr>
                                        <td className="px-3 py-3 text-slate-500" colSpan={2}>
                                            No draft evaluations yet.
                                        </td>
                                    </tr>
                                ) : (
                                    draftResults.map((draft) => (
                                        <tr key={draft.draftId} className="border-t border-slate-200">
                                            <td className="px-3 py-2 font-semibold">{draft.draftId}</td>
                                            <td className="px-3 py-2">{draft.value}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}