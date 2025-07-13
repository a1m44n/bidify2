import { useState } from 'react';
import axios from 'axios';
import API_URL from '../config/api';

const TimeCalculator = ({ onClose }) => {
    const [auctionEndTime, setAuctionEndTime] = useState('');
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const handleCalculate = () => {
        try {
            // Parse the auction end time
            const endTime = new Date(auctionEndTime);
            
            // Calculate total seconds to subtract
            const totalSeconds = 
                (timeLeft.days * 24 * 60 * 60) +
                (timeLeft.hours * 60 * 60) +
                (timeLeft.minutes * 60) +
                parseInt(timeLeft.seconds);
            
            // Subtract the time
            const newEndTime = new Date(endTime.getTime() - (totalSeconds * 1000));
            
            setResult(newEndTime.toISOString());
        } catch (err) {
            setError('Invalid date format');
        }
    };

    const handleUpdateInDB = async () => {
        if (!result) return;
        
        try {
            const response = await axios.post(
                `${API_URL}/api/product/update-end-time`,
                { auctionEndTime: result },
                { withCredentials: true }
            );
            
            if (response.status === 200) {
                setError('');
                alert('Successfully updated auction end time in database');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update time in database');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
                <h2 className="text-xl font-bold mb-4">Time Calculator</h2>
                
                <div className="mb-4">
                    <label className="block mb-2">Auction End Time (e.g., 2025-04-16T15:26:58.630+00:00)</label>
                    <input
                        type="text"
                        value={auctionEndTime}
                        onChange={(e) => setAuctionEndTime(e.target.value)}
                        className="w-full p-2 border rounded"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block mb-2">Days</label>
                        <input
                            type="number"
                            value={timeLeft.days}
                            onChange={(e) => setTimeLeft({...timeLeft, days: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Hours</label>
                        <input
                            type="number"
                            value={timeLeft.hours}
                            onChange={(e) => setTimeLeft({...timeLeft, hours: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Minutes</label>
                        <input
                            type="number"
                            value={timeLeft.minutes}
                            onChange={(e) => setTimeLeft({...timeLeft, minutes: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">Seconds</label>
                        <input
                            type="number"
                            value={timeLeft.seconds}
                            onChange={(e) => setTimeLeft({...timeLeft, seconds: parseInt(e.target.value) || 0})}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>

                {error && <div className="text-red-500 mb-4">{error}</div>}
                
                {result && (
                    <div className="mb-4">
                        <label className="block mb-2">New End Time:</label>
                        <div className="p-2 bg-gray-100 rounded">{result}</div>
                    </div>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleCalculate}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Calculate
                    </button>
                    {result && (
                        <button
                            onClick={handleUpdateInDB}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            Update in DB
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TimeCalculator; 