/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts"

export async function searchPlayer(name: string) {
    try {
        const request = `${BACKEND_URL}/search?name=${name}`;
        console.log(request);
        const resJson = await fetch(request);
        if(!resJson.ok) throw new Error("Failed to fetch search query");
        const res = await resJson.json()
        console.log(res);
        return res.players;
    }
    catch(err) {
        console.error("Player search failed: ", err);
        return null;
    }
}

export async function getPlayer(id : string) {
    try {
        console.log(BACKEND_URL);
        const resJson = await fetch(`${BACKEND_URL}/players/${id}`);

        if(!resJson.ok) throw new Error("Failed to fetch player");
        const res = await resJson.json();
        return res.player;
    }
    catch(err) {
        console.error("Player fetch failed: ", err);
        return null;
    }
}

/*
For now, returns list of players of form:
Player:
    id
    name
    team
*/
export async function getAllPlayers() {
    try {
        const resJson = await fetch(`${BACKEND_URL}/players`);
        if(!resJson.ok) throw new Error("Failed to fetch all players");
        const res = await resJson.json();
        return res.players;
    }
    catch(err) {
        console.error("All players fetch failed: ", err);
        return [];
    }
}