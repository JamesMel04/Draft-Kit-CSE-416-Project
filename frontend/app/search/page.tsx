import { searchPlayer } from "@/_lib/api";
import { PlayerData } from "@/_lib/types";
import PlayerTable from "@/components/player/player_table";

export default async function SearchPage({ searchParams } : {searchParams: {name? : string }}) {
    // Query the given players from searchparameters
    const search = (await searchParams).name;
    if(!search) {
        return(
            <div>
                Invalid query
            </div>
        );
    }
    const playerList : PlayerData[] = await searchPlayer(search); 
    console.log(playerList)
    return(
        <PlayerTable players={playerList}/>
    )
}