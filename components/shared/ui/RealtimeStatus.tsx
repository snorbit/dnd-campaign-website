import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { RealtimeStatus as StatusType } from '@/components/shared/hooks/useRealtimeSubscription';

interface RealtimeStatusProps {
    status: StatusType;
    className?: string;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ status, className = '' }) => {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${status === 'connected' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
            status === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
            } ${className}`}>
            {status === 'connected' ? (
                <Wifi size={10} className="animate-pulse" />
            ) : (
                <WifiOff size={10} />
            )}
            <span className="opacity-80">{status}</span>
        </div>
    );
};
