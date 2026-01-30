'use client';

import React from 'react';
import { SkeletonCard } from './SkeletonCard';

interface SkeletonListProps {
    count?: number;
}

export function SkeletonList({ count = 3 }: SkeletonListProps) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}
