import { AiOutlinePropertySafety } from "react-icons/ai";
import { Container, Title, Body, PrimaryButton, Caption, ProfileCard } from "../../components/common/Design";
import { IoSearchOutline } from "react-icons/io5";
import { CiCirclePlus } from "react-icons/ci";
import PropTypes from "prop-types";
import { useState, useRef, useEffect } from "react";
import api from '../../utils/api';

export const User1 = "https://cdn-icons-png.flaticon.com/128/6997/6997662.png";
export const User2 = "https://cdn-icons-png.flaticon.com/128/236/236832.png";
export const User3 = "https://cdn-icons-png.flaticon.com/128/236/236831.png";
export const User4 = "https://cdn-icons-png.flaticon.com/128/1154/1154448.png";

export const Hero = () => {
    return (
    <>
        <section className="hero bg-primary py-0 -mt-[1px]">
            <Container className="flex items-center justify-between md:flex-row flex-col pt-8">
                <div className="w-full md:w-1/2 text-white pr-12">
                    <Title level={3} className="text-white">
                        Browse buy & sell items 
                    </Title>
                    <br/>
                    <SearchBox /> 
                    <div className="flex items-center gap-8 my-8">
                        <div>
                            <Title level={4} className="text-white">
                                300K
                            </Title>
                            <Body className="leading-7 text-gray-200">Total Products</Body>
                        </div>
                        <div>
                            <Title level={4} className="text-white">
                                4.2M
                            </Title>
                            <Body className="leading-7 text-gray-200">Total Bids</Body>
                        </div>
                        <div>
                            <Title level={4} className="text-white">
                                13
                            </Title>
                            <Body className="leading-7 text-gray-200">Total Categories</Body>
                        </div>
                    </div>
                </div>

                <div className="w-full md:w1/2 my-16 relative py-16">
                    <img src="../images/home/hero.webp" alt="" />
                    <div className="horiz-move absolute md:top-28 top-8 left-0">
                        <Box title="Proof of quality" desc="" />
                    </div>
                    <div className="horiz-move absolute bottom-72 right-80">
                        <Box title="Safe and Secure" desc="" />
                    </div>

                    <div className="px-5 py-4 bg-white shadow-md flex items-center gap-5 rounded-xl ml-5 -mt-5  vert-move w-1/2">
                        <Title>100K++ Customers</Title>
                        <div className="flex items-center">
                            <ProfileCard className="border-2 border-white">
                                <img src={User1} alt="" className="w-full h-full object-cover" />
                            </ProfileCard>
                            <ProfileCard className="border-2 border-white -ml-4">
                                <img src={User2} alt="" className="w-full h-full object-cover" />
                            </ProfileCard>
                            <ProfileCard className="border-2 border-white -ml-4">
                                <img src={User3} alt="" className="w-full h-full object-cover" />
                            </ProfileCard>
                            <ProfileCard className="border-2 border-white -ml-4">
                                <img src={User4} alt="" className="w-full h-full object-cover" />
                            </ProfileCard>
                            <ProfileCard className="border-2 border-white -ml-4">
                                <CiCirclePlus size={24} />
                            </ProfileCard>
                        </div>
                    </div>
                </div>
            </Container>
        </section>
        <div className="bg-white w-full py-16 -mt-10 rounded-t-[40px]"></div>
    </>
    );
};

export const SearchBox = () => { 
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const searchDebounce = useRef(null);

    // Handle search input with suggestions
    const handleSearchInput = (value) => {
        setSearchQuery(value);

        // Clear previous timeout
        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current);
        }

        // Debounce suggestions
        searchDebounce.current = setTimeout(async () => {
            if (value.length >= 2) {
                try {
                    const response = await api.get(`/product/suggestions?query=${value}`);
                    setSuggestions(response.data);
                } catch (error) {
                    console.error('Failed to get suggestions:', error);
                    setSuggestions([]);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);
    };

    // Handle search submission
    const handleSearch = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setSuggestions([]); // Clear suggestions when search is submitted

        try {
            // Only pass the search query, no filters
            const queryParams = new URLSearchParams();
            if (searchQuery.trim()) {
                queryParams.append('query', searchQuery.trim());
            }

            // Redirect to search results page with query parameters
            window.location.href = `/search?${queryParams.toString()}`;
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.search-container')) {
                setSuggestions([]);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    return (
        <div className="search-container relative">
            <form onSubmit={handleSearch}>
                <div className="relative">
                    <div className="absolute inset-y-0 start-2 flex items-center p-3 pointer-events-none">
                        <IoSearchOutline color="black" size={25} />
                    </div>
                    <input 
                        id="main-search-input"
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => handleSearchInput(e.target.value)}
                        className="block shadow-md w-full p-6 ps-16 text-sm text-gray-800 rounded-full bg-gray-50 outline-none"
                        placeholder="Search product..."
                    />
                    <div className="absolute end-2.5 bottom-2">
                        <PrimaryButton 
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Searching...' : 'Search'}
                        </PrimaryButton>
                    </div>
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-lg mt-1 z-50">
                        {suggestions.map((suggestion, index) => (
                            <div 
                                key={index}
                                className="p-3 hover:bg-gray-100 cursor-pointer text-gray-800"
                                onClick={() => {
                                    setSearchQuery(suggestion);
                                    setSuggestions([]);
                                }}
                            >
                                {suggestion}
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter Options */}
                {/* {showFilters && (
                    <div className="mt-4 p-4 bg-white rounded-lg shadow-md">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category
                                </label>
                                <select 
                                    value={filters.category}
                                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Categories</option>
                                    <option value="Electronics">Electronics</option>
                                    <option value="Fashion">Fashion</option>
                                    <option value="Home">Home</option>
                                    <option value="Sports">Sports</option>
                                    <option value="Art">Art</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Condition
                                </label>
                                <select 
                                    value={filters.condition}
                                    onChange={(e) => setFilters({...filters, condition: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Any Condition</option>
                                    <option value="New">New</option>
                                    <option value="Used">Used</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Min Price
                                </label>
                                <input 
                                    type="number"
                                    placeholder="Min Price"
                                    value={filters.minPrice}
                                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Price
                                </label>
                                <input 
                                    type="number"
                                    placeholder="Max Price"
                                    value={filters.maxPrice}
                                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                                    className="w-full p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                )} */}
            </form>
        </div>
    );
};

export const Box = ({ title, desc }) => { 
    return (
        <>
            <div className="px-5 py-4 bg-white shadow-md flex items-center gap-5 rounded-xl w-auto">
                <div className="w-14 h-14 bg-green_100 flex items-center justify-center rounded-full">
                <AiOutlinePropertySafety size={27} className="text-primary"/>
                </div>
                <div>
                    <Title>{title}</Title>
                    <Caption>{desc}</Caption>
                </div>
            </div>
        </>
    );
};

Box.propTypes = {
  title: PropTypes.string,
  desc: PropTypes.string
};