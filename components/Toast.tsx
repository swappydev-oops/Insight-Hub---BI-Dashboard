import React, { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
    message: string;
    type: ToastType;
    onClose: () => void;
}

const toastStyles = {
    success: {
        bg: 'bg-green-100 dark:bg-green-900',
        border: 'border-green-400 dark:border-green-600',
        text: 'text-green-800 dark:text-green-200',
        icon: '✅'
    },
    error: {
        bg: 'bg-red-100 dark:bg-red-900',
        border: 'border-red-400 dark:border-red-600',
        text: 'text-red-800 dark:text-red-200',
        icon: '❌'
    },
    info: {
        bg: 'bg-blue-100 dark:bg-blue-900',
        border: 'border-blue-400 dark:border-blue-600',
        text: 'text-blue-800 dark:text-blue-200',
        icon: 'ℹ️'
    }
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const styles = toastStyles[type];

    return (
        <div className={`flex items-center p-4 max-w-sm w-full rounded-lg shadow-lg border ${styles.bg} ${styles.border} animate-fade-in-right`}>
            <div className="text-xl mr-3">{styles.icon}</div>
            <div className={`flex-grow text-sm font-medium ${styles.text}`}>
                {message}
            </div>
            <button
                onClick={onClose}
                className={`ml-4 -mr-1 -mt-1 p-1 rounded-full ${styles.text} hover:bg-black/10 transition-colors`}
                aria-label="Close"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};

export default Toast;