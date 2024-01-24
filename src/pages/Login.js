import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const Login = () => {
    const [user, loading, error] = useAuthState(auth);
    const [loginMethod, setLoginMethod] = useState(null);

    useEffect(() => {
        // 로컬 스토리지에서 사용자 정보를 가져옵니다.
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setLoginMethod(savedUser);
        }
    }, []);

    const loginWithProvider = async (provider, providerName) => {
        try {
            await signInWithPopup(auth, provider);
            setLoginMethod(providerName);

            // 사용자 정보를 Firestore에 저장합니다.
            const user = auth.currentUser;
            const userDoc = doc(db, 'users', user.uid);
            const userData = {
                displayName: user.displayName,
                email: user.email,
            };
            await setDoc(userDoc, userData);

            // 로컬 스토리지에 사용자 정보를 저장합니다.
            localStorage.setItem('user', providerName);
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const loginWithGoogle = () => {
        loginWithProvider(googleProvider, '구글');
    };

    const loginWithGitHub = () => {
        loginWithProvider(githubProvider, '깃허브');
    };

    const loginWithEmail = async () => {
        alert('이메일 로그인 준비중')
    };

    const loginWithNaver = async () => {
        alert('네이버 로그인 준비중')
    };

    const logout = async () => {
        try {
            // Firebase Authentication에서 로그아웃
            await signOut(auth);

            // 브라우저 캐시 삭제 (LocalStorage)
            localStorage.removeItem('user');

            // Firebase Authentication 세션 정보 삭제 (세션 쿠키 삭제)
            document.cookie = 'firebaseAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

            // 로그인 상태 초기화
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