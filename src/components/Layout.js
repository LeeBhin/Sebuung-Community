import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOption, setSearchOption] = useState('title');
    const [sortOption, setSortOption] = useState('popular');

    const updatedChildren = React.cloneElement(children, { searchQuery, searchOption, sortOption });

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    return (
        <div>
            <Header setSearchQuery={setSearchQuery} setSearchOption={setSearchOption} />
            <div style={{ display: 'flex' }}>
                <Sidebar />
                <div>
                    <button onClick={() => handleSortChange('popular')}>인기순</button>
                    <button onClick={() => handleSortChange('latest')}>최신순</button>
                    <button onClick={() => handleSortChange('views')}>조회수순</button>
                    <button onClick={() => handleSortChange('likes')}>추천순</button>
                    <button onClick={() => handleSortChange('oldest')}>오래된 순</button>
                </div>
                <main style={{ flexGrow: 1 }}>
                    {updatedChildren}
                </main>
            </div>
        </div>
    );
}

export default Layout;