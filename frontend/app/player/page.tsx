import { getAllPlayers } from "@/_lib/api";
import PlayerTable from "@/components/player/player_table";

export default async function Player() {
    // Fetch players
    const players = await getAllPlayers();
    return(
        <PlayerTable players={players}/>
    );
}