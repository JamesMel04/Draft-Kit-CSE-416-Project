import { getPlayers } from "@/_lib/api";
import { PlayerQueryParams, PlayerGetResponse } from "@/_lib/types";
import PlayerTable from "@/components/players/player_table";
import Pagination from "@/components/ui/pagination";
import { Suspense } from "react";
// Comment out for now, not sure it's needed
// export const dynamic="force-dynamic"
export default async function Player({searchParams} : {searchParams: PlayerQueryParams}) {
    // Get search params to pass in
    searchParams = await searchParams;
    const response : PlayerGetResponse | null = await getPlayers(searchParams);

    return(
        <div>
            <Suspense fallback={<>...</>}>
                <Pagination pagination={response.pagination}/>
            </Suspense>
            <PlayerTable players={response.players}/>
            <Suspense fallback={<>...</>}>
                <Pagination pagination={response.pagination}/>
            </Suspense>
        </div>
    );


}