"use client";

import { useState } from "react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    // Basic email validation
    const validateEmail = (value: string) => {
        if (!value) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email format";
        return "";
    };

    //Call when Log In is pressed
    const handleLogin = () => {
        const error = validateEmail(email);
        setEmailError(error);
        if (error) return;
        console.log("Log In");
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-blue-900 to-emerald-700 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl px-12 py-14 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-10">Login</h1>

                <div className="flex flex-col gap-5">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) setEmailError("");
                            }}
                            className="w-full px-4 py-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                        />
                        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                    </div>
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                </div>

                {/* Log In Button */}
                <button
                    type="button"
                    className="w-full mt-8 py-4 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                    onClick={handleLogin}
                >
                    Log In
                </button>

                {/* Create New Account Link */}
                <p className="mt-6 text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <button
                        type="button"
                        className="text-blue-600 underline font-medium hover:text-blue-700"
                        onClick={() => console.log("Create New")}
                    >
                        Create New
                    </button>
                </p>
            </div>
        </div>
    );
}
