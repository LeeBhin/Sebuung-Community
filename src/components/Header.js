import { Link } from "react-router-dom";

import '../styles/Header.css'

function Header() {
    return (
        <div className="header">
            <div style={{ position: "absolute", right: 0 }}>
                <Link to="/upload">업로드</Link>
                <Link to="/login">로그인</Link>
                <Link to="/mypage">마이페이지</Link>
            </div>
            <input type="text" className="searchBar" placeholder="검색" />
            <button className="searchBtn">검색</button>
        </div>
    );
}


export default Header;