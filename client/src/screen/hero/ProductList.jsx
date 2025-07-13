import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { ProductCard } from "../../components/cards/ProductCard";
import { Container, Heading } from "../../components/common/Design";
import API_URL from '../../config/api';

// Helper function to normalize category names
const normalizeCategory = (category) => {
    if (!category) return '';
    return category
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/\s+/g, ' ')
        .trim();
};

export const ProductList = ({ selectedCategory }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const pollingIntervalRef = useRef(null);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/product`);
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch products');
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchProducts();
    }, []);

    // Set up polling for real-time updates
    useEffect(() => {
        // Set up polling every 3 seconds
        pollingIntervalRef.current = setInterval(fetchProducts, 3000);
        
        // Clean up interval on component unmount
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    // Filter products based on selected category
    const filteredProducts = selectedCategory
        ? products.filter(product => normalizeCategory(product.category) === normalizeCategory(selectedCategory))
        : products;

    return (
        <>
            <section className="product-home">
                <Container>
                    <Heading 
                        title={selectedCategory ? `${selectedCategory} Auctions` : "Live Auctions"} 
                        subtitle="Explore our latest auctions"
                    /> 
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 my-8">
                        {filteredProducts.map((item) => (
                            <ProductCard item={item} key={item._id}/>
                        ))}
                    </div>
                </Container>
            </section>
        </>
    );
};