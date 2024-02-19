import React, { useEffect } from 'react';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signInWithPopup, } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [user, loading, error] = useAuthState(auth);

    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/mypage');
        }
    }, [user, navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }
    const loginWithProvider = async (provider, providerName) => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // 사용자 정보를 Firestore에 저장합니다.
            const userDoc = doc(db, 'users', user.uid);
            const userData = {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL, // 사용자 프로필 사진 URL 추가
            };
            await setDoc(userDoc, userData, { merge: true }); // 기존 데이터를 유지하면서 업데이트

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


    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div className="login">
            <p>로그인</p>
            {!user && (
                <>
                    <button onClick={loginWithGoogle}>구글</button>
                    <button onClick={loginWithGitHub}>깃허브</button>
                    <button onClick={loginWithNaver}>네이버</button>
                    <button onClick={loginWithEmail}>이메일</button>
                </>
            )}
        </div>
    );
};

export default Login;