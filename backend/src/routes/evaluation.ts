import { Router, Request, Response } from 'express';
import { PlayerEvaluation, EvaluationMeta, DraftEvaluation, Position, DraftData, PlayerID } from '@/types';
import { getPlayerEvaluations, getPlayers } from '@/utils/api';
import {
	parseCsvQuery,
	parseOptionalNumberQuery,
	parseStringQuery
} from '@/utils/parsers';
import { testDraftDataSet } from '@/data/test-data';

const router = Router();

function getEvaluationMeta(provider: string, notes: string): EvaluationMeta {
	return {
		source: 'backend',
		provider,
		generatedAt: new Date().toISOString(),
		notes
	};
}

router.get('/players', async (req: Request, res: Response) => {
	const playerIdSet = new Set(parseCsvQuery(req.query.playerIds));
	const positionSet = new Set(parseCsvQuery(req.query.positions));
	const alreadyTakenIdSet = new Set(parseCsvQuery(req.query.alreadyTakenIds));

	const minPrice = parseOptionalNumberQuery(req.query.minPrice);
	const maxPrice = parseOptionalNumberQuery(req.query.maxPrice);
	const nameFilter = parseStringQuery(req.query.name, '');

	try {
		const evaluatedPlayers = await getPlayerEvaluations({
			playerIds: playerIdSet.size ? [...playerIdSet].join(',') : undefined,
			positions: positionSet.size ? [...positionSet].join(',')  : undefined,
			alreadyTakenIds: alreadyTakenIdSet.size ? [...alreadyTakenIdSet].join(',') : undefined,
			minPrice,
			maxPrice,
			name: nameFilter || undefined,
		});

		return res.json({
			players: evaluatedPlayers,
			meta: getEvaluationMeta('external-evaluator', 'Player evaluations sourced from API.')
		});
	} catch (error) {
		try {
			const fallbackPlayers = await getPlayers();
			const fallbackEvaluations: PlayerEvaluation[] = fallbackPlayers.map((player) => {
				return {
					id: player.id,
					name: player.name,
					team: player.team,
					positions: player.positions,
					suggestedValue: player.suggestedValue,
					evaluation: {
						score: 0,
						tier: 'N/A',
						confidence: 0,
						summary: 'Fallback evaluation - no evaluation data available'
					}
				};
			}).filter((player) => {
				if (playerIdSet.size && !playerIdSet.has(player.id)) {
					return false;
				}

				if (alreadyTakenIdSet.has(player.id)) {
					return false;
				}

				if (positionSet.size) {
					const hasRequestedPosition = player.positions.some((position) => positionSet.has(position));
					if (!hasRequestedPosition) {
						return false;
					}
				}

				if (minPrice !== undefined && player.suggestedValue < minPrice) {
					return false;
				}

				if (maxPrice !== undefined && player.suggestedValue > maxPrice) {
					return false;
				}

				if (nameFilter && !player.name.toLowerCase().includes(nameFilter.toLowerCase())) {
					return false;
				}

				return true;
			});

			return res.json({
				players: fallbackEvaluations,
				meta: getEvaluationMeta('backend-fallback', 'Fallback player evaluations because API evaluation is currently unavailable.')
			});
		} catch (fallbackError) {
			console.error('Evaluation players API fallback error:', fallbackError);
			return res.status(502).json({ error: 'Failed to fetch player evaluations' });
		}
	}
});

router.get('/drafts', async (req: Request, res: Response) => {
	const requestedDraftIds = parseCsvQuery(req.query.draftIds);
	// Eventually to be replaced by Database Access
	const selectedDrafts = requestedDraftIds.length
		? testDraftDataSet.filter((draft) => requestedDraftIds.includes(draft.id))
		: testDraftDataSet;

	try {
		const playerIds = Array.from(new Set(
			selectedDrafts.flatMap((draft) =>
				Object.values(draft.roster).filter((playerId) => Boolean(playerId))
			)
		));

		let evaluationsByPlayerId: Record<PlayerID, PlayerEvaluation> = {};
		if (playerIds.length) {
			const players = await getPlayerEvaluations({ playerIds: playerIds.join(',') });
			evaluationsByPlayerId = Object.fromEntries(players.map((player) => [player.id, player]));
		}

		const slotsOrder: Position[] = [
			'C', '1B', '2B', '3B', 'SS', 'CI', 'MI',
			'OF1', 'OF2', 'OF3', 'OF4', 'OF5',
			'UTIL',
			'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'
		];

		const evaluatedDrafts: DraftEvaluation[] = selectedDrafts.map((draft: DraftData) => {
			const slots = slotsOrder.map((position) => {
				const playerId = draft.roster[position];
				const player = playerId ? evaluationsByPlayerId[playerId] ?? null : null;
				return { position, player };
			});

			const totals = slots.reduce(
				(acc, slot) => {
					if (!slot.player) return acc;
					return {
						value: acc.value + slot.player.suggestedValue,
						score: acc.score + slot.player.evaluation.score
					};
				},
				{ value: 0, score: 0 }
			);

			return {
				id: draft.id,
				slots,
				totals
			};
		});

		return res.json({
			drafts: evaluatedDrafts,
			meta: getEvaluationMeta('external-evaluator', 'Draft evaluations computed from draft rosters and API player evaluations.')
		});
	} catch (error) {
		console.error('Evaluation drafts API error:', error);
		// Fallback: use getPlayers() and create fallback evaluations
		try {
			const fallbackPlayers = await getPlayers();
			const fallbackEvaluationsByPlayerId: Record<PlayerID, PlayerEvaluation> = Object.fromEntries(
				fallbackPlayers.map((player) => [
					player.id,
					{
						id: player.id,
						name: player.name,
						team: player.team,
						positions: player.positions,
						suggestedValue: player.suggestedValue,
						evaluation: {
							score: 0,
							tier: 'N/A',
							confidence: 0,
							summary: 'Fallback evaluation - no evaluation data available'
						}
					}
				])
			);

			const slotsOrder: Position[] = [
				'C', '1B', '2B', '3B', 'SS', 'CI', 'MI',
				'OF1', 'OF2', 'OF3', 'OF4', 'OF5',
				'UTIL',
				'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'
			];

			const fallbackDrafts: DraftEvaluation[] = selectedDrafts.map((draft: DraftData) => {
				const slots = slotsOrder.map((position) => {
					const playerId = draft.roster[position];
					const player = playerId ? fallbackEvaluationsByPlayerId[playerId] ?? null : null;
					return { position, player };
				});

				const totals = slots.reduce(
					(acc, slot) => {
						if (!slot.player) return acc;
						return {
							value: acc.value + slot.player.suggestedValue,
							score: acc.score + slot.player.evaluation.score
						};
					},
					{ value: 0, score: 0 }
				);

				return {
					id: draft.id,
					slots,
					totals
				};
			});

			return res.json({
				drafts: fallbackDrafts,
				meta: getEvaluationMeta('backend-fallback', 'Fallback draft evaluations because API evaluation is currently unavailable.')
			});
		} catch (fallbackError) {
			console.error('Evaluation drafts API fallback error:', fallbackError);
			return res.status(502).json({ error: 'Failed to fetch draft evaluations' });
		}
	}
});

export default router;
