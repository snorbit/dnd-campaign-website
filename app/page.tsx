'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
    const router = useRouter();
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        // Trigger fade-in animation
        setShowWelcome(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Animated background particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-2 h-2 bg-yellow-500/20 rounded-full animate-pulse" />
                <div className="absolute top-40 right-20 w-1 h-1 bg-yellow-400/30 rounded-full animate-pulse delay-100" />
                <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-orange-500/10 rounded-full animate-pulse delay-200" />
                <div className="absolute bottom-20 right-1/3 w-2 h-2 bg-yellow-500/20 rounded-full animate-pulse delay-300" />
            </div>

            <div className="max-w-2xl w-full relative z-10">
                {/* Main Title */}
                <div className={`text-center mb-16 transition-all duration-1000 ${showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
                    <h1 className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 mb-8 drop-shadow-lg font-cinzel">
                        sessionforge
                    </h1>
                </div>

                {/* Welcome Message */}
                <div className={`text-center mb-12 transition-all duration-1500 delay-500 ${showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 blur-xl rounded-lg" />
                        <h2 className="relative text-5xl font-cinzel text-yellow-100 tracking-wide px-8 py-4">
                            Welcome, Traveler
                        </h2>
                    </div>
                    <p className="text-gray-400 text-lg mt-6 italic font-serif">
                        Your adventure awaits beyond these gates
                    </p>
                </div>

                {/* Action Buttons */}
                <div className={`flex flex-col sm:flex-row gap-6 items-center justify-center transition-all duration-1500 delay-1000 ${showWelcome ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className="group relative w-64 px-10 py-5 bg-gradient-to-br from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-500"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-200/20 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <div className="relative text-2xl font-bold text-white font-cinzel tracking-wide">
                            Login
                        </div>
                        <div className="relative text-sm text-yellow-100 mt-1">
                            Enter your realm
                        </div>
                    </button>

                    <button
                        onClick={() => router.push('/auth/signup')}
                        className="group relative w-64 px-10 py-5 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-orange-500"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-200/20 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        <div className="relative text-2xl font-bold text-white font-cinzel tracking-wide">
                            Sign Up
                        </div>
                        <div className="relative text-sm text-orange-100 mt-1">
                            Begin your journey
                        </div>
                    </button>
                </div>

                {/* Subtitle */}
                <div className={`text-center mt-16 transition-all duration-1500 delay-1500 ${showWelcome ? 'opacity-100' : 'opacity-0'}`}>
                    <p className="text-gray-500 text-sm italic">
                        Forge unforgettable D&D campaigns together
                    </p>
                </div>
            </div>

            <style jsx>{`
                .delay-100 {
                    animation-delay: 0.1s;
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
                .delay-300 {
                    animation-delay: 0.3s;
                }
                .delay-500 {
                    transition-delay: 0.5s;
                }
                .delay-1000 {
                    transition-delay: 1s;
                }
                .delay-1500 {
                    transition-delay: 1.5s;
                }
            `}</style>
        </div>
    );
}
