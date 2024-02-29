import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

import '../styles/Layout.css'

function Layout({ children }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOption, setSearchOption] = useState('title');
    const [sortOption, setSortOption] = useState('views');

    const updatedChildren = React.cloneElement(children, { searchQuery, searchOption, sortOption });
    const isHome = children.type.displayName === 'Home';

    const handleSortChange = (option) => {
        setSortOption(option);
    };

    const getButtonStyle = (option) => {
        return sortOption === option ? { backgroundColor: 'rgb(100,100,255)', color: 'white', fontWeight: 'bold' } : {};
    };

    return (
        <div>
            <Header setSearchQuery={setSearchQuery} setSearchOption={setSearchOption} />
            <div className='Layout' style={{ display: 'flex' }}>
                <Sidebar />
                <main style={{ flexGrow: 1 }}>
                    {isHome && (
                        <div className='sortBtns'>
                            <button style={getButtonStyle('views')} onClick={() => handleSortChange('views')}>조회수순</button>
                            <button style={getButtonStyle('star')} onClick={() => handleSortChange('star')}>별점순</button>
                            <button style={getButtonStyle('likes')} onClick={() => handleSortChange('likes')}>추천순</button>
                            <button style={getButtonStyle('latest')} onClick={() => handleSortChange('latest')}>최신순</button>
                            <button style={getButtonStyle('oldest')} onClick={() => handleSortChange('oldest')}>오래된 순</button>
                        </div>
                    )}
                    {updatedChildren}
                </main>
            </div>
        </div>
    );
}

export default Layout;
