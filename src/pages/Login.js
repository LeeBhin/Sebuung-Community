import { Link } from "react-router-dom";

function Login() {
    return (
        <div className="login">
            <p>로그인</p>
            <form>
                <button>카톡</button>
                <button>구글</button>
                <button>깃허브</button>
            </form>

            <Link to="/">돌아가기</Link>
        </div>
    );
}

export default Login;
