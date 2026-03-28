import { getPlayers } from "@/_lib/api";
import { PlayerGetParams, PlayerGetResponse } from "@/_lib/types";
import PlayerTable from "@/components/players/player_table";
import Pagination from "@/components/ui/pagination";
export const dynamic="force-dynamic"
export default async function Player({searchParams} : {searchParams: PlayerGetParams}) {
    // Get search params to pass in
    searchParams = await searchParams;
    const response : PlayerGetResponse | null = await getPlayers(searchParams);

    return(
        <div>
            <Pagination pagination={response.pagination}/>
            <PlayerTable players={response.players}/>
            <Pagination pagination={response.pagination}/>
        </div>
    );


}