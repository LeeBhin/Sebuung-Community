// Firebase 앱과 필요한 서비스들을 개별적으로 import합니다.
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';

// Firebase 프로젝트 설정
const firebaseConfig = {
    apiKey: "AIzaSyCfxXv1KgujYLD5B5nZSIBjaTLtytgwEyc",
    authDomain: "boasting-778b9.firebaseapp.com",
    projectId: "boasting-778b9",
    storageBucket: "boasting-778b9.appspot.com",
    messagingSenderId: "897116949789",
    appId: "1:897116949789:web:9c8f40e6835a33c17765f4",
    measurementId: "G-BB9JRRQJMG"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Auth 서비스를 초기화하고 export합니다.
export const auth = getAuth(app);

// Google과 GitHub 인증 제공자를 export합니다.
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
