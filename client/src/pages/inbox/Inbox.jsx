import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Heading } from '../../components/common/Design';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

const Inbox = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoggedIn, user, authLoading } = useAuth();

    useEffect(() => {
        // Wait for authentication check to complete before proceeding
        if (authLoading) {
            return; // Don't do anything while auth is still loading
        }

        if (!isLoggedIn) {
            setLoading(false);
            setError('Please log in to view your messages');
            return;
        }

        fetchMessages();
    }, [isLoggedIn, authLoading]);

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/messages`, {
                withCredentials: true
            });
            setMessages(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch messages: ' + (err.response?.data?.message || err.message));
            setLoading(false);
        }
    };

    const markAsRead = async (messageId) => {
        try {
            await axios.patch(`${API_URL}/api/messages/${messageId}/read`, {}, {
                withCredentials: true
            });
            // Update the local state to reflect the change
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg._id === messageId ? { ...msg, read: true } : msg
                )
            );
        } catch (err) {
            console.error('Failed to mark message as read:', err);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || authLoading) return (
        <Container>
            <div className="py-8">
                <Heading title="Inbox" subtitle="Your message center" />
                <p>Loading messages...</p>
            </div>
        </Container>
    );

    if (error) return (
        <Container>
            <div className="py-8">
                <Heading title="Inbox" subtitle="Your message center" />
                <p className="text-red-500">{error}</p>
            </div>
        </Container>
    );

    return (
        <Container>
            <div className="py-8">
                <Heading title="Inbox" subtitle="Your message center" />
                
                {messages.length === 0 ? (
                    <p>No messages to display.</p>
                ) : (
                    <div className="space-y-4 mt-6">
                        {messages.map((message) => {
                            const isSentByMe = message.sender?._id === user?._id;
                            const isReceivedByMe = message.recipient?._id === user?._id;
                            
                            return (
                                <div 
                                    key={message._id} 
                                    className={`p-4 rounded-lg border ${
                                        !message.read && isReceivedByMe 
                                        ? 'bg-blue-50 border-blue-200' 
                                        : 'bg-gray-50'
                                    }`}
                                    onClick={() => !message.read && isReceivedByMe && markAsRead(message._id)}
                                >
                                    <div className="flex justify-between mb-2">
                                        <span className="font-semibold">
                                            {message.messageType === 'AUCTION_WIN' ? '🏆 Auction Won' : 
                                            message.messageType === 'AUCTION_END' ? '🔔 Auction Ended' : 
                                            message.messageType === 'AUCTION_OUTBID' ? '📢 Outbid' : '📩 System Message'}
                                            {!message.read && isReceivedByMe && (
                                                <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                    New
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-gray-500 text-sm">{formatDate(message.createdAt)}</span>
                                    </div>
                                    
                                    <p className="mb-2">{message.message}</p>
                                    
                                    <div className="mt-3 text-sm text-gray-600">
                                        <p>Product: {message.productTitle}</p>
                                        
                                        {/* AUCTION_WIN specific details */}
                                        {message.messageType === 'AUCTION_WIN' && (
                                            <>
                                                {message.winningBid && (
                                                    <p className="font-medium text-green-600">Winning Bid: ${message.winningBid.toFixed(2)}</p>
                                                )}
                                                <div className="mt-2 p-2 bg-blue-50 rounded">
                                                    <p className="font-medium text-blue-700">Contact Seller:</p>
                                                    <p>Username: 
                                                        {message.sender?._id ? (
                                                            <Link 
                                                                to={`/profile/${message.sender._id}`}
                                                                className="text-blue-600 hover:text-blue-800 underline ml-1"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                @{message.sender.username}
                                                            </Link>
                                                        ) : (
                                                            <span className="ml-1">@Unknown</span>
                                                        )}
                                                    </p>
                                                    <p>Telegram: {message.sender?.telegramHandle ? `@${message.sender.telegramHandle}` : 'Not available'}</p>
                                                </div>
                                            </>
                                        )}

                                        {/* AUCTION_END specific details */}
                                        {message.messageType === 'AUCTION_END' && (
                                            <div className="mt-2 p-2 bg-green-50 rounded">
                                                {message.productId?.soldTo ? (
                                                    <>
                                                        <p className="font-medium text-green-700">Contact Winner:</p>
                                                        <p>Username: 
                                                            {message.productId.soldTo._id ? (
                                                                <Link 
                                                                    to={`/profile/${message.productId.soldTo._id}`}
                                                                    className="text-blue-600 hover:text-blue-800 underline ml-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    @{message.productId.soldTo.username}
                                                                </Link>
                                                            ) : (
                                                                <span className="ml-1">@{message.productId.soldTo.username}</span>
                                                            )}
                                                        </p>
                                                        <p>Telegram: {message.productId.soldTo.telegramHandle ? `@${message.productId.soldTo.telegramHandle}` : 'Not available'}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-gray-600">No winner - auction ended without bids</p>
                                                )}
                                            </div>
                                        )}

                                        {/* AUCTION_OUTBID specific details */}
                                        {message.messageType === 'AUCTION_OUTBID' && (
                                            <div className="mt-2">
                                                {message.productId?.isArchived || message.productId?.isSoldOut ? (
                                                    <div className="p-2 bg-gray-100 rounded border">
                                                        <p className="text-gray-600 font-medium">⏰ Auction has ended</p>
                                                    </div>
                                                ) : (
                                                    <Link 
                                                        to={`/details/${message.productId?._id || message.productId}`}
                                                        className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        🏷️ View Ongoing Auction
                                                    </Link>
                                                )}
                                            </div>
                                        )}

                                        {/* SYSTEM message details (fallback) */}
                                        {message.messageType === 'SYSTEM' && (
                                            <div className="mt-2 text-xs text-gray-500">
                                                <p>From: @{message.sender?.username || 'System'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Container>
    );
};

export default Inbox; 