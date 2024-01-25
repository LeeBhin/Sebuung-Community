import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import ProjectDetail from '../components/ProjectDetail';

const MyPage = () => {
    const [user] = useAuthState(auth);
    const [displayName, setDisplayName] = useState('');
    const [newDisplayName, setNewDisplayName] = useState('');
    const [myProjects, setMyProjects] = useState([]);
    const [showPopup, setShowPopup] = useState(false); // 팝업 표시 여부
    const [selectedProject, setSelectedProject] = useState(null); // 선택된 프로젝트 정보
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            // 현재 닉네임 설정
            setDisplayName(user.displayName || user.email);

            // 사용자의 프로젝트 목록을 불러옵니다.
            const q = query(collection(db, 'projects'), where('userId', '==', user.uid));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const projects = [];
                querySnapshot.forEach((doc) => {
                    projects.push({ id: doc.id, ...doc.data() });
                });
                setMyProjects(projects);
            });

            return () => unsubscribe(); // 클린업 함수
        }
    }, [user]);

    const updateDisplayName = async () => {
        if (user && newDisplayName) {
            await updateDoc(doc(db, 'users', user.uid), { displayName: newDisplayName });
            setDisplayName(newDisplayName); // 현재 닉네임 업데이트
            setNewDisplayName(''); // 입력 필드 초기화
        }
    };

    const deleteAccount = async () => {
        if (user) {
            await deleteDoc(doc(db, 'users', user.uid));
            await auth.currentUser.delete();
            navigate('/');
        }
    };

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId); // 선택된 프로젝트 설정
        setShowPopup(true); // 팝업 표시
    };

    if (!user) {
        return <div>로그인이 필요합니다.</div>;
    }

    return (
        <div className="myPage">
            <h1>{displayName}님의 마이페이지</h1>
            <div>
                <input
                    type="text"
                    placeholder="새로운 닉네임"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                />
                <button onClick={updateDisplayName}>닉네임 변경</button>
            </div>
            <div>
                <button onClick={deleteAccount}>계정 삭제</button>
            </div>
            <div>
                <h2>내가 올린 프로젝트</h2>
                <ul>
                    {myProjects.map((project) => (
                        <li key={project.id} onClick={() => showProjectDetail(project.id)}>
                            {project.title}
                        </li>
                    ))}
                </ul>
            </div>
            {showPopup && (
                <ProjectDetail projectId={selectedProject} setShowPopup={setShowPopup} />
            )}
        </div>
    );
};

export default MyPage;
