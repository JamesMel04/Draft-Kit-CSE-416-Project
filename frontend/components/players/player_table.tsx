"use client";

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { HITTER_STAT_KEYS, HitterPlayer, HitterStats, PITCHER_STAT_KEYS, PitcherPlayer, PitcherStats, PlayerPools, SortAsc, SortField, SortParamHitter, SortParamPitcher } from '@/_lib/types';
import { sortPlayers } from '@/utils/sorters';


const headerCellClass = "text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
const bodyCellClass = "text-white text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
const firstHeaderCellClass = "text-left whitespace-nowrap border-r border-zinc-700";
const firstBodyCellClass = "text-white text-left whitespace-nowrap border-r border-zinc-700 font-semibold";
const firstCellStyle = { paddingInline: "0.5rem" };
export default function PlayerTable({ players }  : {players : PlayerPools | null } ) {
  
  /**
   * Search params needed to make sure that sorting is consistent with current state
   */
  const [tab, setTab] = useState<"hitters" | "pitchers">("hitters");

  const tabBar = (
    <div className="flex border-b border-zinc-700">
      {([{key: "hitters", label: "Hitters"}, {key: "pitchers", label: "Pitchers"}] as const).map((keyLabel) => (
        <button
          key={keyLabel.key}
          onClick={() => setTab(keyLabel.key)}
          className={`px-5 py-2 text-sm font-semibold capitalize transition-colors
            ${tab === keyLabel.key
              ? "border-b-2 border-blue-400 text-blue-400"
              : "text-zinc-400 hover:text-white"
            }`}
        >
          {keyLabel.label}
        </button>
      ))}
    </div>
  );

  if (tab === "hitters") {
    return (
      <div className="flex flex-col gap-3">
        {tabBar}
        <HittersTable players={players?.hitters ?? []}/>
      </div>
    );
  } else {
    return (
      <div className="flex flex-col gap-3">
        {tabBar}
        <PitchersTable players={players?.pitchers ?? []}/>
      </div>
    );
  }
}

function SortIcon({ curSort, columnKey, asc }: { curSort: SortParamHitter | SortParamPitcher, columnKey: string, asc: boolean }) {
  if (curSort !== columnKey) return <ArrowDownIcon className="w-4 h-4 text-gray-400" />
  return asc ? <ArrowUpIcon className="w-4 h-4 text-blue-400 font-extrabold"/> : <ArrowDownIcon className="w-4 h-4 text-blue-400 font-extrabold"/>
}

