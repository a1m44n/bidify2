import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Title, Caption, Body, commonClassNameOfInput } from "../../components/common/Design";
import { IoIosStar, IoIosStarOutline } from "react-icons/io";
import { AiOutlinePlus } from "react-icons/ai"; 
import { FiInfo } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import './ProductDetails.css';
import API_URL from '../../config/api';

// Update the tooltip content to use a table format
const IncrementRulesTable = () => (
    <div className="min-w-[300px]">
        <div className="font-semibold mb-2">Minimum Bid Increment Rules</div>
        <table className="w-full text-left">
            <thead>
                <tr className="border-b border-gray-600">
                    <th className="py-1 pr-4">Current Bid Range</th>
                    <th className="py-1">Minimum Increment</th>
                </tr>
            </thead>
            <tbody>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$0 – $99</td>
                    <td className="py-1">$1</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$100 – $499</td>
                    <td className="py-1">$5</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$500 – $999</td>
                    <td className="py-1">$10</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$1,000 – $4,999</td>
                    <td className="py-1">$25</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$5,000 – $9,999</td>
                    <td className="py-1">$50</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$10,000 – $19,999</td>
                    <td className="py-1">$100</td>
                </tr>
                <tr className="border-b border-gray-700">
                    <td className="py-1 pr-4">$20,000 – $49,999</td>
                    <td className="py-1">$250</td>
                </tr>
                <tr>
                    <td className="py-1 pr-4">$50,000 and above</td>
                    <td className="py-1">$500</td>
                </tr>
            </tbody>
        </table>
    </div>
);

