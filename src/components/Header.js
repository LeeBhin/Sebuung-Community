import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import '../styles/Header.css';

function Header({ setSearchQuery, setSearchOption }) {
    const [searchOption, setSearchOptionLocal] = useState('title');

    const handleSearchOptionChange = (e) => {
        const option = e.target.value;
        setSearchOptionLocal(option);
        setSearchOption(option);
    };

    return (
        <div className="header">
            <div className='logo'>
                <img src='' alt='로고'></img>
            </div>
            <div className="search-container">
                <select onChange={handleSearchOptionChange} value={searchOption} className="search-dropdown">
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="both">제목 + 내용</option>
                </select>
                <div className='input-container'>
                    <input type="text" className="searchBar" placeholder="검색" onChange={(e) => setSearchQuery(e.target.value)} />
                    <IoIosSearch size={'20px'} className='searchBtn' />
                </div>
            </div>
        </div>
    );
}

export default Header;
