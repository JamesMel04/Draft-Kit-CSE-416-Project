import { getPlayer } from '@/_lib/api';
import PlayerCard from '@/components/players/player_card';

export default async function PlayerView({
    params
} : {
    params : { id : string }
}) {
    const {id} = (await params);
    console.log(`ID is ${id}`);
    const player = (await getPlayer(id));
    // console.log(id);
    return(
        <div className="w-full py-5">
            <PlayerCard player={player}/>
        </div>
    );

}