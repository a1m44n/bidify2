import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Heading } from "../../components/common/Design";
import { CategoryCard } from "../../components/cards/CategoryCard";
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { FaThLarge } from 'react-icons/fa';

export const CategorySlider = ({ onCategorySelect }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrollPosition, setScrollPosition] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get("/api/category");
                if (res.data && Array.isArray(res.data)) {
                    setCategories(res.data);
                } else {
                    console.warn("Unexpected response format:", res.data);
                    setCategories([]);
                }
            } catch (err) {
                console.error("Error fetching categories:", err);
                setError(err.response?.data?.message || "Failed to fetch categories. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    const scroll = (direction) => {
        const container = document.getElementById('category-container');
        if (container) {
            const scrollAmount = direction === 'left' ? -container.offsetWidth : container.offsetWidth;
            container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setScrollPosition(container.scrollLeft + scrollAmount);
        }
    };

    const handleCategoryClick = (category) => {
        const newCategory = selectedCategory === category.title ? null : category.title;
        setSelectedCategory(newCategory);
        onCategorySelect(newCategory);
    };

    // Special handler for the "All" button
    const handleAllClick = () => {
        setSelectedCategory(null);
        onCategorySelect(null);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
            </div>
        );
    }

    return (
        <div>
            <section className="category-slider pb-16">
                <Container>
                    <div className="relative">
                        <Heading title="Explore Categories" />
                        
                        {/* Left scroll button */}
                        <button 
                            onClick={() => scroll('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 hover:bg-gray-100"
                            style={{ transform: 'translate(-50%, -50%)' }}
                        >
                            <MdChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Category container with horizontal scroll */}
                        <div 
                            id="category-container"
                            className="flex overflow-x-auto scrollbar-hide scroll-smooth py-8 px-4 -mx-4"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {/* All Categories Button */}
                            <div className="flex-none w-[120px] mx-2">
                                <div 
                                    className={`group cursor-pointer text-center ${!selectedCategory ? 'scale-105' : ''}`}
                                    onClick={handleAllClick}
                                >
                                    <div className="flex flex-col items-center justify-center p-4 transition-all duration-300 group-hover:-translate-y-1">
                                        <div className={`w-16 h-16 mb-2 rounded-full flex items-center justify-center ${
                                            !selectedCategory 
                                                ? 'bg-primary/10' 
                                                : 'bg-gray-100 group-hover:bg-primary/10'
                                        }`}>
                                            <FaThLarge className={`w-8 h-8 ${
                                                !selectedCategory 
                                                    ? 'text-primary' 
                                                    : 'text-gray-600 group-hover:text-primary'
                                            }`} />
                                        </div>
                                        <p className={`text-sm font-medium mt-2 ${
                                            !selectedCategory 
                                                ? 'text-primary' 
                                                : 'text-gray-700 group-hover:text-primary'
                                        }`}>
                                            All
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {categories.length > 0 ? (
                                categories.map(item => (
                                    <div key={item._id} className="flex-none w-[120px] mx-2">
                                        <CategoryCard 
                                            item={item} 
                                            isSelected={selectedCategory === item.title}
                                            onClick={() => handleCategoryClick(item)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <div className="w-full text-center text-gray-500 py-8">
                                    No categories available
                                </div>
                            )}
                        </div>

                        {/* Right scroll button */}
                        <button 
                            onClick={() => scroll('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full shadow-lg p-2 hover:bg-gray-100"
                            style={{ transform: 'translate(50%, -50%)' }}
                        >
                            <MdChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </Container>
            </section>
        </div>
    );
};