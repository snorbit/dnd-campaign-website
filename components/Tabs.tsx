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
        <div className="flex h-full flex-col">
            <div className="flex border-b border-fantasy-muted/20">
                {tabs.map((tab, index) => (
                    <button
                        key={index}
                        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === index
                                ? "border-b-2 border-fantasy-accent text-fantasy-accent bg-fantasy-accent/5"
                                : "text-fantasy-muted hover:text-fantasy-text hover:bg-white/5"
                            }`}
                        onClick={() => setActiveTab(index)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                {tabs[activeTab].content}
            </div>
        </div>
    );
}
