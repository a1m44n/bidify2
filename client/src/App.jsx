import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home, Layout } from "./routes";
import { ProductDetails } from "./pages/product/ProductDetails";
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import { AuthProvider } from './context/AuthContext';
import CreateProduct from './pages/product/CreateProduct';
import Inbox from './pages/inbox/Inbox';
import MyProducts from './pages/product/MyProducts';
import UserProfile from './pages/profile/UserProfile';
import PublicProfile from './pages/profile/PublicProfile';
import TelegramSettings from './pages/account/TelegramSettings';
import WishlistPage from './pages/wishlist/WishlistPage';
import SearchResults from './pages/search/SearchResults';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" 
            element={ 
              <Layout>
                <Home />
              </Layout>
            } 
          />
          <Route path="/details/:id" 
            element={ 
              <Layout>
                <ProductDetails />
              </Layout>
            } 
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-product" 
            element={
              <Layout>
                <CreateProduct />
              </Layout>
            } 
          />
          <Route path="/inbox" 
            element={
              <Layout>
                <Inbox />
              </Layout>
            } 
          />
          <Route path="/my-products" 
            element={
              <Layout>
                <MyProducts />
              </Layout>
            } 
          />
          <Route path="/profile" 
            element={
              <Layout>
                <UserProfile />
              </Layout>
            } 
          />
          <Route path="/profile/:userId" 
            element={
              <Layout>
                <PublicProfile />
              </Layout>
            } 
          />

          <Route path="/telegram-settings" 
            element={
              <Layout>
                <TelegramSettings />
              </Layout>
            } 
          />
          <Route path="/wishlist" 
            element={
              <Layout>
                <WishlistPage />
              </Layout>
            } 
          />
          <Route path="/search"
            element={
              <Layout>
                <SearchResults />
              </Layout>
            }
          />
          <Route path="*" element={
            <Layout>
              <div className="text-center py-20">
                <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
                <p className="mt-4">The page you're looking for doesn't exist.</p>
              </div>
            </Layout>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
