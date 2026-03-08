/* General Purpose player card, in case it's used anywhere else */
"use client"
import { PlayerData } from "@/_lib/types"

export default function PlayerCard({player} : {player : PlayerData} ) {
    return(
        <div className="w-full flex items-start" style={{ gap: "1rem", padding: "1rem" }}>
            <PlayerSidebar player={player} />
        <div className="w-full flex items-start" style={{ gap: "1rem", padding: "1rem" }}>
            <PlayerSidebar player={player} />

            <div className="flex-1 min-w-0 flex flex-col" style={{ rowGap: "1rem" }}>
                <PlayerOverview player={player} />
                <PlayerStats player={player} />
                {/* <PlayerCompare player={player} /> */} {/* Still have to implement */}
            </div>
        </div>
            <div className="flex-1 min-w-0 flex flex-col" style={{ rowGap: "1rem" }}>
                <PlayerOverview player={player} />
                <PlayerStats player={player} />
                {/* <PlayerCompare player={player} /> */} {/* Still have to implement */}
            </div>
        </div>
    );
}

function PlayerSidebar({player} : {player : PlayerData}) {
    return (
        <div className="w-72 flex flex-col" style={{ rowGap: "1rem" }}>
            <div className="bg-blue-900 rounded-lg text-center text-white" style={{ padding: "1rem" }}>
                <div className="flex items-center justify-center h-56 bg-blue-950 rounded text-lg font-bold text-white" style={{ marginBottom: "1rem" }}>Photo</div>
                <h2 className="text-lg font-bold">{player.name}</h2>
                <p className="text-lg font-bold">{player.team}</p>
        <p className="text-lg font-bold">{player.positions.join(", ")}</p>
            </div>

            <div className="bg-emerald-500 rounded-lg" style={{ padding: "1rem" }}>
                <textarea
                    placeholder="Write notes here..."
                    className="w-full rounded-md bg-emerald-300 text-slate-900 text-base font-semibold leading-relaxed placeholder:text-emerald-900/70 border border-emerald-600"
                    style={{ minHeight: "15rem", padding: "1rem" }}
                />
            </div>
        </div>
    )
}

function PlayerOverview({player} : {player : PlayerData}) {
    return(
        <div
            className="w-full rounded-lg bg-blue-950 text-white"
            style={{ minHeight: "10rem", padding: "1rem" }}
        >
            <p className="text-lg font-semibold">Placeholder summary:</p>
            <p className="mt-3 text-base text-blue-100">{player.name} played for {player.team} team</p>
        </div>
    )
}

function PlayerStats({player} : {player : PlayerData}) {
    const headerCellStyle = { padding: "1rem" };
    const bodyCellStyle = { padding: "0.5rem 1rem" };

    const formatSeasons = (seasons: number[]) => {
        if (!seasons || !seasons.length) {
            return "N/A";
        }

        return seasons.join(", ");
    };

    const renderHitterRows = (hitter: Record<string, number>, section: string) => {
        const statEntries = Object.entries(hitter || {});

        if (!statEntries.length) {
            return (
                <tr>
                    <td className="text-center normal-case" style={bodyCellStyle} colSpan={2}>No stats available</td>
                </tr>
            );
        }

        return statEntries.map(([stat, value]) => (
            <tr key={`${section}-${stat}`}>
                <td style={bodyCellStyle}>{stat}</td>
                <td className="text-center" style={bodyCellStyle}>{value}</td>
            </tr>
        ));
    };

    return(
        <div className="w-full bg-emerald-600 rounded-lg border border-zinc-800 overflow-hidden">
            <table className="w-full text-xl text-left">
                <thead className="bg-emerald-500 text-black uppercase">
                    <tr>
                        <th className="text-center" style={headerCellStyle}>Statistics</th>
                        <th className="text-center" style={headerCellStyle}>Measured</th>
                    </tr>
                </thead>
                <thead className="bg-emerald-300 text-black uppercase">
                    <tr>
                        <th className="text-center" style={headerCellStyle} colSpan={2}>Projection ({formatSeasons(player.stats.projection.seasons)})</th>
                    </tr>
                </thead>
                <tbody className="bg-emerald-200 text-black uppercase">
                    {renderHitterRows(player.stats.projection.hitter, "projection")}
                </tbody>
                <thead className="bg-emerald-300 text-black uppercase">
                    <tr>
                        <th className="text-center" style={headerCellStyle} colSpan={2}>Last Year ({formatSeasons(player.stats.lastYear.seasons)})</th>
                    </tr>
                </thead>
                <tbody className="bg-emerald-200 text-black uppercase">
                    {renderHitterRows(player.stats.lastYear.hitter, "lastYear")}
                </tbody>
                <thead className="bg-emerald-300 text-black uppercase">
                    <tr>
                        <th className="text-center" style={headerCellStyle} colSpan={2}>Three Year Average ({formatSeasons(player.stats.threeYearAvg.seasons)})</th>
                    </tr>
                </thead>
                <tbody className="bg-emerald-200 text-black uppercase">
                    {renderHitterRows(player.stats.threeYearAvg.hitter, "threeYearAvg")}
                </tbody>
            </table>
        </div>
    );
}