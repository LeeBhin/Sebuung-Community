import { Link } from "react-router-dom";

function Header() {
    return (
        <div className="header" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
        }}>
            <div style={{ position: "absolute", right: 0 }}>
                <Link to="/upload">업로드</Link>
                <Link to="/login">로그인</Link>
            </div>
            <input type="text" placeholder="검색" style={{ maxWidth: "100%", width: "300px", lineHeight: "30px", marginTop: "20px" }} />
            <button>검색</button>
        </div>
    );
}


export default Header;