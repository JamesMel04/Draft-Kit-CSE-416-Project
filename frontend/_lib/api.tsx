/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts";
import { PlayerData, PlayerGetParams, PlayerGetResponse } from "./types";
import axios from "axios"

/*
* Config for axios. Much easier to make backend requests this way
*/
const api = axios.create({
    baseURL: `${BACKEND_URL}`,
});


export async function getPlayer(id : string) : Promise<PlayerData> {
    try {
        const res : {player : PlayerData}= (await api.get(`/players/${id}`)).data;
        return res.player;
    }
    catch(err) {
        console.error("Player fetch failed: ", err);
        throw err;
    }
}

/*
Get players on specific page, based off parameters specified in backend documentation (README)
*/
export async function getPlayers(params : PlayerGetParams) : Promise<PlayerGetResponse> {
    try {
        const query = new URLSearchParams();
        let k: keyof typeof params;
        for (k in params) {
            const v = (params[k]);
            if (v !== null && v !== undefined) query.append(k, v.toString());
        }
        
        // Now query to the backend
        const url = query?.toString() ? `/players?${query.toString()}` : `/players`
        console.log(`Querying ${url}`);
        const res = (await api.get<PlayerGetResponse>(url)).data;

        return res;
    }
    catch(err) {
        console.error("Players query failed: ", err);
        throw err;
    }
}