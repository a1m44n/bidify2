import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config/api';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true); // Add loading state

    // Check login status when app loads
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                console.log('Checking login status...');
                const response = await axios.get(`${API_URL}/api/users/loggedIn`, {
                    withCredentials: true
                });
                console.log('Login status response:', response.data);
                
                setIsLoggedIn(response.data);
                if (response.data) {
                    console.log('User is logged in, fetching user data...');
                    // If logged in, fetch user data
                    const userResponse = await axios.get(`${API_URL}/api/users/getuser`, {
                        withCredentials: true
                    });
                    console.log('User data:', userResponse.data);
                    setUser(userResponse.data);
                } else {
                    console.log('User is not logged in');
                    setUser(null);
                }
            } catch (error) {
                console.log('Error checking login status:', error);
                setIsLoggedIn(false);
                setUser(null);
            } finally {
                setAuthLoading(false); // Set loading to false when check is complete
            }
        };
        checkLoginStatus();
    }, []);

    const logout = async () => {
        try {
            await axios.get(`${API_URL}/api/users/logout`, {
                withCredentials: true
            });
            setIsLoggedIn(false);
            setUser(null);
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, authLoading, setIsLoggedIn, setUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 