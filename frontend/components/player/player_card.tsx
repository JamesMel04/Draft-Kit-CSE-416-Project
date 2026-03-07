/* General Purpose player card, in case it's used anywhere else */
"use client"
import { PlayerData } from "@/_lib/types"

export default function PlayerCard({player} : {player : PlayerData} ) {

    return(
     <div className="flex gap-6 max-w-7xl mx-auto p-6">

      <PlayerSidebar player={player} />

      <div className="flex-1 space-y-6">
        <PlayerOverview player={player} />
        <PlayerStats player={player} />
        {/* <PlayerCompare player={player} /> */} {/* Still have to implement */}
      </div>

    </div>

    );
}

function PlayerSidebar({player} : {player : PlayerData}) {
    return (
    <div className="w-64 space-y-4">

      <div className="bg-blue-900 rounded-lg p-4 text-center text-white">
        <div className="flex items-center justify-center h-50 bg-blue-950 rounded mb-3 text-lg font-bold text-white">Photo</div>
        <h2 className="text-lg font-bold">{player.name}</h2>
        <p className="text-lg font-bold">{player.team}</p>
      </div>

      <div className="bg-emerald-500 rounded-lg p-4">
        <textarea
          placeholder="Write notes here..."
        className="text-lg font-bold"/>
      </div>

    </div>
  )
}

function PlayerOverview({player} : {player : PlayerData}) {
    return(
        <div className="bg-blue-950 text-white w-100">
            Placeholder summary:
            {player.name} played for {player.team} team
        </div>
    )
}

function PlayerStats({player} : {player : PlayerData}) {
    return(
       <div className="bg-emerald-600 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-xl text-left">
                 <thead className="bg-emerald-500 text-black uppercase">
                    <tr>
                        <th className="px-4 py-3 text-center">Statistics</th>
                        <th className="px-4 py-3 text-center">Measured</th>
                    </tr>
                </thead>
                <tbody className="bg-emerald-200 text-black uppercase">
                    {Object.entries(player.stats).map(([stat, number]) => (
                        <tr key={stat}>
                            <td className="px-4 py-3">{stat}</td>
                            <td className="px-4 py-3">{number}</td>
                        </tr>
                    ))}
                </tbody>
          </table>    
        </div>
    );
}