export const ProductDetails = () => {
    const { id } = useParams();
    const { isLoggedIn, user, authLoading } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("description");
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [isExpired, setIsExpired] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [bidError, setBidError] = useState('');
    const [bidSuccess, setBidSuccess] = useState('');
    const [highestBid, setHighestBid] = useState(null);
    const pollingIntervalRef = useRef(null);
    const [lastBidCount, setLastBidCount] = useState(0);
    const [suggestedPrice, setSuggestedPrice] = useState(null);
    const [loadingSuggestion, setLoadingSuggestion] = useState(false);
    const [showSuggestion, setShowSuggestion] = useState(false);
    // Auto-bidding state
    const [autoBidEnabled, setAutoBidEnabled] = useState(false);
    const [showAutoBidForm, setShowAutoBidForm] = useState(false);
    const [maxBidAmount, setMaxBidAmount] = useState('');
    const [autoBidError, setAutoBidError] = useState('');
    const [autoBidSuccess, setAutoBidSuccess] = useState('');
    const [userAutoBid, setUserAutoBid] = useState(null);
    const [loadingAutoBid, setLoadingAutoBid] = useState(false);
    // Add state to track new bid entries for animation
    const [newBidIds, setNewBidIds] = useState(new Set());

    useEffect(() => {
        // Wait for authentication check to complete before proceeding
        if (authLoading) {
            return; // Don't do anything while auth is still loading
        }

        if (!isLoggedIn) {
            setLoading(false);
            setError('authentication_required');
            return;
        }

        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/product/${id}`, {
                    withCredentials: true
                });
                
                const fetchedProduct = response.data;
                
                // Check if the auction has ended but isn't archived yet
                const now = new Date().getTime();
                const end = new Date(fetchedProduct.auctionEndTime).getTime();
                if (end < now && !fetchedProduct.isArchived) {
                    await archiveProduct();
                } else {
                    setProduct(fetchedProduct);
                }
                
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch product details');
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, isLoggedIn, authLoading, navigate]);

    const archiveProduct = async () => {
        try {
            const response = await axios.patch(
                `${API_URL}/api/product/${id}/archive`,
                {},
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            if (response.data.product) {
                setProduct(response.data.product);
                setIsExpired(true);
                
                // Refresh bidding history to get the latest data
                fetchBiddingHistory();
            }
        } catch (err) {
            console.error('Failed to archive product:', err);
        }
    };

    useEffect(() => {
        if (product?.auctionEndTime) {
            const checkAndUpdateAuctionStatus = async () => {
                const now = new Date().getTime();
                const end = new Date(product.auctionEndTime).getTime();
                const distance = end - now;

                if (distance < 0) {
                    setIsExpired(true);
                    
                    // Only call archive if it's not already archived
                    if (!product.isArchived) {
                        // Instead of calling archive directly, just refresh the product data
                        const response = await axios.get(`${API_URL}/api/product/${id}`, {
                            withCredentials: true
                        });
                        setProduct(response.data);
                    }
                    return true;
                }

                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((distance % (1000 * 60)) / 1000)
                });

                return false;
            };

            // Check immediately and set up timer
            checkAndUpdateAuctionStatus();
            const timer = setInterval(checkAndUpdateAuctionStatus, 1000);
            return () => clearInterval(timer);
        }
    }, [product?.auctionEndTime, id, product?.isArchived]);

    const handleTabClick = tab => {
        setActiveTab(tab);
    }

    const renderAuctionStatus = () => {
        if (isExpired || product.isArchived) {
            return (
                <div>
                    <div className="text-red-500 font-bold mb-4">Auction has ended</div>
                    {(product.soldTo || (biddingHistory && biddingHistory.length > 0)) ? (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <p className="text-green-800 font-semibold">
                                Winner: @{product.soldTo ? product.soldTo.username : (highestBid ? highestBid.user.username : 'Unknown')}
                            </p>
                            <p className="text-green-700 mt-2">
                                Winning Bid: ${product.soldPrice ? product.soldPrice.toFixed(2) : (highestBid ? highestBid.price.toFixed(2) : '0.00')}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <p className="text-yellow-700">
                                No bids were placed on this auction
                            </p>
                        </div>
                    )}
                </div>
            );
        }
        return (
            <div className="flex gap-8 text-center">
                <div className="p-5 px-10 shadow-s1">
                    <Title level={4}>{timeLeft.days}</Title>
                    <Caption>Days</Caption>
                </div>
                <div className="p-5 px-10 shadow-s1">
                    <Title level={4}>{timeLeft.hours}</Title>
                    <Caption>Hours</Caption>
                </div>
                <div className="p-5 px-10 shadow-s1">
                    <Title level={4}>{timeLeft.minutes}</Title>
                    <Caption>Minutes</Caption>
                </div>
                <div className="p-5 px-10 shadow-s1">
                    <Title level={4}>{timeLeft.seconds}</Title>
                    <Caption>Seconds</Caption>
                </div>
            </div>
        );
    };

    // Add a function to get the minimum increment text
    const getMinIncrementText = (currentPrice) => {
        if (currentPrice < 100) return "$1";
        if (currentPrice < 500) return "$5";
        if (currentPrice < 1000) return "$10";
        if (currentPrice < 5000) return "$25";
        if (currentPrice < 10000) return "$50";
        if (currentPrice < 20000) return "$100";
        if (currentPrice < 50000) return "$250";
        return "$500";
    };

    const handleBidSubmit = async (e) => {
        e.preventDefault();
        setBidError('');
        setBidSuccess('');

        try {
            await axios.post(`${API_URL}/api/bidding/place-bid`, 
                { productId: id, price: parseFloat(bidAmount) },
                { withCredentials: true }
            );
            
            setBidSuccess('Your bid has been placed successfully!');
            setBidAmount(''); // Clear the bid input field
            
            // Fetch updated bidding history to reflect the new bid
            fetchBiddingHistory();
        } catch (err) {
            setBidError(err.response?.data?.message || 'Failed to place bid');
        }
    };

    // Handle auto-bid form submission
    const handleAutoBidSubmit = async (e) => {
        e.preventDefault();
        setAutoBidError('');
        setAutoBidSuccess('');

        if (!maxBidAmount || parseFloat(maxBidAmount) <= 0) {
            setAutoBidError('Please enter a valid maximum bid amount');
            return;
        }

        try {
            const response = await axios.post(
                `${API_URL}/api/auto-bid`, 
                { 
                    productId: id, 
                    maxBidAmount: parseFloat(maxBidAmount)
                },
                { withCredentials: true }
            );
            
            setAutoBidSuccess('Auto-bidding has been set up successfully!');
            setShowAutoBidForm(false);
            setAutoBidEnabled(true);
            setUserAutoBid(response.data.autoBid);
            
            // If the current highest bid is by someone else and lower than our max,
            // our auto-bid will be triggered, so refresh the bidding history
            fetchBiddingHistory();
        } catch (err) {
            setAutoBidError(err.response?.data?.message || 'Failed to set up auto-bidding');
        }
    };

    // Disable auto-bidding
    const handleDisableAutoBid = async () => {
        try {
            await axios.delete(`${API_URL}/api/auto-bid/${id}`, { withCredentials: true });
            setAutoBidEnabled(false);
            setUserAutoBid(null);
            setAutoBidSuccess('Auto-bidding has been disabled');
        } catch (err) {
            setAutoBidError('Failed to disable auto-bidding');
        }
    };

    const [biddingHistory, setBiddingHistory] = useState([]);

    const fetchBiddingHistory = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/bidding/${id}`);
            console.log("Bidding history response:", response.data);
            
            // Check for new bids to animate
            if (biddingHistory.length > 0 && response.data.length > biddingHistory.length) {
                // Find new bid ids that weren't in the previous biddingHistory
                const existingIds = new Set(biddingHistory.map(bid => bid._id));
                const newIds = response.data
                    .filter(bid => !existingIds.has(bid._id))
                    .map(bid => bid._id);
                
                // Update new bid ids for animation
                setNewBidIds(new Set(newIds));
                
                // Clear animation flags after animation completes (600ms)
                setTimeout(() => {
                    setNewBidIds(new Set());
                }, 600);
            }
            
            setBiddingHistory(response.data);
            
            // Find the highest bid from the history
            if (response.data && response.data.length > 0) {
                // Sort by price in descending order to get the highest bid first
                const sortedBids = [...response.data].sort((a, b) => b.price - a.price);
                setHighestBid(sortedBids[0]);
                
                // Check if there are new bids
                if (response.data.length !== lastBidCount) {
                    setLastBidCount(response.data.length);
                    
                    // If this isn't the initial load and there are new bids, show notification
                    if (lastBidCount > 0) {
                        // You could add a notification or sound here
                        console.log("New bid received!");
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch bidding history:', err);
        }
    };

    // Fetch user's auto-bid for this product
    const fetchUserAutoBid = async () => {
        if (!isLoggedIn || !id) return;
        
        setLoadingAutoBid(true);
        try {
            const response = await axios.get(`${API_URL}/api/auto-bid/product/${id}`, {
                withCredentials: true
            });
            
            if (response.data) {
                setUserAutoBid(response.data);
                setAutoBidEnabled(response.data.isActive);
                setMaxBidAmount(response.data.maxBidAmount);
            }
        } catch (err) {
            // If it's a 404, it means no auto-bid exists yet, which is normal
            if (err.response?.status === 404) {
                setUserAutoBid(null);
                setAutoBidEnabled(false);
                setMaxBidAmount('');
            } else {
                console.error('Failed to fetch auto-bid settings:', err);
                setAutoBidError('Failed to fetch auto-bid settings. Please try again.');
            }
        } finally {
            setLoadingAutoBid(false);
        }
    };

    // Initial fetch of bidding history
    useEffect(() => {
        fetchBiddingHistory();
        fetchUserAutoBid();
    }, [id, isLoggedIn]);

    // Set up polling for real-time updates
    useEffect(() => {
        // Skip if product is archived or sold
        if (product?.isArchived || product?.isSoldOut) {
            return;
        }
        
        // Set up polling every 3 seconds
        pollingIntervalRef.current = setInterval(fetchBiddingHistory, 3000);
        
        // Clean up interval on component unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [id, product?.isArchived, product?.isSoldOut]);

    // Additional cleanup for polling when the auction ends
    useEffect(() => {
        if (isExpired || product?.isArchived || product?.isSoldOut) {
            // Clear the polling interval if it exists
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        }
    }, [isExpired, product?.isArchived, product?.isSoldOut]);

    // Function to fetch price suggestion
    const fetchPriceSuggestion = async () => {
        if (!product) return;
        
        setLoadingSuggestion(true);
        try {
            const response = await axios.get(`${API_URL}/api/suggestion/price`, {
                params: {
                    productTitle: product.title,
                    category: product.category,
                    condition: product.condition.toLowerCase() // Add condition parameter
                }
            });
            
            if (response.data.success) {
                setSuggestedPrice(response.data.suggestion);
            } else {
                console.error("Failed to get price suggestion:", response.data.message);
            }
        } catch (err) {
            console.error("Error fetching price suggestion:", err);
        } finally {
            setLoadingSuggestion(false);
        }
    };
    
    // Update the renderPriceSuggestion function to include reasoning
    const renderPriceSuggestion = () => {
        if (!showSuggestion) {
            return (
                <button
                    onClick={() => {
                        setShowSuggestion(true);
                        fetchPriceSuggestion();
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
                >
                    <span>💡</span> Get suggested price
                </button>
            );
        }
        
        if (loadingSuggestion) {
            return <p className="mt-4 text-gray-600">Loading price suggestions...</p>;
        }
        
        if (!suggestedPrice) {
            return <p className="mt-4 text-gray-600">Could not find similar items to suggest a price.</p>;
        }
        
        return (
            <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Price Suggestion</h4>
                <p className="text-gray-700 mb-1">Based on similar <span className="font-medium text-blue-800">{product.condition.toUpperCase()}</span> items found online:</p>
                
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Price Range:</span>
                    <span className="font-medium">${suggestedPrice.priceRange.min} - ${suggestedPrice.priceRange.max}</span>
                </div>
                
                <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Average Price:</span>
                    <span className="font-medium">${suggestedPrice.averagePrice}</span>
                </div>
                
                <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Median Price:</span>
                    <span className="font-medium">${suggestedPrice.medianPrice}</span>
                </div>
                
                <div className="bg-green-100 p-3 rounded-md mb-4">
                    <div className="flex justify-between font-semibold">
                        <span className="text-green-700">Recommended Bid:</span>
                        <span className="text-green-700">${suggestedPrice.recommendedBid}</span>
                    </div>
                    {suggestedPrice.reasoning && (
                        <p className="text-sm text-green-700 mt-1 italic">{suggestedPrice.reasoning}</p>
                    )}
                    <button
                        onClick={() => setBidAmount(suggestedPrice.recommendedBid)}
                        className="mt-2 w-full bg-green-600 text-white py-1 px-2 rounded-md hover:bg-green-700 text-sm"
                    >
                        Use this amount
                    </button>
                </div>

                {/* Similar Items Section */}
                <div className="mt-4">
                    <h5 className="font-semibold text-blue-800 mb-2">Similar Items Found Online</h5>
                    <div className="max-h-60 overflow-y-auto border rounded-md">
                        {suggestedPrice.items && suggestedPrice.items.map((item, index) => (
                            <div key={index} className="p-2 border-b hover:bg-blue-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs bg-gray-200 px-1 rounded">{item.source}</span>
                                    {item.condition && (
                                        <span className={`text-xs px-1 rounded ${item.condition === 'NEW' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                                            {item.condition}
                                        </span>
                                    )}
                                    <a 
                                        href={item.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-blue-600 hover:text-blue-800 hover:underline truncate max-w-[200px]"
                                    >
                                        {item.title || 'Similar Item'}
                                    </a>
                                </div>
                                <span className="font-medium">${item.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Click on any item to view the original listing</p>
                </div>
                
                <button
                    onClick={() => setShowSuggestion(false)}
                    className="mt-3 text-gray-500 hover:text-gray-700 text-sm"
                >
                    Hide suggestions
                </button>
            </div>
        );
    };

    // Update the renderBiddingSection function to include the price suggestion
    const renderBiddingSection = () => {
        if (product.isArchived || product.isSoldOut) {
            return <div className="text-red-500">This auction has ended</div>;
        }

        // Check if current user is the seller
        if (user && product.user === user._id) {
            return (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-yellow-700 font-medium">You are the seller of this item</p>
                        <p className="text-yellow-600 mt-2">You cannot bid on your own items</p>
                    </div>

                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Bidding History</h3>
                        {biddingHistory && biddingHistory.length > 0 ? (
                            <div className="space-y-2 bidding-history-container">
                                {biddingHistory.map((bid) => (
                                    <div 
                                        key={bid._id || Math.random()} 
                                        className={`flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 bid-entry ${newBidIds.has(bid._id) ? 'new-bid' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700">
                                                {bid.user && bid.user.username ? `@${bid.user.username}` : '@Unknown User'}
                                            </span>
                                            <span className="text-primary">
                                                bid ${typeof bid.price === 'number' ? bid.price.toFixed(2) : '0.00'}
                                            </span>
                                            {bid.isAutoBid && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    Auto-bid
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {bid.createdAt ? new Date(bid.createdAt).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : 'No date'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No bids yet</p>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                {renderPriceSuggestion()}
                {renderAutoBidding()}
                
                <form onSubmit={handleBidSubmit} className="mt-4">
                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-gray-700 text-sm font-bold">
                                Your Bid Amount ($)
                            </label>
                            <div className="flex items-center gap-1">
                                <span className="text-sm text-gray-600">
                                    Minimum increment: {getMinIncrementText(highestBid ? highestBid.price : product.price)}
                                </span>
                                <div className="relative group">
                                    <FiInfo className="text-gray-400 hover:text-gray-600 cursor-help w-4 h-4" />
                                    <div className="absolute right-0 p-3 mt-2 text-sm bg-gray-800 text-white rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                                        <IncrementRulesTable />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            onWheel={(e) => e.target.blur()}
                            min={highestBid ? highestBid.price + 0.01 : product.price}
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            Current {highestBid ? "highest bid" : "starting price"}: ${(highestBid ? highestBid.price : product.price).toFixed(2)}
                        </p>
                    </div>
                    {bidError && (
                        <div className="text-red-500 mb-4">{bidError}</div>
                    )}
                    {bidSuccess && (
                        <div className="text-green-500 mb-4">{bidSuccess}</div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Place Bid
                    </button>
                </form>

                <div className="mt-8">
                    <h3 className="text-lg font-bold mb-4">Bidding History</h3>
                    {biddingHistory && biddingHistory.length > 0 ? (
                        <div className="space-y-2 bidding-history-container">
                            {biddingHistory.map((bid) => (
                                <div 
                                    key={bid._id || Math.random()} 
                                    className={`flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 bid-entry ${newBidIds.has(bid._id) ? 'new-bid' : ''}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700">
                                            {bid.user && bid.user.username ? `@${bid.user.username}` : '@Unknown User'}
                                        </span>
                                        <span className="text-primary">
                                            bid ${typeof bid.price === 'number' ? bid.price.toFixed(2) : '0.00'}
                                        </span>
                                        {bid.isAutoBid && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                Auto-bid
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {bid.createdAt ? new Date(bid.createdAt).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: true
                                        }) : 'No date'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No bids yet</p>
                    )}
                </div>
            </div>
        );
    };

    // Auto-bidding section
    const renderAutoBidding = () => {
        if (user && product.user === user._id) {
            return (
                <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                    <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-yellow-700 font-medium">You are the seller of this item</p>
                        <p className="text-yellow-600 mt-2">You cannot bid on your own items</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="mt-8">
                <h4 className="text-lg font-semibold mb-3">Auto-Bidding Settings</h4>
                {autoBidEnabled ? (
                    <>
                        <div className="p-4 bg-green-50 rounded-md border border-green-200">
                            <div className="flex justify-between mb-4">
                                <span className="text-gray-600">Maximum Bid:</span>
                                <span className="font-medium">${userAutoBid?.maxBidAmount.toFixed(2)}</span>
                            </div>
                            <p className="text-sm text-green-700 mb-4">
                                Auto-bidding is enabled. The system will automatically place bids on your behalf using the tiered increment system.
                            </p>
                            <button
                                onClick={handleDisableAutoBid}
                                className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                            >
                                Disable Auto-Bidding
                            </button>
                        </div>
                    </>
                ) : showAutoBidForm ? (
                    <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
                        <form onSubmit={handleAutoBidSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Maximum Bid Amount ($)
                                </label>
                                <input
                                    type="number"
                                    value={maxBidAmount}
                                    onChange={(e) => setMaxBidAmount(e.target.value)}
                                    onWheel={(e) => e.target.blur()}
                                    min={highestBid ? highestBid.price + 0.01 : product.price}
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                                    required
                                />
                            </div>
                            {autoBidError && (
                                <div className="text-red-500 mb-4">{autoBidError}</div>
                            )}
                            {autoBidSuccess && (
                                <div className="text-green-500 mb-4">{autoBidSuccess}</div>
                            )}
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
                                >
                                    Enable Auto-Bidding
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAutoBidForm(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                        <p className="text-gray-700 mb-3">
                            Enable auto-bidding to have the system automatically place bids on your behalf up to a maximum amount using the tiered increment system.
                        </p>
                        <button
                            onClick={() => setShowAutoBidForm(true)}
                            className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
                        >
                            Set Up Auto-Bidding
                        </button>
                    </div>
                )}
            </div>
        );
    };

    if (loading || authLoading) return <div>Loading...</div>;
    if (error === 'authentication_required') {
        return (
            <section className="pt-24 px-8">
                <Container>
                    <div className="bg-white shadow-lg rounded-lg p-8 max-w-2xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Please Log In First</h2>
                        <p className="text-gray-600 mb-6">
                            You need to be logged in to view product details and place bids.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button 
                                onClick={() => navigate('/login')}
                                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/register')}
                                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
                            >
                                Register
                            </button>
                        </div>
                    </div>
                </Container>
            </section>
        );
    }
    if (error) return <div>{error}</div>;
    if (!product) return <div>Product not found</div>;

    return (
        <>
        <section className="pt-24 px-8">
            <Container>
                <div className="flex justify-between gap-8">
                    <div className="w-1/2">
                        <div className="h-[70vh]">
                            <img 
                                src={product?.image?.filePath || "default-image-url.jpg"} 
                                alt={product.title} 
                                className="w-full h-full object-cover rounded-xl"
                            />
                        </div>
                    </div>
                    <div className="w-1/2">
                        <Title level={2} className="capitalize">
                            {product.title}
                        </Title>
                        {/* <div className="flex gap-5">
                            <div className="flex text-green">
                                <IoIosStar size={20} />
                                <IoIosStar size={20} />
                                <IoIosStar size={20} />
                                <IoIosStar size={20} />
                                <IoIosStarOutline size={20} />
                            </div>
                            <Caption>(2 customer reviews)</Caption>
                        </div> */}
                        <br />
                        <Body>
                            {product.description}
                        </Body>
                        <br />
                        <Caption>
                            Item Condition: {product.condition}
                        </Caption>
                        <br />
                        <Caption>
                            Status: {product.isSoldOut ? 'Sold Out' : 'Available'}
                        </Caption>
                        <br />
                        <Caption>
                            Listed By: @{product.user?.username || 'Unknown'}
                        </Caption>
                        <br />
                        <Caption>
                            Category: {product.category || 'Uncategorized'}
                        </Caption>
                        <br />
                        <Caption>
                            Time Left: 
                        </Caption>
                        <br />
                        {renderAuctionStatus()}
                        <br />
                        <Title className="flex items-center gap-2">
                            Auction Ends:
                            <Caption>
                                {new Date(product.auctionEndTime).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </Caption>
                        </Title>
                        <Title className="flex items-center gap-2">
                            Starting Price:
                            <Caption>${product.price}</Caption>
                        </Title>
                        <Title className="flex items-center gap-2">
                            Current Bid:
                            <Caption>
                                {highestBid ? `$${highestBid.price.toFixed(2)}` : `$${product.price.toFixed(2)} (Starting Price)`}
                            </Caption>
                        </Title>
                        {renderBiddingSection()}
                    </div>
                </div>
                <div className="details mt-8">
                    <div className="flex items-center gap-5">
                        <button 
                            className={`rounded-md px-10 py-4 text-black shadow-s3 ${activeTab === "description" ? "bg-green text-white" : "bg-white"}`}
                            onClick={() => handleTabClick("description")}
                        >
                            Description
                                </button>
                        {/* <button 
                            className={`rounded-md px-10 py-4 text-black shadow-s3 ${activeTab === "auction-history" ? "bg-green text-white" : "bg-white"}`}
                            onClick={() => handleTabClick("auction-history")}
                        >
                            Auction History
                        </button> */}
                        {/* <button 
                            className={`rounded-md px-10 py-4 text-black shadow-s3 ${activeTab === "more-products" ? "bg-green text-white" : "bg-white"}`}
                            onClick={() => handleTabClick("more-products")}
                        >
                            More Products
                        </button> */}
                    </div>
                    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                        {activeTab === "description" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Product Description</h3>
                                <p>{product.description}</p>

                                <div className="mt-4">
                                    <h4 className="text-lg font-semibold mb-2">Specifications</h4>
                                    <ul className="list-disc pl-5">
                                        {product.height && <li>Height: {product.height} cm</li>}
                                        {product.widthPic && <li>Width: {product.widthPic} cm</li>}
                                        {product.lengthPic && <li>Length: {product.lengthPic} cm</li>}
                                        {product.mediumUsed && <li>Medium: {product.mediumUsed}</li>}
                                        {product.weight && <li>Weight: {product.weight} kg</li>}
                                    </ul>
                                </div>
                        </div>
                    )}
                        {activeTab === "auction-history" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">Auction History</h3>
                                {biddingHistory && biddingHistory.length > 0 ? (
                                    <div className="space-y-2 bidding-history-container">
                                        {biddingHistory.map((bid) => (
                                            <div 
                                                key={bid._id || Math.random()} 
                                                className={`flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 bid-entry ${newBidIds.has(bid._id) ? 'new-bid' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-700">
                                                        {bid.user && bid.user.username ? `@${bid.user.username}` : '@Unknown User'}
                                                    </span>
                                                    <span className="text-primary">
                                                        bid ${typeof bid.price === 'number' ? bid.price.toFixed(2) : '0.00'}
                                                    </span>
                                                    {bid.isAutoBid && (
                                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                            Auto-bid
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {bid.createdAt ? new Date(bid.createdAt).toLocaleString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    }) : 'No date'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No bids have been placed yet</p>
                                )}

                                {user && !product.isArchived && !product.isSoldOut && product.user !== user._id && (
                                    <div className="mt-8">
                                        <h4 className="text-lg font-semibold mb-3">Auto-Bidding Settings</h4>
                                        {autoBidEnabled ? (
                                            <div className="p-4 bg-green-50 rounded-md border border-green-200">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-gray-600">Maximum Bid:</span>
                                                    <span className="font-medium">${userAutoBid?.maxBidAmount.toFixed(2)}</span>
                                                </div>
                                                <p className="text-sm text-green-700 mb-4">
                                                    Auto-bidding is enabled. The system will automatically place bids on your behalf.
                                                </p>
                                                <button
                                                    onClick={handleDisableAutoBid}
                                                    className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                                                >
                                                    Disable Auto-Bidding
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
                                                <p className="text-gray-700 mb-3">
                                                    Enable auto-bidding to have the system automatically place bids on your behalf up to a maximum amount.
                                                </p>
                                                <button
                                                    onClick={() => setShowAutoBidForm(true)}
                                                    className="bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark"
                                                >
                                                    Set Up Auto-Bidding
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>
                    )}
                        {activeTab === "more-products" && (
                            <div>
                                <h3 className="text-xl font-bold mb-4">More Products from This Seller</h3>
                                <p className="text-gray-500">More products will be displayed here</p>
                        </div>
                    )}
                    </div>
                </div>
            </Container>
        </section>
        </>
    );
};