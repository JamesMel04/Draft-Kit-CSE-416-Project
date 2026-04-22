"use client";

import { useState } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

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
    { id: "notifications", label: "Notifications" }
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

//Get the initials of a string from its first two words
function getInitials(name: string) {
    return name
        .split(" ")
        .map((part) => part[0] ?? "")
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

// Each settings area is rendered separately so tabs can grow into their own layouts.
function renderSettingsPanel(selectedTab: SettingsTabId) {
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
    }
}

export default function Profile() {
    const { user } = useUser();
    if (user) {
        profile.displayName = user.name ?? profile.displayName;
        profile.email = user.email ?? profile.email;
    }

    const initials = getInitials(profile.displayName);
    const [selectedTab, setSelectedTab] = useState<SettingsTabId>("league");

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

                    {renderSettingsPanel(selectedTab)}
                </div>
            </section>
        </div>
    );
}
