"use client"
import Link from "next/link";
import { PlayerData } from "@/_lib/types";

export default function PlayerTable({ players }  : {players : PlayerData[] } ) {
    // Extract all unique stat names from all players' projection hitter data
    const statColumns = Array.from(
        new Set(
            players.flatMap(player => 
                Object.keys(player.stats?.projection?.hitter || {})
            )
        )
    ).sort();

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
      <table className="w-full table-fixed text-xl text-left">
        
        {/* header */}
        <thead className="bg-gray-500 text-black uppercase">
          <tr>
            <th className="px-4 py-3 text-center">Name</th>
            <th className="px-4 py-3 text-center">Team</th>
            {statColumns.map((statName) => (
              <th key={statName} className="px-4 py-3 text-center">{statName}</th>
            ))}
          </tr>
        </thead>

        {/* body */}
        <tbody className="divide-y divide-zinc-800">
          {players.map((player) => (
            <tr
              key={player.id}
              className="hover:bg-blue-800 transition cursor-pointer"
            >
              <td className="px-4 py-3 font-large text-white">
                <Link href={`/player/${player.id}`}>
                    {player.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-white text-center">
                {player.team}
              </td>
              <td className="px-4 py-3 text-white text-center">
                {player.positions.join(", ")}
              </td>

              {statColumns.map((statName) => (
                <td key={`${player.id}-${statName}`} className="px-4 py-3 text-white text-center">
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
