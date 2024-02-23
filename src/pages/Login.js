import React, { useEffect } from 'react';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { SiNaver } from "react-icons/si";
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import '../styles/Login.css'; // CSS 파일 임포트

const Login = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/mypage');
        }
    }, [user, navigate]);

    const loginWithProvider = async (provider, providerName) => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = doc(db, 'users', user.uid);
            const userData = {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                creationDate: new Date(),
                authMethod: providerName
            };
            await setDoc(userDoc, userData, { merge: true });

            const authin = getAuth();
            setPersistence(authin, browserLocalPersistence)
                .then(() => {
                    // 인증 상태 지속성이 LOCAL로 설정되었습니다.
                    // 이제 사용자의 로그인 상태가 브라우저를 닫아도 유지됩니다.
                })
                .catch((error) => {
                    console.error("인증 상태 지속성 설정 중 오류 발생:", error);
                });
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const loginWithGoogle = () => loginWithProvider(googleProvider, '구글');
    const loginWithGitHub = () => loginWithProvider(githubProvider, '깃허브');
    const loginWithNaver = () => alert('네이버 로그인 준비중');

    return (
        <div className="login">
            <p>로그인</p>
            {!user && (
                <>
                    <button className="google socialBtn" onClick={loginWithGoogle}>
                        <FontAwesomeIcon icon={faGoogle} /> 구글
                    </button>
                    <button className="github socialBtn" onClick={loginWithGitHub}>
                        <FontAwesomeIcon icon={faGithub} /> 깃허브
                    </button>
                    <button className="naver socialBtn" onClick={loginWithNaver}>
                        <SiNaver /> 네이버
                    </button>
                </>
            )}
        </div>
    );
};

export default Login;
