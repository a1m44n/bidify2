import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from "../../routes";
import { Footer } from "./Footer";
import PropTypes from "prop-types";

export const Layout = ({children}) => {
    const location = useLocation();
    const isHomePage = location.pathname === "/";
    
    return (
        <>
            <Header/>
            <main className={isHomePage ? "" : "pt-24"}>{children}</main>
            <Footer/>
        </>
    );
};

Layout.propTypes = {
  children: PropTypes.any,
};