// src/app/pair/page.tsx
"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function PairPage() {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const screenId = localStorage.getItem('screenId');
        if (screenId) {
            window.location.href = `/play/${screenId}`;
        }
    }, []);

    const handlePairing = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!code || code.length !== 6) {
            setError('Please enter a valid 6-digit code.');
            setLoading(false);
            return;
        }

        const { data, error: rpcError } = await supabase.rpc('pair_screen', { pairing_code_param: code });

        if (rpcError) {
            setError(`An error occurred: ${rpcError.message}`);
            setLoading(false);
            return;
        }

        // Check if the function returned a debug message or a valid UUID
        if (data && !data.startsWith('DEBUG:')) {
            // Success! The data is the screenId.
            const screenId = data;
            localStorage.setItem('screenId', screenId);
            window.location.href = `/play/${screenId}`;
        } else {
            // Failure. Show the debug message or a generic error.
            setError(data || 'Invalid or expired pairing code. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="w-screen h-screen bg-black flex flex-col items-center justify-center text-white">
            <h1 className="text-4xl font-bold mb-4">Pair Your Screen</h1>
            <p className="text-gray-400 mb-8">Enter the 6-digit code from your admin dashboard.</p>
            <form onSubmit={handlePairing} className="flex flex-col items-center gap-4">
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                    maxLength={6}
                    className="text-center text-3xl tracking-[.5em] bg-gray-800 border border-gray-600 rounded-md p-4 w-64"
                />
                <button type="submit" disabled={loading} className="px-8 py-3 bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                    {loading ? 'Pairing...' : 'Pair Device'}
                </button>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </form>
        </div>
    );
}
