'use client';

import { useCampaign } from '@/context/CampaignContext';
import { Calendar, CloudRain, Sun, Moon, Cloud, Wind, Clock } from 'lucide-react';

export default function TimeWidget() {
    const { time } = useCampaign();
    const timeState = time || { day: 1, month: 1, year: 1492, weather: "Clear", timeOfDay: "Morning" };

    const getWeatherIcon = (weather: string) => {
        if (weather.includes("Rain")) return <CloudRain size={20} className="text-blue-400" />;
        if (weather.includes("Cloud")) return <Cloud size={20} className="text-gray-400" />;
        if (weather.includes("Fog")) return <Wind size={20} className="text-gray-300" />;
        return <Sun size={20} className="text-yellow-400" />;
    };

    const getTimeIcon = (timeOfDay: string) => {
        if (timeOfDay.includes("Night") || timeOfDay === "Midnight") return <Moon size={20} className="text-indigo-400" />;
        if (timeOfDay === "Dusk") return <Moon size={20} className="text-purple-400" />;
        return <Sun size={20} className="text-orange-400" />;
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between mb-6 shadow-sm">

            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-900 px-3 py-2 rounded-md">
                    <Calendar size={18} className="text-blue-400" />
                    <span className="text-sm font-semibold text-white">
                        Day {timeState.day}, Month {timeState.month}, {timeState.year}
                    </span>
                </div>

                <div className="flex items-center gap-2 px-3 py-2">
                    {getTimeIcon(timeState.timeOfDay)}
                    <span className="text-sm font-medium text-gray-300">
                        {timeState.timeOfDay}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-end">
                <div className="flex items-center gap-2 bg-gray-900/50 px-4 py-2 rounded-full border border-gray-700">
                    {getWeatherIcon(timeState.weather)}
                    <span className="text-sm font-medium text-gray-200">
                        {timeState.weather}
                    </span>
                </div>
            </div>

        </div>
    );
}
