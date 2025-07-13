import PropTypes from "prop-types";   
import { NavLink, useNavigate } from "react-router-dom";
import { ProfileCard, Caption, Title, PrimaryButton } from "../common/Design";
import { RiAuctionFill } from "react-icons/ri";
import { MdOutlineFavorite, MdOutlineFavoriteBorder } from "react-icons/md"; 
import { useAuth } from "../../context/AuthContext";
import { useState, useEffect } from "react";
import axios from "axios";
import API_URL from '../../config/api';

export const ProductCard = ({ item, isWishlisted: initialIsWishlisted, onRemoveFromWishlist }) => {
    console.log('ProductCard received item:', item);
    
    if (!item || !item._id) {
        console.error('ProductCard received invalid item:', item);
        return null;
    }

    const { isLoggedIn, user } = useAuth();
    const navigate = useNavigate();
    const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted || false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn && user) {
            checkWishlistStatus();
        }
    }, [item._id, isLoggedIn, user]);

    const checkWishlistStatus = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/api/wishlist/check/${item._id}`,
                { withCredentials: true }
            );
            console.log('Wishlist status response:', response.data);
            setIsWishlisted(response.data.isWishlisted);
        } catch (error) {
            console.error('Error checking wishlist status:', error);
        }
    };

    const handleWishlistClick = async (e) => {
        console.log('Wishlist button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        if (!isLoggedIn) {
            console.log('User not logged in, redirecting to login');
            navigate('/login');
            return;
        }

        if (isLoading) {
            console.log('Request in progress, skipping');
            return;
        }

        setIsLoading(true);
        try {
            console.log('Current wishlist state:', isWishlisted);
            if (isWishlisted) {
                console.log('Removing from wishlist');
                await axios.delete(
                    `${API_URL}/api/wishlist/${item._id}`,
                    { withCredentials: true }
                );
                setIsWishlisted(false);
                if (onRemoveFromWishlist) {
                    onRemoveFromWishlist(item._id);
                }
            } else {
                console.log('Adding to wishlist');
                await axios.post(
                    `${API_URL}/api/wishlist/${item._id}`,
                    {},
                    { withCredentials: true }
                );
                setIsWishlisted(true);
            }
        } catch (error) {
            console.error('Error updating wishlist:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductClick = (e) => {
        if (!isLoggedIn) {
            e.preventDefault();
            navigate(`/details/${item._id}`);
        }
    };

    // Don't render the card at all if the auction is archived
    if (item.isArchived) {
        return null;
    }

    // Check if current user owns this product
    const isOwnProduct = isLoggedIn && user && item.user && 
        (item.user._id === user._id || item.user === user._id);

    const title = item.title || 'Untitled Product';
    const price = item.price || 0;
    const imageUrl = item?.image?.filePath || "default-image-url.jpg";

    console.log('ProductCard rendering with:', { title, price, imageUrl });

    return (
        <div className="bg-white shadow-s1 rounded-xl p-3 hover:shadow-lg transition-shadow duration-300">
            <div className="relative">
                <NavLink to={`/details/${item._id}`} onClick={handleProductClick}>
                    <div className="h-56 relative overflow-hidden">
                        <img 
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover rounded-xl hover:scale-105 transition-transform duration-300 ease-in-out"
                        />
                        <ProfileCard className="shadow-s1 absolute right-3 bottom-3">
                            <RiAuctionFill size={22} className="text-green"/>
                        </ProfileCard>
                        <div className="absolute top-2 right-2">
                            {item?.isSoldOut ? (
                                <Caption className="text-red-500 bg-white px-3 py-1 text-sm rounded-full">Sold Out</Caption>
                            ) : (
                                <Caption className="text-green bg-white px-3 py-1 text-sm rounded-full">Available</Caption>
                            )}
                        </div>
                    </div>
                    <div className="details mt-4">
                        <Title className="uppercase text-center">
                            {title.length > 30 ? `${title.slice(0, 30)}...` : title}
                        </Title>
                        <hr className="mt-3"/>
                        <div className="flex items-center justify-center py-4">
                            <div className="flex items-center gap-5">
                                <div>
                                    <RiAuctionFill size={40} className="text-green"/>
                                </div>
                                <div>
                                    <Caption className="text-green">Starting Price</Caption>
                                    <Title>${price}</Title>
                                </div>
                            </div>
                        </div>
                        <hr className="mt-3"/>
                    </div>
                </NavLink>

                <div className="flex items-center justify-between mt-3">
                    <NavLink to={`/details/${item._id}`} className="w-full">
                        <PrimaryButton className="rounded-lg text-sm w-full">
                            View Details
                        </PrimaryButton>
                    </NavLink>
                    {!isOwnProduct && (
                        <button
                            type="button"
                            onClick={handleWishlistClick}
                            disabled={isLoading}
                            className={`rounded-lg px-4 py-3 ml-2 transition-colors duration-200 ${
                                isWishlisted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                        >
                            {isWishlisted ? (
                                <MdOutlineFavorite size={20} className="text-white" />
                            ) : (
                                <MdOutlineFavoriteBorder size={20} className="text-gray-600" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

ProductCard.propTypes = {
    item: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string,
        price: PropTypes.number,
        image: PropTypes.shape({
            filePath: PropTypes.string
        }),
        isSoldOut: PropTypes.bool,
        isArchived: PropTypes.bool,
    }).isRequired,
    isWishlisted: PropTypes.bool,
    onRemoveFromWishlist: PropTypes.func
};