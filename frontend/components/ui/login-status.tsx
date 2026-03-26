"use client";

import Link from "next/link";

export default function HeaderUserMenu() {
    const isLoggedIn = false;

    //Display log in button
    if(!isLoggedIn) {
        return (
            <Link
                href="/login"
                className="inline-flex w-18 h-8 items-center justify-center rounded-full bg-emerald-700 px-6 text-base font-bold leading-none text-white transition-colors hover:bg-emerald-800 focus:outline-none"
            >
                Log In
            </Link>
        );
    }

    //Display User Profile | Name | Money
    return <Link href="/profile">Username</Link>;

}