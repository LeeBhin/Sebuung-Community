import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

import '../styles/Header.css'
import ProjectList from './ProjectList';

function Layout() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOption, setSearchOption] = useState('title');

    return (
        <div>
            <Header setSearchQuery={setSearchQuery} setSearchOption={setSearchOption} />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flexGrow: 1, padding: '20px' }}>
                    <ProjectList searchQuery={searchQuery} searchOption={searchOption} />
                </main>
            </div>
        </div>
    );
}

export default Layout;
