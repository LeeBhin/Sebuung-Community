import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { auth, googleProvider, githubProvider } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, signOut } from 'firebase/auth';

const Login = () => {
    const [user, loading, error] = useAuthState(auth);
    const [loginMethod, setLoginMethod] = useState(null);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            setLoginMethod('구글');
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const loginWithGitHub = async () => {
        try {
            await signInWithPopup(auth, githubProvider);
            setLoginMethod('깃허브');
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const loginWithEmail = async () => {
        alert('이메일 로그인 준비중')
    };

    const loginWithNaver = async () => {
        alert('네이버 로그인 준비중')
    };


    const logout = async () => {
        try {
            await signOut(auth);
            setLoginMethod(null);
        } catch (error) {
            console.error("로그아웃 실패:", error);
        }
    };

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
                    {loginMethod && <p>{loginMethod}로 로그인됨</p>}
                    <button onClick={logout}>로그아웃</button>
                </>
            ) : (
                <>
                    <button onClick={loginWithGoogle}>구글</button>
                    <button onClick={loginWithGitHub}>깃허브</button>
                    <button onClick={loginWithNaver}>네이버</button>
                    <button onClick={loginWithEmail}>이메일</button>
                </>
            )}
            <Link to="/">돌아가기</Link>
        </div>
    );
};

export default Login;
