import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

import '../styles/Layout.css'

function Layout({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOption, setSearchOption] = useState('title');
    const [sortOption, setSortOption] = useState('popular');

    const updatedChildren = React.cloneElement(children, { searchQuery, searchOption, sortOption });

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    const getButtonClass = (option) => {
        return sortOption === option ? "selectedSortButton" : "";
    };

    return (
        <div>
            <Header setSearchQuery={setSearchQuery} setSearchOption={setSearchOption} />
            <div className='Layout' style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flexGrow: 1 }}>
                    <div className='sortBtns'>
                        <button className={getButtonClass('popular')} onClick={() => handleSortChange('popular')}>인기순</button>
                        <button className={getButtonClass('latest')} onClick={() => handleSortChange('latest')}>최신순</button>
                        <button className={getButtonClass('views')} onClick={() => handleSortChange('views')}>조회수순</button>
                        <button className={getButtonClass('likes')} onClick={() => handleSortChange('likes')}>추천순</button>
                        <button className={getButtonClass('oldest')} onClick={() => handleSortChange('oldest')}>오래된 순</button>
                    </div>
                    {updatedChildren}
                </main>
            </div>
        </div>
    );
}

export default Layout;