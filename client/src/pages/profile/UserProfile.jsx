import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Container, Heading } from '../../components/common/Design';
import axios from 'axios';
import API_URL from '../../config/api';

const UserProfile = () => {
    const { user, isLoggedIn, authLoading, setUser } = useAuth();
    const [isEditingTelegram, setIsEditingTelegram] = useState(false);
    const [telegramHandle, setTelegramHandle] = useState(user?.telegramHandle || '');
    const [isSaving, setIsSaving] = useState(false);

    // Show loading while authentication is being checked
    if (authLoading) {
        return (
            <section className="pt-24">
                <Container>
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold">Loading...</h1>
                        <p className="mt-4">Checking authentication status...</p>
                    </div>
                </Container>
            </section>
        );
    }

    if (!isLoggedIn) {
        return (
            <section className="pt-24">
                <Container>
                    <div className="text-center py-20">
                        <h1 className="text-4xl font-bold">Access Denied</h1>
                        <p className="mt-4">Please log in to view your profile.</p>
                    </div>
                </Container>
            </section>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleEditTelegram = () => {
        setIsEditingTelegram(true);
    };

    const handleSaveTelegram = async () => {
        setIsSaving(true);
        try {
            // Remove @ symbol if user entered it
            const cleanHandle = telegramHandle.replace('@', '');
            
            const response = await axios.put(
                `${API_URL}/api/users/update-telegram-handle`,
                { telegramHandle: cleanHandle },
                { withCredentials: true }
            );

            // Update user context with new telegram handle
            setUser({ ...user, telegramHandle: cleanHandle });
            setIsEditingTelegram(false);
        } catch (error) {
            console.error('Error updating telegram handle:', error);
            // Reset to original value on error
            setTelegramHandle(user?.telegramHandle || '');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setTelegramHandle(user?.telegramHandle || '');
        setIsEditingTelegram(false);
    };

    const formatTelegramHandle = (handle) => {
        if (!handle) return 'Not set';
        return `t.me/${handle}`;
    };

    return (
        <section className="pt-24 pb-12">
            <Container>
                <Heading 
                    title="My Profile" 
                    subtitle="Manage your account information and settings"
                />
                
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {user?.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{user?.username}</h1>
                                <p className="text-gray-600">{user?.email}</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                                    user?.role === 'admin' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {user?.role === 'admin' ? 'Administrator' : 'User'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Account Information</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600 font-medium">Username:</span>
                                <span className="text-gray-800">{user?.username}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 font-medium">Email:</span>
                                <span className="text-gray-800">{user?.email}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Telegram Contact:</span>
                                <div className="flex items-center gap-2">
                                    {isEditingTelegram ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center">
                                                <span className="text-gray-500 mr-1">t.me/</span>
                                                <input
                                                    type="text"
                                                    value={telegramHandle}
                                                    onChange={(e) => setTelegramHandle(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            handleSaveTelegram();
                                                        } else if (e.key === 'Escape') {
                                                            e.preventDefault();
                                                            handleCancelEdit();
                                                        }
                                                    }}
                                                    className="border border-gray-300 rounded px-2 py-1 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="username"
                                                    disabled={isSaving}
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveTelegram}
                                                disabled={isSaving}
                                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 disabled:opacity-50 font-medium"
                                            >
                                                {isSaving ? '...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                disabled={isSaving}
                                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 disabled:opacity-50 font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-800">
                                                {user?.telegramHandle ? (
                                                    <a 
                                                        href={`https://t.me/${user.telegramHandle}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 underline"
                                                    >
                                                        {formatTelegramHandle(user.telegramHandle)}
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">Not set</span>
                                                )}
                                            </span>
                                            <button
                                                onClick={handleEditTelegram}
                                                className="text-blue-500 hover:text-blue-700 text-sm"
                                                title="Edit telegram handle"
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* <div className="flex justify-between">
                                <span className="text-gray-600 font-medium">Member Since:</span>
                                <span className="text-gray-800">{formatDate(user?.createdAt)}</span>
                            </div> */}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default UserProfile; 