'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
    return (
        <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            expand={true}
            duration={3000}
            toastOptions={{
                className: 'bg-gray-800 border-gray-700 text-white',
                descriptionClassName: 'text-gray-400',
            }}
        />
    );
}
