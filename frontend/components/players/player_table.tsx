"use client";

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { PlayerData, SortAsc, SortField } from '@/_lib/types';
import { sortPlayers } from '@/utils/sorters';

export default function PlayerTable({ players }  : {players : PlayerData[] | null } ) {
  const router = useRouter();
  const pathname = usePathname();
  /**
   * Search params needed to make sure that sorting is consistent with current state
   */
  const searchParams = useSearchParams();
  const sortField: SortField | null = searchParams.get("sort");
  const sortAsc: SortAsc = searchParams.get("asc") === "true";

  const headerCellClass = "text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
  const bodyCellClass = "text-white text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
  const firstHeaderCellClass = "text-left whitespace-nowrap border-r border-zinc-700";
  const firstBodyCellClass = "text-white text-left whitespace-nowrap border-r border-zinc-700 font-semibold";
  const firstCellStyle = { paddingInline: "0.5rem" };

  /**
   * Function to handle sorting
   */
  function handleSort(nextSortField : SortField) {
    const params = new URLSearchParams(searchParams); // Object to pass into request
    
    // Case: If current sort is equal to new requested sort, then NEGATE current ascension boolean
    if (nextSortField === sortField) {
      params.set("asc", params.get("asc") === "true" ? "false" : "true");
    }
    // Case 2: different sort, reset to default descending
    else {
      params.set("sort", nextSortField);
      params.set("asc", "false");
    }

    // Push to new url
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const sortedPlayers = useMemo(() => {
    if (!players) {
      return [];
    }

    return sortPlayers(players, sortField, sortAsc);
  }, [players, sortField, sortAsc]);

    // Handle null or undefined players
    if (!sortedPlayers.length) {
        return (
        <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden p-4">
                <p className="text-white text-center">No players available</p>
            </div>
        );
    }
    
    // Extract all unique stat names from all players' projection hitter data
    const statColumns = Array.from(
        new Set(
        sortedPlayers.flatMap(player => 
                Object.keys(player.stats?.projection?.hitter || {})
            )
        )
    ).sort();

    return(
     <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full table-auto text-base text-left border-collapse">
        
        {/* header */}
        <thead className="bg-gray-500 text-black uppercase cursor-pointer">
          <tr>
            <th key="name" className={firstHeaderCellClass} style={firstCellStyle} onClick={() => handleSort("name")}>Name<SortIcon columnKey="name"/></th>
            <th key="team" className={headerCellClass} onClick={() => handleSort("team")}>Team<SortIcon columnKey="team"/></th>
            <th key="positions" className={headerCellClass} onClick={() => handleSort("positions")}>Position <SortIcon columnKey="positions"/></th>
            {statColumns.map((statName) => (
              <th key={statName} className={headerCellClass} onClick={() => handleSort(statName)}>{statName}<SortIcon columnKey={statName}/></th>
            ))}
          </tr>
        </thead>

        {/* body */}
        <tbody className="divide-y divide-zinc-800">
          {sortedPlayers.map((player) => (
            <tr
              key={player.id}
              className="hover:bg-blue-800 cursor-pointer"
              onClick={() => router.push(`/players/${player.id}`)}
            >
              <td className={firstBodyCellClass} style={firstCellStyle}>
                {player.name}
              </td>
              <td className={bodyCellClass}>
                {player.team}
              </td>
              <td className={bodyCellClass}>
                {player.positions.join(", ")}
              </td>

              {statColumns.map((statName) => (
                <td key={`${player.id}-${statName}`} className={bodyCellClass}>
                  {player.stats?.projection?.hitter?.[statName] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
    );
}

function SortIcon({ columnKey }: { columnKey: SortField }) {
  const searchParams = useSearchParams();
  const sortField: SortField | null = searchParams.get('sort');
  const sortAsc: SortAsc = searchParams.get('asc') === 'true';

  if (sortField !== columnKey) return <ArrowDownIcon className="w-4 h-4 text-gray-400" />
  return sortAsc ? <ArrowUpIcon className="w-4 h-4 text-blue-400 font-extrabold"/> : <ArrowDownIcon className="w-4 h-4 text-blue-400 font-extrabold"/>
}