import '../styles/Header.css'
import { IoIosSearch } from "react-icons/io";

function Header() {
    return (
        <div className="header">
            <div className='logo'>
                <img src='' alt='로고'></img>
            </div>
            <div className="search-container">
                <input type="text" className="searchBar" placeholder="검색" />
                <IoIosSearch className='searchBtn' />
            </div>
        </div>
    );
}

export default Header;
