import { getPlayer } from "@/_lib/api";
import PlayerCard from "@/components/player/player_card";

export default async function PlayerView({
    params
} : {
    params : Promise<{ id : string }>
}) {
    const {id} = await params;
    const player = (await getPlayer(id)).player_data;
    // console.log(id);
    return(
        <div>
            <PlayerCard player={player}/>
        </div>
    );
}