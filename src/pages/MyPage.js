import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase'; // storage 추가
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut, updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; // 추가
import { useNavigate } from 'react-router-dom';
import ProjectDetail from '../components/ProjectDetail';

import '../styles/MyPage.css';

const MyPage = () => {
    const [user] = useAuthState(auth);
    const [displayName, setDisplayName] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [myProjects, setMyProjects] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loginMethod, setLoginMethod] = useState('');
    const [reloadTrigger, setReloadTrigger] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        } else {
            setDisplayName(user.displayName || user.email);

            const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const projects = [];
                querySnapshot.forEach((doc) => {
                    projects.push({ id: doc.id, ...doc.data() });
                });
                setMyProjects(projects);
            });

            setLoginMethod(localStorage.getItem('user'));

            return () => unsubscribe();
        }
    }, [user, navigate, reloadTrigger]);

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
                // 프로필 업데이트 후 UI 갱신을 위해 상태를 변경
                setReloadTrigger(prev => !prev);
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

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId);
        setShowPopup(true);
    };

    if (!user) {
        return <div>로그인이 필요합니다.</div>;
    }

    return (
        <div className="myPage">
            <div className="profile-section">
                <div className="profile-info">
                    <img src={user?.photoURL || 'defaultProfileImageURL'} alt="Profile" className="profile-image" />
                    <div className="profile-name">{displayName}</div>
                </div>
                <div>
                    <label htmlFor="profile-image-upload" className="myPageBtn">프로필 이미지 변경</label>
                    <input id="profile-image-upload" type="file" onChange={uploadProfileImage} style={{ display: 'none' }} />
                </div>
            </div>

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
                <button className="myPageBtn" onClick={logout}>로그아웃</button>
                <button className="myPageBtn" onClick={deleteAccount} style={{ background: 'red' }}>계정 삭제</button>
            </div>
            {loginMethod && <p>{loginMethod}로 로그인됨</p>}

            <div className="project-list">
                <h2>나의 프로젝트</h2>
                {myProjects.length > 0 ? (
                    myProjects.map((project) => (
                        <div key={project.id} className="project-item" onClick={() => showProjectDetail(project.id)}>
                            {project.title}
                        </div>
                    ))
                ) : (
                    <p>프로젝트가 없습니다.</p>
                )}
            </div>

            {showPopup && (
                <ProjectDetail
                    projectId={selectedProject}
                    setShowPopup={setShowPopup}
                    onPopupClose={() => setReloadTrigger(prev => !prev)}
                />
            )}
        </div>
    );
};

export default MyPage;