"use client";

import React, { useState } from 'react';

interface TabProps {
    label: string;
    children: React.ReactNode;
}

interface TabsProps {
    tabs: { label: string; content: React.ReactNode }[];
}

export default function Tabs({ tabs }: TabsProps) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="flex flex-col h-full">
            <div className="flex border-b border-white/5 bg-black/20">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveTab(index)}
                        className={`
                            flex-1 px-4 py-3 text-sm font-bold uppercase tracking-widest transition-all duration-300 relative
                            ${activeTab === index
                                ? 'text-fantasy-gold bg-fantasy-gold/5'
                                : 'text-fantasy-muted hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        {tab.label}
                        {activeTab === index && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-fantasy-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                        )}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar p-1">
                {tabs[activeTab].content}
            </div>
        </div>
    );
}
