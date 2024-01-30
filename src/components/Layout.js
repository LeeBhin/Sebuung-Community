import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
    return (
        <div>
            <Header />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flexGrow: 1, padding: '20px' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default Layout;