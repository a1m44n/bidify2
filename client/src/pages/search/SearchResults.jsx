import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Title, Body } from '../../components/common/Design';
import { ProductCard } from '../../components/cards/ProductCard';
import api from '../../utils/api';

const SearchResults = () => {
    const location = useLocation();
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0
    });

    // Get search parameters from URL
    const searchParams = new URLSearchParams(location.search);
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page')) || 1;

    useEffect(() => {
        const fetchResults = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const queryParams = new URLSearchParams();
                if (query) queryParams.append('query', query);
                queryParams.append('page', page);
                queryParams.append('limit', 20);

                const url = `/product/search?${queryParams}`;
                const response = await api.get(url);

                setResults(response.data.products || []);
                setPagination({
                    page: response.data.page || 1,
                    totalPages: response.data.totalPages || 1,
                    total: response.data.total || 0
                });
            } catch (err) {
                let errorMessage = 'Failed to fetch search results. Please try again.';
                
                if (err.response?.status === 500) {
                    errorMessage = `Server error: ${err.response?.data?.message || 'Internal server error'}`;
                } else if (err.response?.status === 404) {
                    errorMessage = 'Search endpoint not found.';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                }
                
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResults();
    }, [query, page]);

    // Handle page change
    const handlePageChange = (newPage) => {
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.set('page', newPage);
        window.location.search = newSearchParams.toString();
    };

    return (
        <Container className="py-8">
            <div className="mb-8">
                <Title level={2}>
                    Search Results
                    {query && <span className="text-gray-600 text-lg ml-2">for "{query}"</span>}
                </Title>
                {pagination.total > 0 && (
                    <Body className="text-gray-600">
                        Found {pagination.total} items
                    </Body>
                )}
            </div>



            {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            ) : error ? (
                <div className="text-center text-red-600 py-8">
                    <div className="text-lg font-semibold mb-2">Search Error</div>
                    <div>{error}</div>
                </div>
            ) : results.length === 0 ? (
                <div className="text-center py-8">
                    <Title level={3} className="text-gray-600">No results found</Title>
                    <Body className="mt-2">Try adjusting your search criteria</Body>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {results.map((product) => {
                            return (
                                <ProductCard
                                    key={product._id}
                                    item={product}
                                    showTimeLeft={true}
                                />
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className={`px-4 py-2 rounded ${
                                    pagination.page === 1
                                        ? 'bg-gray-100 text-gray-400'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-2">
                                {[...Array(pagination.totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-8 h-8 rounded ${
                                            pagination.page === i + 1
                                                ? 'bg-primary text-white'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages}
                                className={`px-4 py-2 rounded ${
                                    pagination.page === pagination.totalPages
                                        ? 'bg-gray-100 text-gray-400'
                                        : 'bg-primary text-white hover:bg-primary-dark'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </Container>
    );
};

export default SearchResults; 