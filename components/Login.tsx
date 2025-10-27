import React, { useState, useEffect } from 'react';
import { ChartIcon } from './icons';
import { useToast } from '../contexts/ToastContext';

interface LoginProps {
    onLogin: (user: string, pass: string) => boolean;
}

const REMEMBER_ME_KEY = 'insighthub-remember-me';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        const savedUsername = localStorage.getItem(REMEMBER_ME_KEY);
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            addToast('Please enter both username and password.', 'error');
            return;
        }
        const success = onLogin(username, password);
        if (success) {
             if (rememberMe) {
                localStorage.setItem(REMEMBER_ME_KEY, username);
            } else {
                localStorage.removeItem(REMEMBER_ME_KEY);
            }
        } else {
            addToast('Invalid credentials. Please try again.', 'error');
        }
    };

    return (
        <div className="w-full max-w-sm p-8 space-y-6 bg-white dark:bg-[#1f2937] rounded-lg shadow-lg border border-gray-200 dark:border-[#374151]">
            <div className="flex justify-center">
                <ChartIcon />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-[#f9fafb]">Welcome to InsightHub</h2>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db]"
                    >
                        Username
                    </label>
                    <div className="mt-1">
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="admin"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-600 dark:text-[#d1d5db]"
                    >
                        Password
                    </label>
                    <div className="mt-1">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-[#374151] border border-gray-300 dark:border-[#4b5563] rounded-md p-2 text-gray-900 dark:text-[#f9fafb] focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="admin"
                        />
                    </div>
                </div>
                
                <div className="flex items-center">
                    <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 dark:border-gray-500 rounded bg-gray-50 dark:bg-gray-600"
                    />
                    <label
                        htmlFor="remember-me"
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                    >
                        Remember me
                    </label>
                </div>


                <div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;