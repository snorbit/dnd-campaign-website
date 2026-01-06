'use client';

import { useRouter } from 'next/navigation';
import { Shield, Users } from 'lucide-react';

export default function HomePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-4">
                        Campaign Portal
                    </h1>
                    <p className="text-gray-400 text-lg italic">
                        Choose your destiny or guide the fate of others.
                    </p>
                </div>

                {/* Role Selection */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* DM Button */}
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="group relative bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 p-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-500"
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className="bg-yellow-900/30 p-6 rounded-full">
                                <Shield size={80} className="text-yellow-200" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Dungeon Master</h2>
                                <p className="text-yellow-100 text-sm">
                                    Create campaigns, manage encounters, and guide your players
                                </p>
                            </div>
                            <div className="text-yellow-200 text-sm uppercase tracking-wider">
                                Enter as DM →
                            </div>
                        </div>
                    </button>

                    {/* Player Button */}
                    <button
                        onClick={() => router.push('/campaigns')}
                        className="group relative bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 p-8 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-blue-500"
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className="bg-blue-900/30 p-6 rounded-full">
                                <Users size={80} className="text-blue-200" />
                            </div>
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-white mb-2">Player</h2>
                                <p className="text-blue-100 text-sm">
                                    Join campaigns, level up your character, and embark on adventures
                                </p>
                            </div>
                            <div className="text-blue-200 text-sm uppercase tracking-wider">
                                Enter as Player →
                            </div>
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <div className="text-center mt-12">
                    <p className="text-gray-500 text-sm">
                        Don't have an account?{' '}
                        <a href="/auth/signup" className="text-yellow-500 hover:text-yellow-400 underline">
                            Sign up here
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
