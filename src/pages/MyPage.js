import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AiOutlineUpload } from 'react-icons/ai';
import { IoIosLogOut } from "react-icons/io";
import { MdOutlineDeleteForever } from "react-icons/md";
import { FaEdit } from 'react-icons/fa';

import ProjectList from '../components/ProjectList';

import '../styles/MyPage.css';

const josh = 'https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg'

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return `${seconds}초 전`;
    } else if (minutes < 60) {
        return `${minutes}분 전`;
    } else if (hours < 24) {
        return `${hours}시간 전`;
    } else if (days < 7) {
        return `${days}일 전`;
    } else if (weeks < 5) {
        return `${weeks}주 전`;
    } else if (months < 12) {
        return `${months}달 전`;
    } else {
        return `${years}년 전`;
    }
}

const MyPage = () => {
    const navigate = useNavigate();
    const { userid } = useParams(); // URL에서 userid 파라미터를 가져옵니다.
    const decodedUserId = userid ? atob(userid) : null; // Base64로 인코딩된 userid를 디코딩합니다.
    const [user, loading] = useAuthState(auth);
    const [userInfo, setUserInfo] = useState(null);
    const [displayName, setDisplayName] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [loginMethod, setLoginMethod] = useState('');
    const [myProjects, setMyProjects] = useState([]);
    const [secondsSinceJoined, setSecondsSinceJoined] = useState(0);
    const profileNameRef = useRef(null); // profile-name을 참조하기 위한 ref 생성
    const [profileName, setProfileName] = useState('');

    const targetUserId = decodedUserId || user?.uid;
    const isCurrentUser = user?.uid === targetUserId;


    useEffect(() => {
        // 사용자 정보 및 프로젝트 목록을 가져오는 로직
        if (loading) return;
        if (!user && !userid) navigate('/login');

        const fetchUserData = async () => {
            const userRef = doc(db, "users", targetUserId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                setUserInfo(userData);
                setDisplayName(userData.displayName || "알 수 없음");
                setLoginMethod(userData.authMethod);
                const creationDate = userData.creationDate.toDate();
                setSecondsSinceJoined((new Date() - creationDate) / 1000);
            }
        };

        fetchUserData();

        const fetchProjects = async () => {
            const q = query(collection(db, 'projects'), where('userId', '==', targetUserId));
            onSnapshot(q, (snapshot) => {
                const projects = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    relativeDate: timeAgo(doc.data().createdAt.toDate())
                }));
                setMyProjects(projects);
            });
        };

        fetchProjects();
    }, [user, loading, userid, navigate, targetUserId]);

    useEffect(() => {
        if (targetUserId) {
            const q = query(collection(db, 'projects'), where('userId', '==', targetUserId));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const projects = querySnapshot.docs.map(doc => {
                    const projectData = {
                        id: doc.id,
                        ...doc.data(),
                    };
                    // createdAt 필드를 사용하여 relativeDate 계산
                    const relativeDate = timeAgo(projectData.createdAt.toDate());
                    return {
                        ...projectData,
                        relativeDate, // 계산된 relativeDate 값을 객체에 추가
                    };
                });
                setMyProjects(projects);
            });

            return () => unsubscribe();
        }
    }, [targetUserId]);

    useEffect(() => {
        // 컴포넌트가 마운트된 후에 profile-name 클래스의 내용을 가져옵니다.
        const name = profileNameRef.current ? profileNameRef.current.textContent : "사용자";
        setProfileName(name);
    }, []); // 의존성 배열을 빈 배열로 설정하여 컴포넌트 마운트 시 한 번만 실행


    const getActivityMessage = (seconds) => {
        if (seconds === 0) {
            return `만나서 반가웠어요!`
        }
        if (seconds > 0 && seconds < 180) {
            return `만나서 반가워요, ${profileName}님!`;
        } else if (seconds < 720000) {
            return `우리가 함께한 시간동안, 3분 카레 ${Math.floor(seconds / 180)}개를 만들 수 있었어요! 🍛`;
        } else if (seconds < 28854000) {
            const trips = (seconds / 720000).toFixed(0);
            return `우리가 함께한 시간으로 한라산에서 백두산까지 ${trips}번 갈 수 있었어요! ⛰️👣`;
        } else if (seconds < 553536000) {
            const earthLaps = (seconds / 28854000).toFixed(0);
            return `그리고 우리가 함께한 시간으로 지구를 ${earthLaps}바퀴나 돌 수 있었어요! 🌍👣`;
        } else if (seconds < 324000000000) {
            const moonLaps = (seconds / 553536000).toFixed(0);
            return `이제 우리는 함께 달까지 ${moonLaps}번 왕복할 수 있는 거리를 여행했어요! 🌍🌕🚶‍♂️`;
        } else if (seconds < 107712000000) {
            const marsTrips = (seconds / 324000000000).toFixed(0);
            return `이제 우리는 함께 화성까지 ${marsTrips}번 갈 수 있는 거리를 여행했어요! 🔴🚶‍♂️`;
        } else {
            const sunTrips = (seconds / 107712000000).toFixed(0);
            return `우리가 함께한 시간으로 태양까지 ${sunTrips}번 갈 수 있는 거리를 여행했어요! ☀️🚶‍♂️`;
        }
    };

    const updateDisplayName = async () => {
        if (user && newDisplayName && isCurrentUser) {
            await updateProfile(user, { displayName: newDisplayName })
                .then(() => {
                    setDisplayName(newDisplayName);
                    setUserInfo({ ...userInfo, displayName: newDisplayName });
                })
                .catch((error) => {
                    console.error("Error updating profile: ", error);
                });

            await updateDoc(doc(db, 'users', user.uid), { displayName: newDisplayName });
            setNewDisplayName('');
        }
    };

    const uploadProfileImage = async (event) => {
        const file = event.target.files[0];
        if (!user || !file || !isCurrentUser) return;

        const fileRef = storageRef(storage, `profilePictures / ${user.uid} `);
        await uploadBytes(fileRef, file).then(async () => {
            const url = await getDownloadURL(fileRef);
            await updateProfile(user, { photoURL: url });
            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            setUserInfo({ ...userInfo, photoURL: url });
        }).catch((error) => {
            console.error("Error uploading profile picture: ", error);
        });
    };

    const deleteAccount = async () => {
        if (user && isCurrentUser) {
            const isConfirmed = window.confirm("계정을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
            if (isConfirmed) {
                // Firestore에서 사용자 문서 삭제
                await deleteDoc(doc(db, 'users', user.uid))
                    .then(async () => {
                        // Firebase Authentication에서 사용자 삭제
                        await auth.currentUser.delete().then(() => {
                            navigate('/');
                        }).catch((error) => {
                            console.error("Firebase Authentication에서 계정 삭제 중 오류 발생:", error);
                            alert("계정을 삭제하는 데 실패했습니다. 나중에 다시 시도해주세요.");
                        });
                    })
                    .catch((error) => {
                        console.error("Firestore에서 사용자 문서 삭제 중 오류 발생:", error);
                        alert("계정을 삭제하는 데 실패했습니다. 나중에 다시 시도해주세요.");
                    });
            }
        }
    };


    const logout = async () => {
        if (isCurrentUser) {
            await signOut(auth);
            navigate('/login');
        }
    };

    const handleDisplayNameChange = (e) => {
        if (e.key === 'Enter' && newDisplayName.trim() !== '') {
            updateDisplayName();
            setEditMode(false);
        }
    };

    if (loading || !user) {
        return null;
    }

    return (
        <div className="myPage">
            <div className="profile-section">
                <div className="profile-image-container">
                    <img src={userInfo?.photoURL || josh} alt="Profile" className="profile-image" />
                    {isCurrentUser && (
                        <>
                            <label htmlFor="profile-image-upload" className="change-profile-btn">
                                <AiOutlineUpload />
                            </label>
                            <input id="profile-image-upload" type="file" onChange={uploadProfileImage} style={{ display: 'none' }} />
                        </>
                    )}
                </div>
                <div>
                    <div className="profile-name-section">
                        {!editMode ? (
                            <>
                                <div className="profile-name">{displayName}</div>
                                {isCurrentUser && (
                                    <button className="edit-icon" onClick={() => setEditMode(true)}>
                                        <FaEdit size={"13px"} />
                                    </button>
                                )}
                            </>
                        ) : (
                            <input className='changeName' type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} onKeyDown={handleDisplayNameChange} autoFocus />
                        )}
                    </div>
                    <div className="membership-duration">
                        {getActivityMessage(secondsSinceJoined)}
                        {loginMethod && (
                            <div className="login-method">
                                <p>{loginMethod}로 로그인됨</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isCurrentUser && (
                <>
                    <button className="myPageBtn logout-btn" onClick={logout}><IoIosLogOut size={"15px"} /> 로그아웃</button>
                    <button className="myPageBtn delete-account-btn" onClick={deleteAccount}><MdOutlineDeleteForever size={"15px"} /> 계정 삭제</button>
                </>
            )}
            <ProjectList projectsData={myProjects} isBookmarkPage={true} />
        </div>
    );
};

export default MyPage;
