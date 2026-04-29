import { Router, Request, Response } from 'express';
import {
	PlayerEvaluation,
	DraftEvaluation,
	Position,
	DraftData,
	PlayerID,
	LeagueData,
	LeagueState,
	LeagueSettings
} from '../types';
import { getPlayerEvaluations } from '../utils/api';
import {
	parseCsvQuery,
	parseOptionalNumberQuery,
	parseStringQuery
} from '../utils/parsers';
import { testDraftDataSet } from '../data/test-data';
import { convertLeagueDataToLeagueSettings, convertLeagueDataToLeagueState, positionToFilterPosition } from '../utils/api-type-converter';
import { defaultLeagueSettings, defaultLeagueState } from '../consts';

const router = Router();

router.post('/players', async (req: Request, res: Response) => {
	try {
		const leagueData: LeagueData | undefined = req.body.leagueData;
		const playerStringIdSet = new Set(parseCsvQuery(req.query.playerIds));
		const playerIdSet = new Set(Array.from(playerStringIdSet).map(id => Number(id)));
		const positionSet = new Set(parseCsvQuery(req.query.positions));
		const alreadyTakenStringIdSet = new Set(parseCsvQuery(req.query.alreadyTakenIds));
		const alreadyTakenIdSet = new Set(Array.from(alreadyTakenStringIdSet).map(id => Number(id)));

		const minPrice = parseOptionalNumberQuery(req.query.minPrice);
		const maxPrice = parseOptionalNumberQuery(req.query.maxPrice);
		const nameFilter = parseStringQuery(req.query.name, '');

		let leagueSettings: LeagueSettings | undefined = undefined;
		let leagueState: LeagueState | undefined = undefined;
		if (leagueData) {
			leagueSettings = convertLeagueDataToLeagueSettings(leagueData);
			leagueState = convertLeagueDataToLeagueState(leagueData);
		}

		const evaluatedPlayers = await getPlayerEvaluations({
			leagueSettings: leagueSettings ?? defaultLeagueSettings,
			leagueState: leagueState ?? defaultLeagueState
		});

		evaluatedPlayers.sort((a, b) => b.evaluation.normalizedValue - a.evaluation.normalizedValue);
		const filteredEvaluatedPlayers = evaluatedPlayers.filter((player) => {
			if (playerIdSet.size && !playerIdSet.has(player.id)) {
				return false;
			}
			if (alreadyTakenIdSet.has(player.id)) {
				return false;
			}
			if (positionSet.size) {
				const hasRequestedPosition = player.positions.some((position) => positionSet.has(positionToFilterPosition(position)));
				if (!hasRequestedPosition) {
					return false;
				}
			}
			if (minPrice !== undefined && player.evaluation.auctionPrice < minPrice) {
				return false;
			}
			if (maxPrice !== undefined && player.evaluation.auctionPrice > maxPrice) {
				return false;
			}
			if (nameFilter && !player.name.toLowerCase().includes(nameFilter.toLowerCase())) {
				return false;
			}
			return true;
		});

		return res.json({
			players: filteredEvaluatedPlayers
		});
	} catch (error) {
		console.error('Evaluation players API error:', error);
		return res.status(502).json({ error: 'Failed to fetch player evaluations' });
	}
});

router.get('/drafts', async (req: Request, res: Response) => {
	try {
		const requestedDraftIds = parseCsvQuery(req.query.draftIds);
		const selectedDrafts = requestedDraftIds.length
			? testDraftDataSet.filter((draft) => requestedDraftIds.includes(draft.id))
			: testDraftDataSet;

		const playerIds: PlayerID[] = Array.from(
			new Set(
				selectedDrafts.flatMap((draft) =>
					Object.values(draft.roster).filter(
						(id): id is PlayerID => Boolean(id)
					)
				)
			)
		);

		let evaluationsByPlayerId: Record<PlayerID, PlayerEvaluation> = {};

		if (playerIds.length) {
			const players = await getPlayerEvaluations({});

			const filteredPlayers = players.filter((p) =>
				playerIds.includes(p.id)
			);

			evaluationsByPlayerId = Object.fromEntries(
				filteredPlayers.map((player) => [player.id, player])
			);
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
				const player = playerId
					? evaluationsByPlayerId[playerId] ?? null
					: null;

				return { position, player };
			});

			const totals = slots.reduce(
				(acc, slot) => {
					if (!slot.player) return acc;

					return {
						value: acc.value + slot.player.evaluation.auctionPrice,
						score: acc.score + slot.player.evaluation.normalizedValue
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
			drafts: evaluatedDrafts
		});
	} catch (error) {
		console.error('Evaluation drafts API error:', error);
		return res.status(502).json({ error: 'Failed to fetch draft evaluations' });
	}
});

export default router;
