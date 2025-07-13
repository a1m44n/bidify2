import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container } from '../../components/common/Design';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

// Simple Spinner component
const Spinner = () => (
    <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
);

const TelegramSettings = () => {
    const navigate = useNavigate();
    const { isLoggedIn, authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [telegramChatId, setTelegramChatId] = useState('');
    const [notificationPreferences, setNotificationPreferences] = useState({
        telegram: {
            enabled: false,
            notifyOnOutbid: true,
            notifyOnWin: true,
            notifyOnAuctionEnd: true
        }
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Wait for authentication check to complete before proceeding
        if (authLoading) {
            return; // Don't do anything while auth is still loading
        }

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        
        fetchTelegramSettings();
    }, [isLoggedIn, authLoading, navigate]);

    const fetchTelegramSettings = async () => {
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await axios.get(`${API_URL}/api/users/telegram-settings`, {
                withCredentials: true
            });
            
            const { telegramChatId, notificationPreferences } = response.data;
            setTelegramChatId(telegramChatId || '');
            setNotificationPreferences(notificationPreferences || {
                telegram: {
                    enabled: false,
                    notifyOnOutbid: true,
                    notifyOnWin: true,
                    notifyOnAuctionEnd: true
                }
            });
        } catch (error) {
            console.error('Error fetching Telegram settings:', error);
            setErrorMessage('Failed to load Telegram settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');
        
        try {
            const response = await axios.put(
                `${API_URL}/api/users/telegram-settings`, 
                {
                    telegramChatId,
                    notificationPreferences
                },
                { withCredentials: true }
            );
            
            const { telegramChatId: newChatId, notificationPreferences: newPrefs } = response.data;
            setTelegramChatId(newChatId || '');
            setNotificationPreferences(newPrefs);
            
            setSuccessMessage('Telegram settings updated successfully');
        } catch (error) {
            console.error('Error updating Telegram settings:', error);
            setErrorMessage('Failed to update Telegram settings');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckboxChange = (field) => {
        setNotificationPreferences(prev => ({
            ...prev,
            telegram: {
                ...prev.telegram,
                [field]: !prev.telegram[field]
            }
        }));
    };

    return (
        <Container>
            <div className="max-w-3xl mx-auto py-8">
                <h1 className="text-3xl font-bold text-center mb-8">Telegram Notification Settings</h1>
                
                {loading ? (
                    <div className="flex justify-center">
                        <Spinner />
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow p-6">
                        {successMessage && (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{successMessage}</span>
                            </div>
                        )}
                        {errorMessage && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                <span className="block sm:inline">{errorMessage}</span>
                            </div>
                        )}
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-4">How to Set Up Telegram Notifications</h2>
                            <ol className="list-decimal pl-5 space-y-3 text-gray-700">
                                <li>Open Telegram and search for <code className="bg-gray-100 px-2 py-1 rounded">@Bidify_Bot</code></li>
                                <li>Start a chat with the bot by clicking the Start button</li>
                                <li>Send the command <code className="bg-gray-100 px-2 py-1 rounded">/start</code> to the bot</li>
                                <li>The bot will reply with your chat ID</li>
                                <li>Copy that ID and paste it in the field below</li>
                                <li>Save your settings</li>
                            </ol>
                        </div>
                        
                        <form onSubmit={handleSaveSettings}>
                            <div className="mb-6">
                                <label 
                                    htmlFor="telegramChatId" 
                                    className="block text-gray-700 font-medium mb-2"
                                >
                                    Telegram Chat ID
                                </label>
                                <input
                                    type="text"
                                    id="telegramChatId"
                                    placeholder="Enter your Telegram Chat ID"
                                    value={telegramChatId}
                                    onChange={(e) => setTelegramChatId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            
                            <div className="mb-6">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={notificationPreferences.telegram.enabled}
                                        onChange={() => handleCheckboxChange('enabled')}
                                        className="h-5 w-5 text-blue-600"
                                    />
                                    <span className="ml-2 text-gray-700">Enable Telegram notifications</span>
                                </label>
                            </div>
                            
                            <div className="mb-6">
                                <h3 className="text-lg font-medium mb-3">Notification Preferences</h3>
                                <div className="pl-4 space-y-3">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={notificationPreferences.telegram.notifyOnOutbid}
                                            onChange={() => handleCheckboxChange('notifyOnOutbid')}
                                            disabled={!notificationPreferences.telegram.enabled}
                                            className="h-5 w-5 text-blue-600 disabled:opacity-50"
                                        />
                                        <span className="ml-2 text-gray-700">
                                            Notify me when I'm outbid
                                        </span>
                                    </label>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={notificationPreferences.telegram.notifyOnWin}
                                            onChange={() => handleCheckboxChange('notifyOnWin')}
                                            disabled={!notificationPreferences.telegram.enabled}
                                            className="h-5 w-5 text-blue-600 disabled:opacity-50"
                                        />
                                        <span className="ml-2 text-gray-700">
                                            Notify me when I win an auction
                                        </span>
                                    </label>
                                    
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={notificationPreferences.telegram.notifyOnAuctionEnd}
                                            onChange={() => handleCheckboxChange('notifyOnAuctionEnd')}
                                            disabled={!notificationPreferences.telegram.enabled}
                                            className="h-5 w-5 text-blue-600 disabled:opacity-50"
                                        />
                                        <span className="ml-2 text-gray-700">
                                            Notify me when my auctions end
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </Container>
    );
};

export default TelegramSettings; 