"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function HeaderUserMenu() {
    const { user, isLoading } = useUser();

    if (isLoading) {
        return <span className="text-sm text-slate-600">Loading...</span>;
    }

    //Display log in button
    if(!user) {
        return (
            <a
                href="/auth/login"
                className="inline-flex w-18 h-8 items-center justify-center rounded-full bg-emerald-700 px-6 text-base font-bold leading-none text-white transition-colors hover:bg-emerald-800 focus:outline-none"
            >
                Log In
            </a>
        );
    }

    //Display User Profile | Name | Money
    return (
        <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm font-semibold text-slate-800 hover:text-slate-950">
                {user.name || user.email || "Profile"}
            </Link>
            <a href="/auth/logout" className="text-sm text-slate-600 hover:text-slate-900">
                Logout
            </a>
        </div>
    );

}