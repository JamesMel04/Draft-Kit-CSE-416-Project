import { Router, Request, Response } from 'express';
import { HitterPlayer, PitcherPlayer, Player, PlayerData, PlayerID, PlayerPools } from '../types';
import { getPlayers } from '../utils/api';
import { defaultMaxListeners } from 'node:events';
import { APINotification } from '../types/index';

const router = Router();

// Set of clients currently listening for notifications
let subscribedClients = new Set<Response>();

/**
 * Endpoint for clients to call to open new SSE connections with (server-sent events)
 * Anytime a new client queries this endpoint, the connection is opened and stays open until the CLIENT closes it 
 */
router.get('/', async (req, res) => {
    // Boilerplate headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Add client to set
    subscribedClients.add(res);

    // Only disconnect when the client sends a close request
    req.on('close', () => {
        subscribedClients.delete(res);
        res.end();
    });
})

/**
 * When this is POSTed by the Player API, it will add to a given client set stored in memory
 */
router.post('/', (req, res) => {
    const notif : APINotification = req.body;
    
    // Iterate and write to each client
    // Not sending, as that closes the connection
    // The \n\n is needed for the EventSource listener to know it's the end of an event
    // One \n would be for the next field/property, which is why two are needed
    for (let c of subscribedClients) {
        c.write(`data: ${JSON.stringify(notif)}\n\n`);
    }
})


export default router;