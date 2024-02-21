import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import ProjectList from '../components/ProjectList'; // 이 부분은 당신의 ProjectList 컴포넌트 경로에 맞게 조정하세요.

import '../styles/MyPage.css';

const josh = 'https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg'

const MyPage = () => {
    const [user] = useAuthState(auth);
    const [displayName, setDisplayName] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [myProjects, setMyProjects] = useState([]);
    const [loginMethod, setLoginMethod] = useState('');
    const navigate = useNavigate();
    const [secondsSinceJoined, setSecondsSinceJoined] = useState(0);

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            setDisplayName(user.displayName || user.email);
            const method = user.providerData[0]?.providerId;

            const updateSeconds = () => {
                const creationTime = user.metadata.creationTime;
                const seconds = calculateSecondsSinceJoined(creationTime);
                setSecondsSinceJoined(seconds);
            };

            updateSeconds(); // 컴포넌트 마운트 시 초기 실행
            const intervalId = setInterval(updateSeconds, 1000);

            switch (method) {
                case 'github.com':
                    setLoginMethod('깃허브');
                    break;
                case 'google.com':
                    setLoginMethod('구글');
                    break;
                default:
                    setLoginMethod('알 수 없음');
            }

            const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const projects = [];
                querySnapshot.forEach((doc) => {
                    projects.push({ id: doc.id, ...doc.data() });
                });
                setMyProjects(projects);
            });

            return () => {
                clearInterval(intervalId);
                unsubscribe();
            };
        }
    }, [user, navigate]);

    const updateDisplayName = async () => {
        if (user && newDisplayName) {
            await updateProfile(user, {
                displayName: newDisplayName,
            }).then(() => {
                setDisplayName(newDisplayName);
            }).catch((error) => {
                console.error("Error updating profile: ", error);
            });

            await updateDoc(doc(db, 'users', user.uid), { displayName: newDisplayName });
            setNewDisplayName('');
        }
    };

    const uploadProfileImage = async (event) => {
        const file = event.target.files[0];
        if (!user || !file) return;
        const fileRef = storageRef(storage, `profilePictures/${user.uid}`);
        await uploadBytes(fileRef, file).then(() => {
            getDownloadURL(fileRef).then(async (url) => {
                await updateProfile(user, { photoURL: url });
                await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            });
        }).catch((error) => {
            console.error("Error uploading profile picture: ", error);
        });
    };

    const deleteAccount = async () => {
        if (user) {
            await deleteDoc(doc(db, 'users', user.uid));
            await auth.currentUser.delete();
            navigate('/');
        }
    };

    const logout = async () => {
        await signOut(auth);
        navigate('/login');
    };

    if (!user) {
        return <div>로그인이 필요합니다.</div>;
    }

    const calculateSecondsSinceJoined = (creationTime) => {
        const creationDate = new Date(creationTime);
        const currentDate = new Date();
        const timeDiff = currentDate - creationDate;
        const secondsSinceJoined = Math.floor(timeDiff / 1000);
        return secondsSinceJoined;
    };

    const getActivityMessage = (seconds) => {
        if (seconds < 720000) {
            return `우리가 함께한 시간동안, 3분 카레 ${Math.floor(seconds / 180)}개를 만들 수 있었어요! 🍛`;
        } else if (seconds < 28854000) {
            const trips = (seconds / 720000).toFixed(2);
            return `우리가 함께한 시간으로 한라산에서 백두산까지 걸어서 ${trips}번 갈 수 있었어요! ⛰️👣`;
        } else if (seconds < 553536000) {
            const earthLaps = (seconds / 28854000).toFixed(2);
            return `그리고 우리가 함께한 시간으로 지구를 ${earthLaps}바퀴나 걸을 수 있었어요! 🌍👣`;
        } else if (seconds < 324000000000) {
            const moonLaps = (seconds / 553536000).toFixed(2);
            return `이제 우리는 함께 달까지 걸어서 왕복 ${moonLaps}번 갈 수 있는 거리를 여행했어요! 🌍🌕🚶‍♂️`;
        } else if (seconds < 107712000000) {
            const marsTrips = (seconds / 324000000000).toFixed(2);
            return `이제 우리는 함께 화성까지 걸어서 ${marsTrips}번 갈 수 있는 거리를 여행했어요! 🔴🚶‍♂️`;
        } else {
            const sunTrips = (seconds / 107712000000).toFixed(2);
            return `우리가 함께한 시간으로 태양까지 걸어서 ${sunTrips}번 갈 수 있는 거리를 여행했어요! ☀️🚶‍♂️`;
        }
    };

    return (
        <div className="myPage">
            <div className="profile-section">
                <div className="profile-image-container">
                    <img src={user?.photoURL || josh} alt="Profile" className="profile-image" />
                    <button className="change-profile-btn" htmlFor="profile-image-upload">변경</button>
                    <input id="profile-image-upload" type="file" onChange={uploadProfileImage} style={{ display: 'none' }} />
                </div>
                <div>
                    <div className="profile-name">{displayName}</div>
                    <div className="membership-duration">
                        {getActivityMessage(secondsSinceJoined)}
                    </div>
                </div>
            </div>
            <ProjectList projectsData={myProjects} isBookmarkPage={false} />

            <div className="update-section">
                <input
                    type="text"
                    placeholder="새로운 닉네임"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                />
                <button className="myPageBtn" onClick={updateDisplayName}>닉네임 변경</button>
            </div>

            <div className="actions-section">
                <button className="myPageBtn logout-btn" onClick={logout}>로그아웃</button>
                <button className="myPageBtn delete-account-btn" onClick={deleteAccount}>계정 삭제</button>
            </div>
            {loginMethod && (
                <div className="login-method">
                    <p>{loginMethod}로 로그인됨</p>
                </div>
            )}

        </div>
    );
};

export default MyPage;