import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Heading } from '../../components/common/Design';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

const MyProducts = () => {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isLoggedIn, authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Wait for authentication check to complete before proceeding
        if (authLoading) {
            return; // Don't do anything while auth is still loading
        }

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const fetchMyProducts = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/product/user`, {
                    withCredentials: true
                });
                setAllProducts(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch products: ' + (err.response?.data?.message || err.message));
                setLoading(false);
            }
        };

        fetchMyProducts();
    }, [isLoggedIn, authLoading, navigate]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
    };

    const isAuctionEnded = (endTime) => {
        return new Date() > new Date(endTime);
    };

    const getTimeLeft = (endTime) => {
        const now = new Date();
        const timeLeft = new Date(endTime) - now;
        
        if (timeLeft <= 0) return "Auction ended";
        
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    // Separate products into ongoing and ended
    const ongoingProducts = allProducts.filter(product => 
        !product.isArchived && !isAuctionEnded(product.auctionEndTime)
    );
    
    const endedProducts = allProducts.filter(product => 
        product.isArchived || isAuctionEnded(product.auctionEndTime)
    );

    const renderProductCard = (product, isOngoing = false) => (
        <div key={product._id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {product.image && product.image.url && (
                <img 
                    src={product.image.url} 
                    alt={product.title} 
                    className="w-full h-48 object-cover"
                />
            )}
            <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-2 truncate">{product.description}</p>
                
                <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                    <span>Starting Price: ${product.price.toFixed(2)}</span>
                    {isOngoing ? (
                        <span className="text-green-600 font-medium">
                            {getTimeLeft(product.auctionEndTime)}
                        </span>
                    ) : (
                        <span>Ended: {formatDate(product.auctionEndTime)}</span>
                    )}
                </div>
                
                <div className="mt-4 pt-3 border-t">
                    {isOngoing ? (
                        <div className="bg-blue-50 p-3 rounded-md">
                            <p className="text-blue-700 font-medium">
                                Auction Active
                            </p>
                            <p className="text-blue-600 text-sm">
                                Ends: {formatDate(product.auctionEndTime)}
                            </p>
                        </div>
                    ) : (
                        <>
                            {product.soldTo ? (
                                <div className="bg-green-50 p-3 rounded-md">
                                    <p className="text-green-700 font-medium">
                                        Sold to: @{product.soldTo.username}
                                    </p>
                                    <p className="text-green-600">
                                        Final Price: ${product.soldPrice?.toFixed(2) || product.price.toFixed(2)}
                                    </p>
                                </div>
                            ) : (
                                <div className="bg-yellow-50 p-3 rounded-md">
                                    <p className="text-yellow-700">No bids were placed on this item</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                
                <button 
                    onClick={() => navigate(`/details/${product._id}`)}
                    className="w-full mt-4 bg-primary text-white py-2 rounded hover:bg-blue-600"
                >
                    View Details
                </button>
            </div>
        </div>
    );

    if (loading || authLoading) return (
        <Container>
            <div className="py-8">
                <Heading title="My Products" subtitle="Your auction listings" />
                <p>Loading products...</p>
            </div>
        </Container>
    );

    if (error) return (
        <Container>
            <div className="py-8">
                <Heading title="My Products" subtitle="Your auction listings" />
                <p className="text-red-500">{error}</p>
            </div>
        </Container>
    );

    return (
        <Container>
            <div className="py-8">
                <Heading title="My Products" subtitle="Your auction listings" />
                
                {allProducts.length === 0 ? (
                    <div className="mt-8 text-center">
                        <p className="text-gray-500 mb-4">You haven't listed any products yet.</p>
                        <button 
                            onClick={() => navigate('/create-product')}
                            className="bg-primary text-white px-6 py-2 rounded-full hover:bg-blue-600"
                        >
                            Create Your First Listing
                        </button>
                    </div>
                ) : (
                    <div className="space-y-12 mt-8">
                        {/* Ongoing Auctions Section */}
                        {ongoingProducts.length > 0 && (
                            <div>
                                <div className="flex items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Ongoing Auctions</h2>
                                    <span className="ml-3 bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                        {ongoingProducts.length} active
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {ongoingProducts.map((product) => renderProductCard(product, true))}
                                </div>
                            </div>
                        )}

                        {/* Ended Auctions Section */}
                        {endedProducts.length > 0 && (
                            <div>
                                <div className="flex items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-800">Ended Auctions</h2>
                                    <span className="ml-3 bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                                        {endedProducts.length} ended
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {endedProducts.map((product) => renderProductCard(product, false))}
                                </div>
                            </div>
                        )}

                        {/* Show message if only one section is empty */}
                        {ongoingProducts.length === 0 && endedProducts.length > 0 && (
                            <div className="text-center text-gray-500 mb-8">
                                <p>You have no ongoing auctions. All your listings have ended.</p>
                                <button 
                                    onClick={() => navigate('/create-product')}
                                    className="mt-2 bg-primary text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Create New Listing
                                </button>
                            </div>
                        )}
                        
                        {endedProducts.length === 0 && ongoingProducts.length > 0 && (
                            <div className="text-center text-gray-500">
                                <p>You have no ended auctions yet. Your active listings are shown above.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Container>
    );
};

export default MyProducts; 