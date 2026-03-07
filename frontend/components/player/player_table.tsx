"use client"
import Link from "next/link";
import { PlayerData } from "@/_lib/types";

export default function PlayerTable({ players }  : {players : PlayerData[] } ) {
    return(
     <div className="bg-gray-600 rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-xl text-left">
        
        {/* header */}
        <thead className="bg-gray-500 text-black uppercase">
          <tr>
            <th className="px-4 py-3 text-center">Name</th>
            <th className="px-4 py-3 text-center">Team</th>
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
                <Link href={`player/${player.id}`}>
                    {player.name}
                </Link>
              </td>

              <td className="px-4 py-3 text-white">
                {player.team}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
    );
}