import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCfxXv1KgujYLD5B5nZSIBjaTLtytgwEyc",
    authDomain: "boasting-778b9.firebaseapp.com",
    projectId: "boasting-778b9",
    storageBucket: "boasting-778b9.appspot.com",
    messagingSenderId: "897116949789",
    appId: "1:897116949789:web:9c8f40e6835a33c17765f4",
    measurementId: "G-BB9JRRQJMG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();
export const storage = getStorage(app);
export const db = getFirestore(app);