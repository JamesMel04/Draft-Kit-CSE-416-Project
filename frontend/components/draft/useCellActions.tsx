import { useCallback, useState } from 'react';
import { Position, TeamName } from '@/_lib/types';

export type CellRef = { team: TeamName; pos: Position };
export type PendingAction = { type: "move" | "swap"; source: CellRef } | null;

export function useCellActions(
  onMove: (team: TeamName, source: Position, target: Position) => void,
  onSwap: (team: TeamName, posA: Position, posB: Position) => void,
) {
  const [menuCell, setMenuCell] = useState<CellRef | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const clearActionState = useCallback(() => {
    setMenuCell(null);
    setPendingAction(null);
  }, []);

  const toggleMenuCell = useCallback((team: TeamName, pos: Position) => {
    setPendingAction(null);
    setMenuCell((prev) =>
      prev?.team === team && prev?.pos === pos ? null : { team, pos }
    );
  }, []);

  const startAction = useCallback((type: "move" | "swap", source: CellRef) => {
    setPendingAction({ type, source });
    setMenuCell(null);
  }, []);

  const applyPendingAction = useCallback((target: CellRef) => {
    setPendingAction((pending) => {
      if (!pending) return null;
      const { source, type } = pending;
      if (source.team !== target.team || source.pos === target.pos) return pending;

      if (type === "move") {
        onMove(source.team, source.pos, target.pos);
      } else {
        onSwap(source.team, source.pos, target.pos);
      }

      setMenuCell(null);
      return null;
    });
  }, [onMove, onSwap]);

  const isTargetForPending = useCallback((team: TeamName, pos: Position): boolean => {
    if (!pendingAction) return false;
    return pendingAction.source.team === team && pendingAction.source.pos !== pos;
  }, [pendingAction]);

  const activeCell = menuCell ?? pendingAction?.source ?? null;

  return {
    menuCell,
    pendingAction,
    activeCell,
    clearActionState,
    toggleMenuCell,
    startAction,
    applyPendingAction,
    isTargetForPending,
  };
}
