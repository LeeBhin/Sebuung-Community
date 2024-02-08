import React, { useState } from 'react';
import { IoIosSearch } from "react-icons/io";

function Header({ setSearchQuery, setSearchOption }) {
    // 검색 옵션 상태 추가
    const [searchOption, setSearchOptionLocal] = useState('title'); // 기본값을 'title'로 설정

    const handleSearchOptionChange = (e) => {
        const option = e.target.value;
        setSearchOptionLocal(option); // 검색 옵션 상태 업데이트
        setSearchOption(option); // 상위 컴포넌트로 검색 옵션 상태 업데이트
    };  

    return (
        <div className="header">
            <div className='logo'>
                <img src='' alt='로고'></img>
            </div>
            <div className="search-container">
                <select onChange={handleSearchOptionChange} value={searchOption}>
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="both">제목 + 내용</option>
                </select>
                <input type="text" className="searchBar" placeholder="검색" onChange={(e) => setSearchQuery(e.target.value)} />
                <IoIosSearch className='searchBtn' />
            </div>
        </div>
    );
}

export default Header;
