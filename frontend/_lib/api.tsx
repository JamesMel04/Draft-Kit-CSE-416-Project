/* ONLY ADD SERVER FUNCTIONS HERE, NEVER DIRECTLY CALL fetch() */
import { BACKEND_URL } from "./consts"

export async function searchPlayer(name: string) {
    try {
        const res = await fetch(`${BACKEND_URL}/search?name=${filter}`);
        if(!res.ok) throw new Error("Failed to fetch search query");
        return await res.json();
    }
    catch(err) {
        console.error("Player search failed: ", err);
        return null;
    }
}

export async function getPlayer(id : string) {
    try {
        const res = await fetch(`${BACKEND_URL}/player/${id}`);
        if(!res.ok) throw new Error("Failed to fetch player");
        return await res.json();
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
        const res = await fetch(`${BACKEND_URL}/players`);
        if(!res.ok) throw new Error("Failed to fetch all players");
        return await res.json();
    }
    catch(err) {
        console.error("All players fetch failed: ", err);
        return null;
    }
}