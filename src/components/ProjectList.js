import React, { useState, useEffect, useRef } from 'react';
import ProjectDetail from './ProjectDetail';
import { auth, db } from '../firebase';
import { collection, query, getDocs, doc, getDoc, updateDoc, increment, arrayUnion, setDoc, orderBy, limit, where, startAfter } from 'firebase/firestore';
import '../styles/ProjectList.css';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { useNavigate } from 'react-router-dom';

const defaultProfileImageUrl = 'https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg';

function timeAgo(date) {
    const now = new Date();
    const seconds = Math.round((now - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const weeks = Math.round(days / 7);
    const months = Math.round(days / 30);
    const years = Math.round(days / 365);

    if (seconds < 60) return `${seconds}초 전`;
    else if (minutes < 60) return `${minutes}분 전`;
    else if (hours < 24) return `${hours}시간 전`;
    else if (days < 7) return `${days}일 전`;
    else if (weeks < 5) return `${weeks}주 전`;
    else if (months < 12) return `${months}달 전`;
    else return `${years}년 전`;
}

async function fetchAuthorPhotoURLs(projectsData) {
    const usersCache = {};
    const projects = await Promise.all(projectsData.map(async project => {
        if (!usersCache[project.userId]) {
            const userRef = doc(db, "users", project.userId);
            const userSnap = await getDoc(userRef);
            usersCache[project.userId] = userSnap.exists() ? {
                photoURL: userSnap.data().photoURL || defaultProfileImageUrl,
                displayName: userSnap.data().displayName || "알 수 없음"
            } : {
                photoURL: defaultProfileImageUrl,
                displayName: "알 수 없음"
            };
        }
        return {
            ...project,
            authorPhotoURL: usersCache[project.userId].photoURL,
            authorName: usersCache[project.userId].displayName
        };
    }));
    return projects;
}

function ProjectList({ isBookmarkPage, projectsData, setRefreshTrigger, searchQuery = '', searchOption = '', sortOption = '' }) {
    const [showPopup, setShowPopup] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [projects, setProjects] = useState([])
    // const [projects, setProjects] = useState(Array(5).fill().map((_, index) => ({
    //     id: `temp-${index}`,
    //     title: '불러오는 중...',
    //     thumbnailUrl: defaultProfileImageUrl,
    //     authorPhotoURL: defaultProfileImageUrl,
    //     authorName: '로딩 중',
    //     views: '로딩 중',
    //     relativeDate: '방금 전',
    // })));
    const navigate = useNavigate();

    const sortOptionRef = useRef(sortOption);
    const [lastVisible, setLastVisible] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [prevSort, setPrevSort] = useState('views');
    const [projectsLimit, setProjectsLimit] = useState(25); // 상태 변수로 변환

    useEffect(() => {
        sortOptionRef.current = sortOption;
        // 정렬 옵션이 변경되었을 때 초기화
        if (prevSort !== sortOption) {
            setProjects([]);
            setLastVisible(null);
            setPrevSort(sortOption);
            setIsLoading(true);
            setProjectsLimit(25); // 초기 프로젝트 불러올 때의 limit 설정
        }
    }, [sortOption, prevSort]);

    const loadProjects = async () => {
        if (isLoading) return; // 이미 로딩 중이라면 함수 실행을 중단
        console.log('loadprojects')
        setIsLoading(true)
        NProgress.start();
        let loadedProjectsData = [];

        let hap = false;

        if (!isBookmarkPage) {
            const projectsRef = collection(db, "projects");

            // 사용자가 선택한 정렬 옵션에 따라 동적으로 쿼리를 생성
            let q;
            switch (sortOptionRef.current) {
                case 'star':
                    q = query(projectsRef, orderBy("ratingAverage", "desc"), orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                case 'latest':
                    q = query(projectsRef, orderBy("createdAt", "desc"), limit(projectsLimit));
                    break;
                case 'oldest':
                    q = query(projectsRef, orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                case 'views':
                    q = query(projectsRef, orderBy("views", "desc"), orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                case 'likes':
                    q = query(projectsRef, orderBy("likesCount", "desc"), orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
                default:
                    q = query(projectsRef, orderBy("views", "desc"), orderBy("createdAt", "asc"), limit(projectsLimit));
                    break;
            }

            if (prevSort === sortOption) {
                if (lastVisible) {
                    hap = true;
                    q = query(q, startAfter(lastVisible));
                }
            } else {
                setLastVisible(null)
            }

            const snapshot = await getDocs(q);

            loadedProjectsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                relativeDate: timeAgo(doc.data().createdAt.toDate())
            }));

            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);

            if (projectsLimit === 25) {
                setProjectsLimit(10); // 두 번째 로드부터 적용될 limit
            }
        } else {
            loadedProjectsData = projectsData;
        }
        let allProjectsData = loadedProjectsData

        // 첫 번째 데이터가 이전에 불러온 데이터의 첫 번째 요소와 동일한지 확인
        if ((prevSort === sortOption) && loadedProjectsData.length > 0 && projects.length > 0 && loadedProjectsData[0].id === projects[0].id) {
            setIsLoading(false);
            NProgress.done();
            return; // 더 이상 데이터를 불러오지 않음
        }

        if (hap) {
            allProjectsData = [...projects, ...loadedProjectsData];
        }

        // 중복된 데이터 제거
        let uniqueProjectsData = allProjectsData.filter((project, index, self) =>
            index === self.findIndex(p => p.id === project.id)
        );

        if (searchQuery && searchQuery.trim() !== '') {
            // Firestore에서 검색 쿼리 실행
            const searchResults = await searchProjects(searchQuery, searchOption);
            uniqueProjectsData = searchResults;
        }

        // fetchAuthorPhotoURLs 함수를 호출하여 작성자의 프로필 사진 URL을 가져옴
        const projectsWithAuthors = await fetchAuthorPhotoURLs(uniqueProjectsData);

        const datedProjectsData = projectsWithAuthors.map(project => ({
            ...project,
            relativeDate: timeAgo(project.createdAt.toDate())
        }));

        // 정렬된 데이터를 상태에 설정
        setProjects(datedProjectsData);
        setIsLoading(false); // 함수 마지막에서 로딩 상태를 false로 설정
        NProgress.done();
    };

    const searchProjects = async (searchQuery, searchOption) => {
        let loadedProjectsData = [];

        // Firestore 쿼리 생성
        const projectsRef = collection(db, "projects");

        // 검색 옵션에 따라 쿼리 필드를 선택하여 조건 추가
        if (searchQuery && searchQuery.trim() !== '') {
            let docs = []; // 문서를 저장할 배열
            if (searchOption === 'title') {
                // title 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('title', '>=', searchQuery), where('title', '<', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                docs = snapshot.docs;
            } else if (searchOption === 'content') {
                // content 필드를 기준으로 검색 쿼리 생성
                const q = query(projectsRef, where('description', '>=', searchQuery), where('description', '<', searchQuery + '\uf8ff'));
                const snapshot = await getDocs(q);
                docs = snapshot.docs;
            } else {
                // 'both' 옵션 선택 시, title과 description 필드 각각에 대해 쿼리를 실행하고 결과를 합침
                const qTitle = query(projectsRef, where('title', '>=', searchQuery), where('title', '<', searchQuery + '\uf8ff'));
                const qDescription = query(projectsRef, where('description', '>=', searchQuery), where('description', '<', searchQuery + '\uf8ff'));
                const snapshotTitle = await getDocs(qTitle);
                const snapshotDescription = await getDocs(qDescription);
                // 두 결과를 합침
                docs = [...snapshotTitle.docs, ...snapshotDescription.docs];
            }

            // ID를 기준으로 중복 제거
            const uniqueIds = new Set();
            docs = docs.filter(doc => {
                const isDuplicate = uniqueIds.has(doc.id);
                uniqueIds.add(doc.id);
                return !isDuplicate;
            });

            // 문서 데이터 추출
            loadedProjectsData = docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }

        return loadedProjectsData;
    };
    const [lastScrollTop, setLastScrollTop] = useState(0); // 이전 스크롤 위치 저장

    useEffect(() => {
        const handleScroll = () => {
            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            const isScrollingDown = scrollTop > lastScrollTop; // 현재 스크롤 위치가 이전 위치보다 큰 경우, 아래로 스크롤

            // 스크롤을 아래로 내리고, 페이지의 바닥에 도달했으며, 현재 로딩 중이 아닐 때
            if (isScrollingDown && !isLoading && scrollTop + clientHeight >= scrollHeight - 60) {
                setIsLoading(true); // 로딩 시작
                loadProjects().then(() => {
                    setIsLoading(false); // 로딩 완료
                });
            }
            setLastScrollTop(scrollTop); // 현재 스크롤 위치를 lastScrollTop 상태에 저장
        };

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    });

    useEffect(() => {
        loadProjects();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBookmarkPage, projectsData, searchQuery, searchOption, sortOption]);


    const onPopupClose = () => {
        setShowPopup(false); // 팝업 상태를 false로 설정합니다.
        loadProjects(); // 팝업이 닫힐 때 loadProjects 함수를 호출하여 데이터를 새로고침합니다.
    };

    const incrementViews = async (projectId) => {
        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (!userId) return;

        const userViewsRef = doc(db, "userViews", userId);
        const userViewsDoc = await getDoc(userViewsRef);

        if (userViewsDoc.exists()) {
            const viewedProjects = userViewsDoc.data().viewedProjects || [];
            if (!viewedProjects.includes(projectId)) {
                await updateDoc(userViewsRef, { viewedProjects: arrayUnion(projectId) });
                await updateDoc(doc(db, "projects", projectId), { views: increment(1) });
            }
        } else {
            await setDoc(userViewsRef, { viewedProjects: [projectId] });
            await updateDoc(doc(db, "projects", projectId), { views: increment(1) });
        }
    };

    const showProjectDetail = (projectId) => {
        setSelectedProject(projectId);
        setShowPopup(true);
        incrementViews(projectId);
    };

    const navigateToMyPage = (userId, event) => {
        event.stopPropagation();
        navigate(`/userProfile/${btoa(userId)}`);
    };

    return (
        <div className="projectList">
            {projects.length > 0 ? (
                <>
                    {projects.map(project => (
                        <div key={project.id} className={`projectDiv ${project.id.startsWith('temp') ? 'temp' : ''}`}
                            onClick={() => !project.id.startsWith('temp') && showProjectDetail(project.id)}>
                            <div className="projectThumbnail">
                                <img src={project.thumbnailUrl} alt={`${project.title} 프로젝트 썸네일`} />
                            </div>
                            <div className='info'>
                                <div className="authorContainer">
                                    <img src={project.authorPhotoURL}
                                        onClick={(event) => navigateToMyPage(project.userId, event)}
                                        alt="Author"
                                        className="author-profile-image" />
                                    <div className="projectAuthor">{project.authorName}</div>
                                </div>
                                <div className="textInfo">
                                    <div className="projectTitle">{project.title}</div>
                                    <div className="projectStats">
                                        <span className="projectViews">
                                            {project.views > 0 ? `조회수 ${project.views}회` : '아무도 안 봄'}
                                        </span>
                                        <span className="projectCreatedAt">{project.relativeDate}</span>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                    {showPopup && (
                        <ProjectDetail
                            projectId={selectedProject}
                            setShowPopup={setShowPopup}
                            onPopupClose={onPopupClose}
                        />
                    )}
                </>
            ) : (
                <>
                    <div className="no-results">இ௰இ</div>
                </>
            )}
        </div>
    );
}

export default ProjectList;