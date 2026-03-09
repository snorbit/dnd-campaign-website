'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useCampaign } from '@/context/CampaignContext';
import { Calendar, CloudRain, Sun, Moon, Cloud, Save, Clock, Wind } from 'lucide-react';
import { toast } from 'sonner';

interface TimeTabProps {
    campaignId: string;
}

export default function TimeTab({ campaignId }: TimeTabProps) {
    const { time, updateTime } = useCampaign();
    const timeState = time || { day: 1, month: 1, year: 1492, weather: "Clear", timeOfDay: "Morning" };

    const [day, setDay] = useState(timeState.day);
    const [month, setMonth] = useState(timeState.month);
    const [year, setYear] = useState(timeState.year);
    const [weather, setWeather] = useState(timeState.weather);
    const [timeOfDay, setTimeOfDay] = useState(timeState.timeOfDay);
    const [saving, setSaving] = useState(false);

    const WEATHER_OPTIONS = [
        { label: "Clear & Sunny", value: "Clear", icon: Sun },
        { label: "Partly Cloudy", value: "Partly Cloudy", icon: Cloud },
        { label: "Overcast", value: "Overcast", icon: Cloud },
        { label: "Light Rain", value: "Light Rain", icon: CloudRain },
        { label: "Heavy Rain / Storm", value: "Heavy Rain", icon: CloudRain },
        { label: "Fog / Mist", value: "Fog", icon: Wind },
    ];

    const TIME_OPTIONS = [
        { label: "Dawn", value: "Dawn", icon: Sun },
        { label: "Morning", value: "Morning", icon: Sun },
        { label: "Noon", value: "Noon", icon: Sun },
        { label: "Afternoon", value: "Afternoon", icon: Sun },
        { label: "Dusk", value: "Dusk", icon: Moon },
        { label: "Night", value: "Night", icon: Moon },
        { label: "Midnight", value: "Midnight", icon: Moon },
    ];

    const updateTimeState = async () => {
        setSaving(true);
        const newState = { day, month, year, weather, timeOfDay };

        try {
            updateTime(newState); // Optimistic UI local push

            const { error } = await supabase
                .from('campaign_state')
                .update({
                    time: newState
                })
                .eq('campaign_id', campaignId);

            if (error) throw error;
            toast.success('Time & weather synced to players');

        } catch (error) {
            console.error('Error updating time:', error);
            toast.error('Failed to sync world time');
        } finally {
            setSaving(false);
        }
    };

    const advanceDay = () => {
        setDay(prev => prev + 1);
        setTimeOfDay("Morning");
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Calendar className="text-blue-400" />
                    Campaign Time & Weather
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Track the in-game date, time of day, and current weather conditions.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Date Controls */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-6">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Calendar</h3>

                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-gray-400 block">Day</label>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={day}
                                onChange={(e) => setDay(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-gray-400 block">Month</label>
                            <input
                                type="number"
                                min="1"
                                max="12"
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-medium text-gray-400 block">Year</label>
                            <input
                                type="number"
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={advanceDay}
                        className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium border border-gray-600"
                    >
                        Advance 1 Day (Rest)
                    </button>

                    <div className="space-y-3 pt-4 border-t border-gray-700">
                        <label className="text-sm font-medium text-gray-400 block">Time of Day</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {TIME_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = timeOfDay === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setTimeOfDay(opt.value)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${isSelected
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={18} className="mb-1" />
                                        <span className="text-xs font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Weather Controls */}
                <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Environment</h3>

                    <div className="space-y-3 flex-1">
                        <label className="text-sm font-medium text-gray-400 block">Current Weather</label>
                        <div className="grid grid-cols-2 gap-2">
                            {WEATHER_OPTIONS.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = weather === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        onClick={() => setWeather(opt.value)}
                                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${isSelected
                                                ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                                            }`}
                                    >
                                        <Icon size={16} />
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <button
                        onClick={updateTimeState}
                        disabled={saving}
                        className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Save size={20} />
                        {saving ? 'Syncing...' : 'Sync Tracker to Party'}
                    </button>
                </div>

            </div>
        </div>
    );
}
