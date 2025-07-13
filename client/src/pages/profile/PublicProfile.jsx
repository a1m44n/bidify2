import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Heading } from '../../components/common/Design';
import axios from 'axios';
import API_URL from '../../config/api';

const PublicProfile = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(`${API_URL}/api/users/profile/${userId}`);
                setUser(response.data);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('User not found or error loading profile');
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserProfile();
        } else {
            setError('No user ID provided');
            setLoading(false);
        }
    }, [userId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTelegramHandle = (handle) => {
        if (!handle) return 'Not available';
        return `t.me/${handle}`;
    };

    if (loading) {
        return (
            <section className="pt-24">
                <Container>
                    <div className="text-center py-20">
                        <h1 className="text-2xl font-bold">Loading...</h1>
                        <p className="mt-4">Fetching user profile...</p>
                    </div>
                </Container>
            </section>
        );
    }

    if (error) {
        return (
            <section className="pt-24">
                <Container>
                    <div className="text-center py-20">
                        <h1 className="text-4xl font-bold">Profile Not Found</h1>
                        <p className="mt-4 text-gray-600">{error}</p>
                        <button 
                            onClick={() => navigate(-1)}
                            className="mt-6 bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </Container>
            </section>
        );
    }

    return (
        <section className="pt-24 pb-12">
            <Container>
                <Heading 
                    title={`${user.username}'s Profile`}
                    subtitle="Public profile information"
                />
                
                <div className="max-w-4xl mx-auto">
                    {/* Profile Header */}
                    <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                        <div className="flex items-center gap-6 mb-6">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                                {user.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{user.username}</h1>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                                    user.role === 'admin' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-blue-100 text-blue-800'
                                }`}>
                                    {user.role === 'admin' ? 'Administrator' : 'User'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Public Information */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Public Information</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600 font-medium">Username:</span>
                                <span className="text-gray-800">@{user.username}</span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 font-medium">Telegram Contact:</span>
                                <div className="flex items-center gap-2">
                                    {user.telegramHandle ? (
                                        <a 
                                            href={`https://t.me/${user.telegramHandle}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            {formatTelegramHandle(user.telegramHandle)}
                                        </a>
                                    ) : (
                                        <span className="text-gray-500">Not available</span>
                                    )}
                                </div>
                            </div>
                            
                            {user.createdAt && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600 font-medium">Member Since:</span>
                                    <span className="text-gray-800">{formatDate(user.createdAt)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Actions */}
                    {user.telegramHandle && (
                        <div className="bg-blue-50 rounded-lg p-6 mt-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-3">Contact Options</h3>
                            <div className="flex gap-4">
                                <a 
                                    href={`https://t.me/${user.telegramHandle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors flex items-center gap-2"
                                >
                                    📱 Message on Telegram
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Back Button */}
                    <div className="mt-8 text-center">
                        <button 
                            onClick={() => navigate(-1)}
                            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </Container>
        </section>
    );
};

export default PublicProfile; 