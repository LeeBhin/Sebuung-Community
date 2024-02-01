import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
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
    }, [user, navigate]);

    const updateDisplayName = async () => {
        if (user && newDisplayName) {
            await updateDoc(doc(db, 'users', user.uid), { displayName: newDisplayName });
            setDisplayName(newDisplayName);
            setNewDisplayName('');
        }
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
            <h1>{displayName}님</h1>
            {loginMethod && <p>{loginMethod}로 로그인됨</p>}
            <div>
                <input
                    type="text"
                    placeholder="새로운 닉네임"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                />
                <button className='myPageBtn' onClick={updateDisplayName}>닉네임 변경</button>
            </div>
            <button className='myPageBtn' onClick={logout} style={{ 'background': 'orangered' }}>로그아웃</button>
            <div>
                <button className='myPageBtn' onClick={deleteAccount} style={{ 'background': 'red' }}>계정 삭제</button>
            </div>
            <div>
                <h2>나의 프로젝트</h2>
                {myProjects.length > 0 ? (
                    <ul>
                        {myProjects.map((project) => (
                            <li key={project.id} onClick={() => showProjectDetail(project.id)}>
                                {project.title}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>프로젝트가 없습니다.</p>
                )}
            </div>
            {showPopup && (
                <ProjectDetail projectId={selectedProject} setShowPopup={setShowPopup} />
            )}
        </div>
    );
};

export default MyPage;
