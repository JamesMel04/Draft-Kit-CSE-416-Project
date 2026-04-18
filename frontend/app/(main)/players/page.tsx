import { PlayerQueryParams, PlayerGetResponse } from '@/_lib/types';
import { getPlayers } from '@/_lib/api';
import PlayerTable from '@/components/players/player_table';

// Comment out for now, not sure it's needed
// export const dynamic="force-dynamic"
export default async function Player({searchParams} : {searchParams: PlayerQueryParams}) {
    // Get search params to pass in
    searchParams = await searchParams;
    const response : PlayerGetResponse | null = await getPlayers(searchParams);

    return(
        <div>
            <PlayerTable players={response.players}/>
        </div>
    );


}