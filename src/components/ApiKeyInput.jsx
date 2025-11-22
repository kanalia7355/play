import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';

const ApiKeyInput = ({ onApiKeyChange }) => {
    const [apiKey, setApiKey] = useState('');
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Try to get from localStorage first
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
            onApiKeyChange(storedKey);
        } else {
            // Fall back to environment variable
            const envKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (envKey) {
                setApiKey(envKey);
                onApiKeyChange(envKey);
            }
        }
    }, [onApiKeyChange]);

    const handleSave = (e) => {
        const value = e.target.value;
        setApiKey(value);
        localStorage.setItem('gemini_api_key', value);
        onApiKeyChange(value);
    };

    return (
        <div className="flex items-center gap-2 bg-gray-800 p-2 rounded-lg border border-gray-700">
            <Key className="w-4 h-4 text-gray-400" />
            <div className="relative">
                <input
                    type={isVisible ? "text" : "password"}
                    value={apiKey}
                    onChange={handleSave}
                    placeholder="Enter Gemini API Key"
                    className="bg-transparent border-none focus:ring-0 text-sm text-white w-48 placeholder-gray-500"
                />
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                    {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
};

export default ApiKeyInput;
