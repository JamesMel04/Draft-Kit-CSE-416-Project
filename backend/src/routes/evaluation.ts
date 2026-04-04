import { Router, Request, Response } from 'express';
import axios from 'axios';
import { PlayerEvaluation, EvaluationMeta, DraftEvaluation, Position, DraftData, PlayerID } from '@/types';
import {
	parseBoolean,
	parseCsvQuery,
	parseOptionalNumberQuery,
	parsePositiveInt,
	parseStringQuery
} from '@/utils/parsers';
import { buildPagination } from '@/utils/pagination';
import { testDraftDataSet } from '../data/test-data';

const router = Router();
const API_URL = process.env.API_URL || 'https://api-cse-416-project.onrender.com';

const api = axios.create({
	baseURL: API_URL,
	timeout: 5000,
	headers: { 'Content-Type': 'application/json' }
});

function getEvaluationMeta(notes: string): EvaluationMeta {
	return {
		source: 'backend',
		provider: 'external-evaluator',
		generatedAt: new Date().toISOString(),
		notes
	};
}

router.get('/players', async (req: Request, res: Response) => {
	const requestedSort = parseStringQuery(req.query.sort, 'suggestedValue');
	const asc = parseBoolean(req.query.asc, false);
	const page = parsePositiveInt(req.query.page, 1);
	const limit = Math.min(parsePositiveInt(req.query.limit, 25), 100);

	try {
		const apiQuery = new URLSearchParams();
		if (req.query.playerIds !== undefined) apiQuery.append('playerIds', parseCsvQuery(req.query.playerIds).join(','));
		if (req.query.positions !== undefined) apiQuery.append('positions', parseCsvQuery(req.query.positions).join(','));
		if (req.query.alreadyTakenIds !== undefined) apiQuery.append('alreadyTakenIds', parseCsvQuery(req.query.alreadyTakenIds).join(','));
		if (req.query.minPrice !== undefined) {
			const minPrice = parseOptionalNumberQuery(req.query.minPrice);
			if (minPrice !== undefined) apiQuery.append('minPrice', String(minPrice));
		}
		if (req.query.maxPrice !== undefined) {
			const maxPrice = parseOptionalNumberQuery(req.query.maxPrice);
			if (maxPrice !== undefined) apiQuery.append('maxPrice', String(maxPrice));
		}
		const name = parseStringQuery(req.query.name, '');
		if (name) apiQuery.append('name', name);
		if (req.query.sort !== undefined) apiQuery.append('sort', requestedSort);
		if (req.query.asc !== undefined) apiQuery.append('asc', String(asc));

		const apiUrl = apiQuery.toString() ? `/evaluation/players?${apiQuery.toString()}`: '/evaluation/players';

		const { data } = await api.get<PlayerEvaluation[]>(apiUrl);
		const evaluatedPlayers = data ?? [];

		const pagination = buildPagination(evaluatedPlayers.length, page, limit);
		const start = (pagination.page - 1) * pagination.limit;
		const paginatedPlayers = evaluatedPlayers.slice(start, start + pagination.limit);

		return res.json({
			players: paginatedPlayers,
			pagination,
			sorting: { sort: requestedSort, asc },
			meta: getEvaluationMeta('Player evaluations sourced from API.')
		});
	} catch (error) {
		console.error('Evaluation players API error:', error);
		return res.status(502).json({ error: 'Failed to fetch player evaluations from API' });
	}
});

router.get('/drafts', async (req: Request, res: Response) => {
	const requestedDraftIds = req.query.draftIds !== undefined ? parseCsvQuery(req.query.draftIds) : [];
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
			const query = new URLSearchParams();
			query.append('playerIds', playerIds.join(','));
			const { data } = await api.get<PlayerEvaluation[]>(`/evaluation/players?${query.toString()}`);
			evaluationsByPlayerId = Object.fromEntries((data ?? []).map((player) => [player.id, player]));
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
				draftId: draft.id,
				slots,
				totals
			};
		});

		return res.json({
			drafts: evaluatedDrafts,
			meta: getEvaluationMeta('Draft evaluations computed from draft rosters and API player evaluations.')
		});
	} catch (error) {
		console.error('Evaluation drafts API error:', error);
		return res.status(502).json({ error: 'Failed to fetch draft evaluations from API' });
	}
});

export default router;
