"use client";

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-linear-to-b from-blue-900 to-emerald-700 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl px-12 py-14 w-full max-w-md">
                <h1 className="text-2xl font-bold text-center text-gray-800 mb-10">Login</h1>

                <div className="flex flex-col gap-5">
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-4 rounded-lg bg-gray-100 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    />
                </div>

                <button
                    type="button"
                    className="w-full mt-8 py-4 rounded-lg bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors"
                    onClick={() => console.log("Log In")}
                >
                    Log In
                </button>

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
