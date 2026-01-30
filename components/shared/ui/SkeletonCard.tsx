'use client';

import React from 'react';
import { Skeleton } from './Skeleton';

export function SkeletonCard() {
    return (
        <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-3">
            <div className="flex justify-between items-start">
                <Skeleton width="w-1/3" height="h-6" />
                <Skeleton width="w-20" height="h-8" />
            </div>
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-4/5" height="h-4" />

            <div className="pt-2 space-y-2">
                <Skeleton width="w-1/4" height="h-3" />
                <div className="flex items-center gap-2">
                    <Skeleton width="w-4" height="h-4" rounded="rounded-full" />
                    <Skeleton width="w-1/2" height="h-3" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton width="w-4" height="h-4" rounded="rounded-full" />
                    <Skeleton width="w-1/3" height="h-3" />
                </div>
            </div>
        </div>
    );
}
