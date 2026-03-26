"use client"
import { PlayerData } from "@/_lib/types";
import { useRouter } from "next/navigation"

export default function PlayerTable({ players }  : {players : PlayerData[] | null } ) {
  const router = useRouter();

  const headerCellClass = "text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
  const bodyCellClass = "text-white text-center whitespace-nowrap border-r border-zinc-700 last:border-r-0";
  const firstHeaderCellClass = "text-left whitespace-nowrap border-r border-zinc-700";
  const firstBodyCellClass = "text-white text-left whitespace-nowrap border-r border-zinc-700 font-semibold";
  const firstCellStyle = { paddingInline: "0.5rem" };

    // Handle null or undefined players
    if (!players || players.length === 0) {
        return (
        <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden p-4">
                <p className="text-white text-center">No players available</p>
            </div>
        );
    }
    
    // Extract all unique stat names from all players' projection hitter data
    const statColumns = Array.from(
        new Set(
            players.flatMap(player => 
                Object.keys(player.stats?.projection?.hitter || {})
            )
        )
    ).sort();

    return(
     <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full table-auto text-base text-left border-collapse">
        
        {/* header */}
        <thead className="bg-gray-500 text-black uppercase">
          <tr>
            <th className={firstHeaderCellClass} style={firstCellStyle}>Name</th>
            <th className={headerCellClass}>Team</th>
            <th className={headerCellClass}>Position</th>
            {statColumns.map((statName) => (
              <th key={statName} className={headerCellClass}>{statName}</th>
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
