/**
 * This is a wrapper for providing notification info:
 *  The list of notifications
 *  The number of unread notifications
 *  Method to reset the unread notifications to 0
 * I did it this way because it prevents having to rewrite the eventSource logic since I want two separate views for notifications
 */

import { BACKEND_URL } from "@/_lib/consts";
import { APINotification } from "@/_lib/types";
import { useEffect, useState } from "react";
import { NotificationContext } from "../contexts";


export default function Notification({ children } : { children : never }) {
    const [notifications, setNotifications] = useState<APINotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // UseEffect to set the eventSource to the backend GET URL
    useEffect(() => {
        // Create an EventSource to listen to SSE events
        const eventSource = new EventSource(`${BACKEND_URL}`);
        // Handle incoming messages
        eventSource.onmessage = (event) => {
            const data : APINotification = JSON.parse(event.data);
            setNotifications((prevNotifs) => [...prevNotifs, data]);
            setUnreadCount((u) => u+1);
        };
        // Handle errors
        eventSource.onerror = () => {
            console.error('Error connecting to SSE server.');
            eventSource.close();
        };
        // Cleanup on unmount
        return () => {
            eventSource.close();
        };
    }, []);

    // Function to reset unread count. Mostly needed by notification badge
    function resetUnread() { setUnreadCount(0) }

    return(
        <NotificationContext value={ {notifications, unreadCount, resetUnread} }>
            {children}
        </NotificationContext>
    )
}