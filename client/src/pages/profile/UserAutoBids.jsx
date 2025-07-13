import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Container, Title } from "../../components/common/Design";
import { useAuth } from "../../context/AuthContext";
import API_URL from '../../config/api';

export const UserAutoBids = () => {
    const { isLoggedIn, user, authLoading } = useAuth();
    const navigate = useNavigate();
    const [autoBids, setAutoBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Wait for authentication check to complete before proceeding
        if (authLoading) {
            return; // Don't do anything while auth is still loading
        }

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }
        
        const fetchAutoBids = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/auto-bid/user`, {
                    withCredentials: true
                });
                
                setAutoBids(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch your auto-bids');
                setLoading(false);
            }
        };

        fetchAutoBids();
    }, [isLoggedIn, authLoading, navigate]);

    const handleDisableAutoBid = async (productId) => {
        try {
            await axios.delete(`${API_URL}/api/auto-bid/${productId}`, { withCredentials: true });
            
            // Remove the disabled auto-bid from the list
            setAutoBids(prevAutoBids => prevAutoBids.filter(bid => bid.product._id !== productId));
        } catch (err) {
            setError('Failed to disable auto-bidding');
        }
    };

    if (loading || authLoading) return <div className="pt-24 px-8">Loading...</div>;
    if (error) return <div className="pt-24 px-8 text-red-500">{error}</div>;

    return (
        <section className="pt-24 px-8">
            <Container>
                <Title level={2}>Your Auto-Bids</Title>
                
                {autoBids.length === 0 ? (
                    <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
                        <p className="text-gray-600">You don't have any active auto-bids.</p>
                        <Link to="/" className="inline-block mt-4 text-primary hover:underline">
                            Browse auctions
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {autoBids.map((autoBid) => (
                            <div key={autoBid._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                <div className="h-48 overflow-hidden">
                                    <img 
                                        src={autoBid.product.image?.filePath || "/placeholder-image.jpg"} 
                                        alt={autoBid.product.title} 
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold mb-2 truncate">
                                        <Link to={`/product/${autoBid.product._id}`} className="text-primary hover:underline">
                                            {autoBid.product.title}
                                        </Link>
                                    </h3>
                                    
                                    <div className="flex justify-between mb-4">
                                        <span className="text-gray-600">Maximum Bid:</span>
                                        <span className="font-semibold">${autoBid.maxBidAmount.toFixed(2)}</span>
                                    </div>
                                    
                                    <div className="flex justify-between mb-4">
                                        <span className="text-gray-600">Auction Ends:</span>
                                        <span className="font-semibold">
                                            {new Date(autoBid.product.auctionEndTime).toLocaleDateString()}
                                        </span>
                                    </div>
                                    
                                    <div className="flex space-x-2">
                                        <Link 
                                            to={`/product/${autoBid.product._id}`}
                                            className="flex-1 bg-primary text-white text-center py-2 px-4 rounded-md hover:bg-primary-dark"
                                        >
                                            View Auction
                                        </Link>
                                        <button
                                            onClick={() => handleDisableAutoBid(autoBid.product._id)}
                                            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                                        >
                                            Disable
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Container>
        </section>
    );
};

export default UserAutoBids; 