"use client";

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { DraftEvaluation, PlayerEvaluation, DraftData } from '@/_lib/types';
import { allSearchFilterPositions } from '@/_lib/consts';
import { getEvaluatedDrafts, getSavedDrafts } from '@/_lib/api';
import PlayerEvaluationPanel from '@/components/players/player_evaluation_panel';

export default function Evaluation() {
    const { user } = useUser();
    const [savedDrafts, setSavedDrafts] = useState<DraftData[]>([]);
    const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
    const [savedDraftsLoading, setSavedDraftsLoading] = useState(false);
    const [savedDraftsError, setSavedDraftsError] = useState<string | null>(null);

    const [playerResults, setPlayerResults] = useState<PlayerEvaluation[]>([]);
    const [draftResults, setDraftResults] = useState<DraftEvaluation[]>([]);
    
    // Track which draft the user is currently inspecting
    const [inspectedDraftId, setInspectedDraftId] = useState<string | null>(null);

    const [draftLoading, setDraftLoading] = useState(false);
    const [draftError, setDraftError] = useState<string | null>(null);

    useEffect(() => {
        const loadSavedDrafts = async () => {
            try {
                setSavedDraftsLoading(true);
                setSavedDraftsError(null);
                const drafts = await getSavedDrafts(user?.sub);
                setSavedDrafts(drafts);
            } catch {
                setSavedDraftsError("Failed to load saved drafts.");
            } finally {
                setSavedDraftsLoading(false);
            }
        };

        // if (user?.sub) loadSavedDrafts();
        loadSavedDrafts();
    }, [user?.sub]);

    const runDraftEvaluation = async () => {
        const ids = Array.from(new Set(selectedDraftIds));
        if (!ids.length) {
            setDraftError("Select at least one saved draft.");
            setDraftResults([]);
            return;
        }

        try {
            setDraftLoading(true);
            setDraftError(null);
            const res = await getEvaluatedDrafts(ids);
            setDraftResults(res.drafts);
            // Auto-select the first one to show details immediately
            if (res.drafts.length > 0) setInspectedDraftId(res.drafts[0].id);
        } catch {
            setDraftError("Failed to evaluate drafts.");
            setDraftResults([]);
        } finally {
            setDraftLoading(false);
        }
    };

    const toggleDraftSelection = (draftId: string) => {
        setSelectedDraftIds((prev) =>
            prev.includes(draftId) ? prev.filter((id) => id !== draftId) : [...prev, draftId]
        );
    };

    // Helper to find the details of the currently "clicked" draft
    const activeDraftDetails = useMemo(() => {
        return draftResults.find(d => d.id === inspectedDraftId);
    }, [draftResults, inspectedDraftId]);

    const bestPlayer = useMemo(() => {
        if (!playerResults.length) return null;
        return [...playerResults].sort((a, b) => b.evaluation.normalizedValue - a.evaluation.normalizedValue)[0];
    }, [playerResults]);

    const playerColumns = [
        {
            header: "Player",
            sortField: "name",
            renderCell: (player: PlayerEvaluation) => <span className="font-semibold">{player.name}</span>,
        },
        {
            header: "Team",
            sortField: "team",
            renderCell: (player: PlayerEvaluation) => player.team,
        },
        {
            header: "Pos",
            sortField: "positions",
            renderCell: (player: PlayerEvaluation) => player.positions.join(", "),
        },
        {
            header: "Value",
            sortField: "evaluation.auctionPrice",
            renderCell: (player: PlayerEvaluation) => `$${player.evaluation.auctionPrice.toFixed(2)}`,
        },
        {
            header: "Eval",
            sortField: "evaluation.normalizedValue",
            renderCell: (player: PlayerEvaluation) => player.evaluation.normalizedValue,
        }
    ];

    return (
        <div className="space-y-5 text-slate-900">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight">Evaluation Center</h1>
                <p className="mt-1 text-sm text-slate-600">Evaluate players and drafts on demand.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                {/* Left Panel: Keeping your integral PlayerEvaluationPanel exactly the same */}
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
                            Best result: <span className="font-semibold">{bestPlayer.name}</span> | Score {bestPlayer.evaluation.normalizedValue}
                        </div>
                    )}
                </div>

                {/* Right Panel: Draft Evaluation with "Click to View" functionality */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <h2 className="text-xl font-bold">Draft Evaluation</h2>
                    
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                        <div className="text-xs font-semibold uppercase text-slate-600">Saved drafts</div>
                        {savedDraftsLoading ? (
                            <p className="mt-2 text-xs">Loading...</p>
                        ) : (
                            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                                {savedDrafts.map((draft) => (
                                    <label key={draft.id} className="flex cursor-pointer items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 hover:border-slate-400">
                                        <div className="text-sm font-semibold">{draft.teamName}</div>
                                        <input
                                            type="checkbox"
                                            checked={selectedDraftIds.includes(draft.id)}
                                            onChange={() => toggleDraftSelection(draft.id)}
                                        />
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={runDraftEvaluation}
                        className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                        disabled={draftLoading || selectedDraftIds.length === 0}
                    >
                        {draftLoading ? "Evaluating..." : "Evaluate Selected Drafts"}
                    </button>

                    {/* Results List */}
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th className="px-3 py-2 text-left font-bold">Team ID</th>
                                    <th className="px-3 py-2 text-right font-bold">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftResults.map((draft) => (
                                    <tr 
                                        key={draft.id} 
                                        onClick={() => setInspectedDraftId(draft.id)}
                                        className={`border-t cursor-pointer transition-colors ${inspectedDraftId === draft.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'}`}
                                    >
                                        <td className="px-3 py-2 font-medium">{draft.id}</td>
                                        <td className="px-3 py-2 text-right font-bold">${draft.totals.value.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Inspection Area: Shows the actual team when a row is clicked */}
                    {activeDraftDetails && (
                        <div className="mt-4 p-4 rounded-lg border-2 border-blue-100 bg-blue-50/30">
                            <h3 className="text-sm font-bold uppercase text-blue-800 mb-3">Roster Breakdown: {activeDraftDetails.id}</h3>
                            <div className="grid grid-cols-1 gap-1">
                                {activeDraftDetails.slots.map((slot, index) => (
                                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-blue-100 text-xs">
                                        <span className="w-12 font-bold text-slate-400">{slot.position}</span>
                                        <span className="flex-1 font-medium">{slot.player?.name || <span className="text-slate-300 italic">Empty</span>}</span>
                                        <span className="font-mono text-blue-700 font-bold">
                                            {slot.player ? `$${slot.player.evaluation.auctionPrice.toFixed(1)}` : '--'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}