/** Pitcher dispaly */
function PitchersTable({ players } : {players : PitcherPlayer[]}) {
  // For URLs
  const router = useRouter();
  const pathname = usePathname();

  // Sorting state
  const [sort, setSort] = useState<{sortParam:SortParamPitcher, asc: SortAsc}>({sortParam: "gp", asc: true});
  function sortPlayers(a : PitcherPlayer,b : PitcherPlayer) {
    let value : number;
    if(sort.sortParam == "name") {
      value = a.name > b.name ? 1 : -1;
    }
    else if(sort.sortParam == "team") {
      value = a.team > b.team ? 1 : -1;
    }
    else if(sort.sortParam == "positions") {
      value = a.position > b.position ? 1 : -1;
    }
    else {
      // a = 1, b = 2. a - b = -1, so a comes before b, which is what we want when ascending.
      // Otherwise, we negate the value
      value = a.stats?.projection?.pitching[sort.sortParam] - b.stats?.projection?.pitching[sort.sortParam];
    }
    return sort.asc ? value : -value;
  }
  players.sort(sortPlayers)
  
  const statColumns = (PITCHER_STAT_KEYS).toSorted();

  // Function to change sort state
  function handleSort(newSort : string) {
    let newAsc = sort.asc;
    if (newSort as SortParamPitcher == sort.sortParam) newAsc = newAsc ? false : true;

    setSort({sortParam: newSort as SortParamPitcher, asc: newAsc});
  }

  return(
     <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full table-auto text-base text-left border-collapse">
        
        {/* header */}
        <thead className="bg-gray-500 text-black uppercase cursor-pointer">
          <tr>
            <th key="name" className={firstHeaderCellClass} style={firstCellStyle} onClick={() => handleSort("name")}>Name<SortIcon curSort={sort.sortParam} columnKey="name" asc={sort.asc}/></th>
            <th key="team" className={headerCellClass} onClick={() => handleSort("team")}>Team<SortIcon curSort={sort.sortParam} columnKey="team" asc={sort.asc}/></th>
            <th key="positions" className={headerCellClass} onClick={() => handleSort("positions")}>Position <SortIcon curSort={sort.sortParam} columnKey="positions" asc={sort.asc}/></th>
            {statColumns.map((statName) => (
              <th key={statName} className={headerCellClass} onClick={() => handleSort(statName)}>{statName}<SortIcon curSort={sort.sortParam} columnKey={statName} asc={sort.asc}/></th>
            ))}
          </tr>
        </thead>

        {/* body */}
        <tbody className="divide-y divide-zinc-800">
          {players.map((player) => (
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
                {player.position}
              </td>

              {statColumns.map((statName) => (
                <td key={`${player.id}-${statName}`} className={bodyCellClass}>
                  {player.stats?.projection?.pitching[statName as keyof(PitcherStats)] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}

// Generated by AI based on PitchersTable
function HittersTable({ players }: { players: HitterPlayer[] }) {
  const router = useRouter();

  const [sort, setSort] = useState<{ sortParam: SortParamHitter, asc: SortAsc }>({ sortParam: "ab", asc: true });

  function sortHitters(a: HitterPlayer, b: HitterPlayer) {
    let value: number;
    if (sort.sortParam == "name") {
      value = a.name > b.name ? 1 : -1;
    } else if (sort.sortParam == "team") {
      value = a.team > b.team ? 1 : -1;
    } else if (sort.sortParam == "positions") {
      value = a.position > b.position ? 1 : -1;
    } else {
      value = a.stats?.projection?.hitting[sort.sortParam] - b.stats?.projection?.hitting[sort.sortParam];
    }
    return sort.asc ? value : -value;
  }
  players.sort(sortHitters);

  const statColumns = (HITTER_STAT_KEYS).toSorted();

  function handleSort(newSort: string) {
    let newAsc = sort.asc;
    if (newSort as SortParamHitter == sort.sortParam) newAsc = !newAsc;
    setSort({ sortParam: newSort as SortParamHitter, asc: newAsc });
  }

  return (
    <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full table-auto text-base text-left border-collapse">
        <thead className="bg-gray-500 text-black uppercase cursor-pointer">
          <tr>
            <th key="name" className={firstHeaderCellClass} style={firstCellStyle} onClick={() => handleSort("name")}>Name<SortIcon curSort={sort.sortParam} columnKey="name" asc={sort.asc}/></th>
            <th key="team" className={headerCellClass} onClick={() => handleSort("team")}>Team<SortIcon curSort={sort.sortParam} columnKey="team" asc={sort.asc}/></th>
            <th key="positions" className={headerCellClass} onClick={() => handleSort("positions")}>Position<SortIcon curSort={sort.sortParam} columnKey="positions" asc={sort.asc}/></th>
            {statColumns.map((statName) => (
              <th key={statName} className={headerCellClass} onClick={() => handleSort(statName)}>{statName}<SortIcon curSort={sort.sortParam} columnKey={statName} asc={sort.asc}/></th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {players.map((player) => (
            <tr
              key={player.id}
              className="hover:bg-blue-800 cursor-pointer"
              onClick={() => router.push(`/players/${player.id}`)}
            >
              <td className={firstBodyCellClass} style={firstCellStyle}>{player.name}</td>
              <td className={bodyCellClass}>{player.team}</td>
              <td className={bodyCellClass}>{player.position}</td>
              {statColumns.map((statName) => (
                <td key={`${player.id}-${statName}`} className={bodyCellClass}>
                  {player.stats?.projection?.hitting[statName as keyof HitterStats] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}