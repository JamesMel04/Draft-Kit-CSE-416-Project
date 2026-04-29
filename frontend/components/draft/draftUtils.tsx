import { Position } from '@/_lib/types';
import { allPositions } from '@/_lib/consts';
import { PlayerEvaluation } from '@/_lib/types';

export function normalizePlayerPosition(pos: string): string {
  const upper = pos.toUpperCase();
  if (["LF", "CF", "RF"].includes(upper)) return "OF";
  return upper;
}

export function isPitcherPosition(pos: string): boolean {
  return ["SP", "RP", "P"].includes(normalizePlayerPosition(pos));
}

export function canPlayerFitSlot(playerPositions: string[], slot: Position): boolean {
  const normalized = playerPositions.map(normalizePlayerPosition);
  const hasPitcherPosition = normalized.some(isPitcherPosition);
  if (slot.startsWith("P")) return hasPitcherPosition;
  if (slot.startsWith("OF")) return normalized.includes("OF");
  if (slot === "CI") return normalized.includes("1B") || normalized.includes("3B");
  if (slot === "MI") return normalized.includes("2B") || normalized.includes("SS");
  if (slot === "UTIL") return !hasPitcherPosition;
  return normalized.includes(slot);
}

export function getOpenCompatibleSlots(
  roster: Partial<Record<Position, string>>,
  player: PlayerEvaluation
): Position[] {
  return allPositions.filter(
    (pos) => !roster[pos] && canPlayerFitSlot(player.positions, pos)
  );
}
