"use client";

import { useContext, useState } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { NotificationContext } from "../contexts/contexts";
import { APINotification } from "@/_lib/types";

type NotificationContextType = {
  notifications: APINotification[];
  unreadCount: number;
  resetUnread: () => void;
};

export default function NotificationBadge() {
  const { notifications, unreadCount, resetUnread } = useContext(NotificationContext) as NotificationContextType;
  const [open, setOpen] = useState(false);

  function toggle() {
    if (!open) resetUnread();
    setOpen((prev) => !prev);
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative flex items-center text-white hover:text-blue-300 transition-colors">
        <BellIcon className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase">
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-gray-400 text-center">No notifications yet</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {[...notifications].reverse().map((n, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="text-xs font-semibold text-blue-600 uppercase">{n.transactionType}</div>
                  <div className="text-sm font-medium text-gray-800">{n.playerName}</div>
                  {n.description && <div className="text-xs text-gray-500 mt-0.5">{n.description}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
