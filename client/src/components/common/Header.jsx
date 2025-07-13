
import { Container, CustomNavLinkList } from "./Design"
import { IoSearchOutline } from "react-icons/io5";
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import API_URL from '../../config/api';

export const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const location = useLocation();
    const navigate = useNavigate();
    const { isLoggedIn, user, logout } = useAuth();
  
    const menuRef = useRef(null);
  
    const toggleMenu = () => {
      setIsOpen(!isOpen);
    };
  
    const closeMenuOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
  
    useEffect(() => {
      document.addEventListener("mousedown", closeMenuOutside);
      window.addEventListener("scroll", handleScroll);
  
      return () => {
        document.removeEventListener("mousedown", closeMenuOutside);
        window.removeEventListener("scroll", handleScroll);
      };
    }, []);

    // Fetch unread messages count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!isLoggedIn) return;
            
            try {
                const response = await axios.get(`${API_URL}/api/messages/unread/count`, {
                    withCredentials: true
                });
                setUnreadCount(response.data.count);
            } catch (err) {
                console.error("Failed to fetch unread messages count:", err);
            }
        };

        fetchUnreadCount();
        
        // Set up interval to check for new messages (every 30 seconds)
        const intervalId = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(intervalId);
    }, [isLoggedIn]);

    // Reset unread count when navigating to inbox
    useEffect(() => {
        if (location.pathname === '/inbox') {
            setUnreadCount(0);
        }
    }, [location.pathname]);
  
    // Check if it's the home page
    const isHomePage = location.pathname === "/";

    // Check if we're on a product details page
    const isProductDetailsPage = location.pathname.startsWith('/details/');
    const productId = isProductDetailsPage ? location.pathname.split('/')[2] : null;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleQuickEnd = async () => {
        if (!productId) return;

        try {
            // Set auction to end in 20 seconds from now
            const newEndTime = new Date(Date.now() + 20000); // current time + 20 seconds
            
            await axios.post(
                `/api/product/update-end-time/${productId}`,
                { auctionEndTime: newEndTime.toISOString() },
                { withCredentials: true }
            );

            // Refresh the page to see the updated timer
            window.location.reload();
        } catch (err) {
            console.error('Failed to update auction time:', err);
        }
    };

    const handleSearchClick = () => {
        // Navigate to home page if not already there
        if (location.pathname !== '/') {
            navigate('/');
            // Add a small delay to ensure the page loads before scrolling
            setTimeout(() => {
                scrollToSearchBar();
            }, 100);
        } else {
            scrollToSearchBar();
        }
    };

    const scrollToSearchBar = () => {
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) {
            // Scroll to the search bar smoothly
            searchInput.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            // Focus on the input field after scrolling
            setTimeout(() => {
                searchInput.focus();
            }, 500);
        }
    };

    console.log('Auth State:', { isLoggedIn, user });

    return (
        <>
            <header className={isHomePage   ? `header py-1 bg-primary ${isScrolled ? "scrolled": ""}` : `header bg-white shadow-s1 ${isScrolled ? "scrolled" : ""}`}>
                <Container>
                    <nav className="p-4 flex justify-between items-center relative">
                        <div className="flex items-center gap-14">
                            {/* <div>
                                {isHomePage && !isScrolled ?  (
                                    <img src="../images/common/header-logo.png" alt="LogoImg" className="h-11" />
                                ) : (
                                  <img src="../images/common/header-logo2.png" alt="LogoImg" className="h-11" />
                                )}
                            </div> */}

                            <div className="hidden lg:flex items-center justify-between gap-8">
                                {isLoggedIn ? (
                                    // Navigation for logged-in users
                                    <>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/" isActive={location.pathname === "/"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                                Home
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/profile" isActive={location.pathname === "/profile"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                                Profile
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/inbox" isActive={location.pathname === "/inbox"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"} relative`}>
                                                Inbox
                                                {unreadCount > 0 && (
                                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                        {unreadCount > 9 ? '9+' : unreadCount}
                                                    </span>
                                                )}
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/my-products" isActive={location.pathname === "/my-products"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                                My Products
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/telegram-settings" isActive={location.pathname === "/telegram-settings"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                                Telegram
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="capitalize list-none">
                                            <CustomNavLinkList href="/wishlist" isActive={location.pathname === "/wishlist"} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                                Wishlist
                                            </CustomNavLinkList>
                                        </li>
                                    </>
                                ) : (
                                    // No navigation for logged-out users
                                    null
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-8 icons">
                            <div className="hidden lg:flex lg:items-center lg:gap-8 text-white">
                                <button 
                                    onClick={handleSearchClick}
                                    className="hover:opacity-70 transition-opacity cursor-pointer"
                                    aria-label="Search"
                                >
                                    <IoSearchOutline size={23} className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}/>
                                </button>  
                                
                                {/* Show Quick End button only on product details page */}
                                {isProductDetailsPage && (
                                    <button
                                        onClick={handleQuickEnd}
                                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2"
                                    >
                                        <span>⚡</span> Quick End (20s)
                                    </button>
                                )}
                                
                                {isLoggedIn ? (
                                    <>
                                        <span className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                            Welcome, {user?.username}
                                        </span>
                                        <button
                                            onClick={() => navigate('/create-product')}
                                            className={`${isScrolled || !isHomePage ? "bg-primary text-white" : "bg-white text-primary"} px-8 py-2 rounded-full shadow-md`}
                                        >
                                            Sell
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className={`${isScrolled || !isHomePage ? "bg-red-500" : "bg-red-500"} text-white px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2`}
                                        >
                                            <span>🚪</span> Logout
                                        </button>
                                    </>
                                ) : (
                                    <>
                                <CustomNavLinkList href="/login" className={`${isScrolled || !isHomePage ? "text-black" : "text-white"}`}>
                                    Sign In
                                </CustomNavLinkList>
                                <CustomNavLinkList href="/register" className={`${isScrolled || !isHomePage ? "bg-primary" : "bg-white text-primary"} px-8 py-2 rounded-full shadow-md`}>
                                    Join
                                </CustomNavLinkList>
                                    </>
                                )}
                            </div>
                            <div className={`icon flex items-center justify-center gap-6 ${isScrolled || !isHomePage ? "text-primary" : "text-white"}`}>
                                <button onClick={toggleMenu} className="lg:hidden w-10 h-10 flex justify-center items-center bg-black text-white focus:outline-none">
                                    {isOpen ? <AiOutlineClose size={24} /> : <AiOutlineMenu size={24} />}
                                </button>
                            </div>
                        </div>

                        <div ref={menuRef} className={`lg:flex lg:items-center lg:w-auto w-full p-5 absolute right-0 top-full menu-container ${isOpen ? "open" : "closed" }`}>
                                {isLoggedIn ? (
                                    // Mobile navigation for logged-in users
                                    <>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/" className="text-white">
                                                Home
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/profile" className="text-white">
                                                Profile
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/inbox" className="text-white">
                                                Inbox
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/my-products" className="text-white">
                                                My Products
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/telegram-settings" className="text-white">
                                                Telegram
                                            </CustomNavLinkList>
                                        </li>
                                        <li className="uppercase list-none">
                                            <CustomNavLinkList href="/wishlist" className="text-white">
                                                Wishlist
                                            </CustomNavLinkList>
                                        </li>
                                    </>
                                ) : (
                                    // No mobile navigation for logged-out users
                                    null
                                )}
                            </div>
                    </nav>
                </Container>
            </header>
        </>
    );
};