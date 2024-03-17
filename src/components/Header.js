import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";
import '../styles/Header.css';

import logo from '../fish.png'

function Header({ setSearchQuery, setSearchOption }) {
    const [searchOption, setSearchOptionLocal] = useState('title');
    const [inputValue, setInputValue] = useState('');

    const handleSearchOptionChange = (e) => {
        const option = e.target.value;
        setSearchOptionLocal(option);
        setSearchOption(option);
    };

    const handleSearch = () => {
        setSearchQuery(inputValue);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="header">
            <div className='logo'>
                <img src={logo} alt='로고'></img>
                <span className='logoTxt'>SeBuung</span>
            </div>
            <div className="search-container">
                <select onChange={handleSearchOptionChange} value={searchOption} className="search-dropdown">
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="both">제목 + 내용</option>
                </select>
                <div className='input-container'>
                    <input
                        type="text"
                        className="searchBar"
                        placeholder="검색"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                    <IoIosSearch size={'20px'} className='searchBtn' onClick={handleSearch} />
                </div>
            </div>
        </div>
    );
}

export default Header;
