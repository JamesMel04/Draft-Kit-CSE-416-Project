//AI is used in assistance with styling

"use client";

import { useState } from 'react';

//Placeholder Data
//=====================================================================================================
const profile = {
    displayName: "User Name",
    email: "user@example.com",
    status: "Ready for setup",
    memberSince: "March 2026",
};

const settingsTabs = [
    { id: "league", label: "League" },
    { id: "draft", label: "Draft" },
    { id: "notifications", label: "Notifications" },
    { id: "api", label: "API" },
] as const;

type SettingsTabId = (typeof settingsTabs)[number]["id"];

const leagueFields = [
    { label: "League Name", value: "Sunday Sluggers" },
    { label: "Team Name", value: "Emerald Bats" },
    { label: "League Size", value: "12 teams" },
    { label: "Budget", value: "$260 auction" },
];

const notificationRows = [
    { label: "Breaking News", value: "Enabled" },
    { label: "Injury Alerts", value: "Enabled" },
    { label: "Transaction Alerts", value: "Enabled" },
    { label: "Delivery Style", value: "In-app only" },
];
//=====================================================================================================

const isConnected = false;

//Get the initials of a string from its first two words
function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

//Switches UI base on isConnected
function getApiConnectionUi(connected: boolean) {
    //API is connected
    if (connected === true) {
        return {
            statusLabel: "Connected",
            statusAccentClass: "text-emerald-300",
            statusPanelClass: "bg-emerald-900 text-white",
            description:
                "Your DraftKit is linked to its data service and ready for development use.",
            fields: [
                { label: "Connection Status", value: "Connected" },
                { label: "Plan", value: "Development key" },
                { label: "Last Sync", value: "Just now" },
                { label: "Data Source", value: "DraftKit MLB API" },
            ],
        };
    }

    //API is not connected
    if (connected === false) {
        return {
            statusLabel: "Unconnected",
            statusAccentClass: "text-red-300",
            statusPanelClass: "bg-red-900 text-white",
            description:
                "Your DraftKit is not linked to its data service yet. Add an API key when you are ready to connect it.",
            fields: [
                { label: "Connection Status", value: "Unconnected" },
                { label: "Plan", value: "No key added" },
                { label: "Last Sync", value: "Not connected" },
                { label: "Data Source", value: "No Data Source" },
            ],
        };
    }

    throw new Error("API connection state must be explicitly true or false.");
}

// displaying key input UI when API is not Connected 
    // connected - whether is connected to an API
    // apiKeyInput - the key that the user types
    // onApiKeyChange - keet input box and react state in sync, avoid manually grab input from box
function renderApiKeyEntry(
    connected: boolean,
    apiKeyInput: string,
    onApiKeyChange: (value: string) => void,
) {
    if (connected === false) {
        return (
            <div className="mt-6 rounded-[14px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Connect With API Key
                </p>
                <h3 className="mt-3 text-xl font-semibold text-slate-900">
                    Enter your licensed key
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Paste the API key you received for DraftKit MLB API to connect
                    this app to player data and value calculations.
                </p>

                <div className="mt-4 flex flex-col gap-3 lg:flex-row">
                    <label htmlFor="api-key-input" className="sr-only">
                        API key
                    </label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={apiKeyInput}
                        onChange={(event) => onApiKeyChange(event.target.value)}
                        placeholder="Paste your API key"
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none"
                    />

                    <button
                        type="button"
                        disabled={apiKeyInput.trim().length === 0}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        Connect API
                    </button>
                </div>
            </div>
        );
    }

    if (connected === true) {
        return null;
    }

    throw new Error("API connection state must be explicitly true or false.");
}

// Each settings area is rendered separately so tabs can grow into their own layouts.
function renderSettingsPanel(
    selectedTab: SettingsTabId,
    apiKeyInput: string,
    onApiKeyChange: (value: string) => void,
) {
    switch (selectedTab) {
        case "league":
            return (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        League Settings
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Choose the fantasy league details that shape how DraftKit
                        should behave.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        {leagueFields.map((field) => (
                            <div
                                key={field.label}
                                className="rounded-[14px] bg-slate-50 p-4"
                            >
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                    {field.label}
                                </p>
                                <p className="mt-3 text-lg font-semibold text-slate-900">
                                    {field.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case "draft":
            return (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Draft Preferences
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        This section is intentionally empty for now.
                    </p>
                </div>
            );

        case "notifications":
            return (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        Notifications
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Control the kinds of alerts and news that should stand out during
                        draft day.
                    </p>

                    <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-[14px] border border-slate-200 bg-white">
                        {notificationRows.map((row) => (
                            <div
                                key={row.label}
                                className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <p className="text-base font-semibold text-slate-900">
                                        {row.label}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Notification preference
                                    </p>
                                </div>

                                <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                                    {row.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );

        case "api": {
            const apiUi = getApiConnectionUi(isConnected);

            return (
                <div className="mt-6">
                    <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                        API Connection
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Keep track of the service this DraftKit uses for player data and
                        value calculations.
                    </p>

                    {renderApiKeyEntry(isConnected, apiKeyInput, onApiKeyChange)}

                    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                        <div className={`rounded-[14px] p-5 ${apiUi.statusPanelClass}`}>
                            <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${apiUi.statusAccentClass}`}>
                                Status
                            </p>
                            <p className="mt-4 text-3xl font-semibold">{apiUi.statusLabel}</p>
                            <p className="mt-3 text-sm leading-6 text-slate-300">
                                {apiUi.description}
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {apiUi.fields.map((field) => (
                                <div
                                    key={field.label}
                                    className="rounded-[14px] bg-slate-50 p-4"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                                        {field.label}
                                    </p>
                                    <p className="mt-3 text-lg font-semibold text-slate-900">
                                        {field.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
    }
}

export default function Profile() {
    const initials = getInitials(profile.displayName);
    const [selectedTab, setSelectedTab] = useState<SettingsTabId>("league");
    const [apiKeyInput, setApiKeyInput] = useState("");

    return (
        <div className="space-y-6 text-slate-900">
            <section className="space-y-6">
                <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                        <p className="text-3xl font-semibold tracking-tight text-slate-900">
                            Account
                        </p>

                    <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-linear-to-br from-emerald-500 to-blue-700 text-3xl font-semibold text-white shadow-lg shadow-emerald-900/20">
                                {initials}
                            </div>

                            <div>
                                <p className="text-lg font-semibold text-slate-900">
                                    {profile.displayName}
                                </p>
                                <p className="text-sm text-slate-500">{profile.email}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            className="inline-flex w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-500">
                        Your account details live here. League and draft setup can sit
                        below in the settings area.
                    </p>
                </div>

                <div className="rounded-[16px] border border-slate-200 bg-white p-6 shadow-sm md:p-7">
                    <p className="text-3xl font-semibold tracking-tight text-slate-900">
                        Settings
                    </p>

                    <div className="mt-4 border-b border-slate-200">
                        <div className="flex flex-wrap items-end gap-7 pb-2">
                            {settingsTabs.map((tab) => {
                                const isActive = tab.id === selectedTab;

                                return (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setSelectedTab(tab.id)}
                                        className={`relative bg-transparent pb-1 text-xl font-semibold transition-colors ${
                                            isActive
                                                ? "text-slate-900"
                                                : "text-slate-500 hover:text-slate-800"
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        {isActive ? (
                                            <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-emerald-600" />
                                        ) : null}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {renderSettingsPanel(
                        selectedTab,
                        apiKeyInput,
                        (value: string) => setApiKeyInput(value),
                    )}
                </div>
            </section>
        </div>
    );
}
