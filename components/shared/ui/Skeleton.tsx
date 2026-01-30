'use client';

import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string;
    height?: string;
    rounded?: string;
}

export function Skeleton({ 
    className = '', 
    width = 'w-full', 
    height = 'h-4', 
    rounded = 'rounded' 
}: SkeletonProps) {
    return (
        <div 
            className={`animate-pulse bg-gray-700/50 ${width} ${height} ${rounded} ${className}`} 
        />
    );
}
