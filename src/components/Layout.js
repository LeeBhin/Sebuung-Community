import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOption, setSearchOption] = useState('title');

    const updatedChildren = React.cloneElement(children, { searchQuery, searchOption });

    return (
        <div>
            <Header setSearchQuery={setSearchQuery} setSearchOption={setSearchOption} />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flexGrow: 1, padding: '20px' }}>
                    {updatedChildren}
                </main>
            </div>
        </div>
    );
}

export default Layout;