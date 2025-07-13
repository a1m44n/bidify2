import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ProductCard } from '../../components/cards/ProductCard';
import { Container, Heading } from '../../components/common/Design';
import API_URL from '../../config/api';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchWishlist();
  }, [user, navigate]);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/wishlist`, {
        withCredentials: true
      });
      console.log('Raw wishlist response:', response.data);

      // Map the populated product data to match ProductCard expectations
      const mappedItems = response.data.data.map(item => ({
        _id: item.productId._id,
        title: item.productId.title,
        price: item.productId.price,
        image: item.productId.image,
        isSoldOut: item.productId.isSoldOut || false,
        isArchived: item.productId.isArchived || false,
        category: item.productId.category,
        description: item.productId.description,
        auctionEndTime: item.productId.auctionEndTime
      }));

      console.log('Final mapped items:', mappedItems);
      setWishlistItems(mappedItems);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      console.log('Removing product from wishlist:', productId);
      await axios.delete(`${API_URL}/api/wishlist/${productId}`, {
        withCredentials: true
      });
      // Remove item from state
      setWishlistItems(prev => prev.filter(item => item._id !== productId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  if (loading) {
    return (
      <section className="pt-24">
        <Container>
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-24">
      <Container>
        <Heading 
          title="My Wishlist" 
          subtitle="Your favorite auction items"
        />
        
        {!wishlistItems || wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl text-gray-600">Your wishlist is empty</h2>
            <button
              onClick={() => navigate('/')}
              className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 my-8">
            {wishlistItems.map((product) => (
              <ProductCard
                key={product._id}
                item={product}
                isWishlisted={true}
                onRemoveFromWishlist={() => handleRemoveFromWishlist(product._id)}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
};

export default WishlistPage; 