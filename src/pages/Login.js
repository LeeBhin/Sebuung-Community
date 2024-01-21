import { Link } from "react-router-dom";
import { auth, googleProvider, githubProvider } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, signOut } from 'firebase/auth';

const loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
        // 성공적인 로그인 처리
    } catch (error) {
        console.error("로그인 실패:", error);
        // 오류 처리
    }
};

const loginWithGitHub = () => {
    signInWithPopup(auth, githubProvider);
};

const logout = async () => {
    try {
        await signOut(auth);
        // 로그아웃 성공 처리
    } catch (error) {
        console.error("로그아웃 실패:", error);
        // 오류 처리
    }
};

function Login() {
    const [user, loading, error] = useAuthState(auth);

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="login">
            <p>로그인</p>
            {user ? (
                <>
                    <p>{user.displayName || user.email}님, 환영합니다</p>
                    <button onClick={logout}>로그아웃</button>
                </>
            ) : (
                <>
                    <button onClick={loginWithGoogle}>구글</button>
                    <button onClick={loginWithGitHub}>깃허브</button>
                    <button>카톡</button>
                    <button>네이버</button>
                </>
            )}
            <Link to="/">돌아가기</Link>
        </div>
    );
}

export default Login;
