/* General Purpose player card, in case it's used anywhere else */
"use client"
import { PlayerData } from "@/_lib/types"

export default function PlayerCard({player} : {player : PlayerData} ) {
    return(
        <div className="w-full flex items-start" style={{ gap: "0.67rem", padding: "0.67rem" }}>
            <PlayerSidebar player={player} />
            <div className="flex-1 min-w-0 flex flex-col" style={{ rowGap: "0.67rem" }}>
                <PlayerOverview player={player} />
                <PlayerStatsTable player={player} />
                {/* <PlayerCompare player={player} /> */} {/* Still have to implement */}
            </div>
        </div>
    );
}

function PlayerSidebar({player} : {player : PlayerData}) {
    return (
        <div className="w-48 flex flex-col" style={{ rowGap: "0.67rem" }}>
            <div className="bg-blue-900 rounded-lg text-center text-white" style={{ padding: "0.67rem" }}>
                <div className="flex items-center justify-center h-40 bg-blue-950 rounded text-sm font-bold text-white" style={{ marginBottom: "0.67rem" }}>Photo</div>
                <h2 className="text-sm font-bold">{player.name}</h2>
                <p className="text-sm font-bold">{player.team}</p>
        <p className="text-sm font-bold">{player.positions.join(", ")}</p>
            </div>

            <div className="bg-emerald-500 rounded-lg" style={{ padding: "0.67rem" }}>
                <textarea
                    placeholder="Write notes here..."
                    className="w-full rounded-md bg-emerald-300 text-slate-900 text-sm font-semibold leading-relaxed placeholder:text-emerald-900/70 border border-emerald-600"
                    style={{ minHeight: "10rem", padding: "0.67rem" }}
                />
            </div>
        </div>
    )
}

function PlayerOverview({player} : {player : PlayerData}) {
    return(
        <div
            className="w-full rounded-lg bg-blue-950 text-white"
            style={{ minHeight: "6.67rem", padding: "0.67rem" }}
        >
            <p className="text-sm font-semibold">Placeholder summary:</p>
            <p className="mt-2 text-sm text-blue-100">{player.name} played for {player.team} team</p>
        </div>
    )
}

function PlayerStatsTable({player} : {player : PlayerData}) {
    const headerCellStyle = { padding: "0.67rem" };
    const bodyCellStyle = { padding: "0.33rem 0.67rem" };

    const formatSeasons = (seasons: number[]) => {
        if (!seasons || !seasons.length) {
            return "N/A";
        }

        return seasons.join(", ");
    };

    // Get all stat names from the hitter objects
    const getAllStatNames = () => {
        const statNames = new Set<string>();
        if (player.stats.projection.hitter) {
            Object.keys(player.stats.projection.hitter).forEach(stat => statNames.add(stat));
        }
        if (player.stats.lastYear.hitter) {
            Object.keys(player.stats.lastYear.hitter).forEach(stat => statNames.add(stat));
        }
        if (player.stats.threeYearAvg.hitter) {
            Object.keys(player.stats.threeYearAvg.hitter).forEach(stat => statNames.add(stat));
        }
        return Array.from(statNames);
    };

    const statNames = getAllStatNames();

    return(
        <div className="w-full bg-emerald-600 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full table-fixed text-base text-left">
                <colgroup>
                    <col style={{ width: "14.2857%" }} />
                    <col style={{ width: "28.5714%" }} />
                    <col style={{ width: "28.5714%" }} />
                    <col style={{ width: "28.5714%" }} />
                </colgroup>
                <thead className="bg-emerald-500 text-black uppercase">
                    <tr>
                        <th className="text-center" style={headerCellStyle}>Statistic</th>
                        <th className="text-center" style={headerCellStyle}>Projection ({formatSeasons(player.stats.projection.seasons)})</th>
                        <th className="text-center" style={headerCellStyle}>Last Year ({formatSeasons(player.stats.lastYear.seasons)})</th>
                        <th className="text-center" style={headerCellStyle}>Three Year Avg ({formatSeasons(player.stats.threeYearAvg.seasons)})</th>
                    </tr>
                </thead>
                <tbody className="bg-emerald-200 text-black uppercase">
                    {statNames.length > 0 ? (
                        statNames.map((stat) => (
                            <tr key={stat} className="border-b border-emerald-400 last:border-b-0">
                                <td className="font-extrabold bg-emerald-300" style={bodyCellStyle}>{stat}</td>
                                <td className="text-center" style={bodyCellStyle}>
                                    {player.stats.projection.hitter?.[stat] !== undefined ? player.stats.projection.hitter[stat] : "N/A"}
                                </td>
                                <td className="text-center" style={bodyCellStyle}>
                                    {player.stats.lastYear.hitter?.[stat] !== undefined ? player.stats.lastYear.hitter[stat] : "N/A"}
                                </td>
                                <td className="text-center" style={bodyCellStyle}>
                                    {player.stats.threeYearAvg.hitter?.[stat] !== undefined ? player.stats.threeYearAvg.hitter[stat] : "N/A"}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td className="text-center normal-case" style={bodyCellStyle} colSpan={4}>No stats available</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}