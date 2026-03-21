import { getPlayer } from "@/_lib/api";
import PlayerCard from "@/components/player/player_card";

export default async function PlayerView({
    params
} : {
    params : Promise<{ id : string }>
}) {
    const {id} = await params;
    const player = (await getPlayer(id));
    // console.log(id);
    return(
        <div className="w-full py-5">
            <PlayerCard player={player}/>
        </div>
    );
}