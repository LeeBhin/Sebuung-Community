import React, { useState, useEffect, useRef, useCallback } from 'react';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, updateDoc, where } from 'firebase/firestore';
import '../styles/ProjectDetail.css';

import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { BiSolidDownload } from "react-icons/bi";
import { FaStar, FaRegStar, FaStarHalfAlt, FaRegShareSquare } from 'react-icons/fa';
import { MdDeleteOutline, MdArrowForwardIos, MdArrowBackIosNew } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { TbThumbUp, TbThumbUpFilled } from "react-icons/tb";
import { LiaEditSolid } from "react-icons/lia";

const defaultProfileImageUrl = 'https://cdn.vox-cdn.com/thumbor/PzidjXAPw5kMOXygTMEuhb634MM=/11x17:1898x1056/1200x800/filters:focal(807x387:1113x693)/cdn.vox-cdn.com/uploads/chorus_image/image/72921759/vlcsnap_2023_12_01_10h37m31s394.0.jpg';

function ensureAbsoluteUrl(url) {
    // URL이 절대경로인지 확인하고 아닌 경우 http://를 붙여줍니다.
    return url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;
}

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

function ProjectDetail({ projectId, setShowPopup, onPopupClose, onTagClick }) {
    const [projectData, setProjectData] = useState(null);
    const [authorName, setAuthorName] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAuthor, setIsAuthor] = useState(false);
    const [comment, setComment] = useState("");
    const [comments, setComments] = useState([]);
    const [rating, setRating] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const navigate = useNavigate();

    const popupRef = useRef();

    useEffect(() => {
        const fetchProjectData = async () => {
            const projectDocRef = doc(db, "projects", projectId);
            const projectDocSnapshot = await getDoc(projectDocRef);

            if (projectDocSnapshot.exists()) {
                const projectInfo = projectDocSnapshot.data();

                projectInfo.createdAt = projectInfo.createdAt.toDate().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                });

                setProjectData(projectInfo);

                // 추천한 작품인지 확인
                const user = auth.currentUser;
                if (user) {
                    const userLikes = projectInfo.likes || [];
                    const userHasLiked = userLikes.includes(user.uid);
                    setIsLiked(userHasLiked);
                }

                // likesCount 초기화
                setLikesCount(projectInfo.likesCount || 0);

                const authorUid = projectInfo.userId;
                const authorRef = doc(db, "users", authorUid);
                const authorDocSnapshot = await getDoc(authorRef);
                if (authorDocSnapshot.exists()) {
                    const authorInfo = authorDocSnapshot.data();
                    setAuthorName(authorInfo.displayName);
                    // 프로젝트 데이터에 작성자의 photoURL 추가
                    setProjectData(prevData => ({ ...prevData, authorPhotoURL: authorInfo.photoURL || defaultProfileImageUrl }));
                } else {
                    setAuthorName("알 수 없는 사용자");
                    setProjectData(prevData => ({ ...prevData, authorPhotoURL: defaultProfileImageUrl }));
                }

                if (auth.currentUser) {
                    const userRef = doc(db, "users", auth.currentUser.uid);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setIsBookmarked(userData.bookmarks?.includes(projectId));
                    }
                }

                const isAuthor = auth.currentUser && auth.currentUser.uid === projectInfo.userId;
                setIsAuthor(isAuthor);
            } else {
                console.log("해당 문서가 존재하지 않습니다.");
            }
        };

        fetchProjectData();
    }, [projectId]);

    const handleEditProject = () => {
        navigate(`/edit/${projectId}`);
    };

    const handleDeleteProject = async () => {
        const isConfirmed = window.confirm('이 프로젝트를 삭제하시겠습니까?');
        if (isConfirmed) {
            try {
                await deleteDoc(doc(db, "projects", projectId));
                window.location.reload();
            } catch (error) {
                console.error("프로젝트 삭제 중 오류 발생:", error);
                alert('프로젝트 삭제에 실패했습니다.', error);
            }
        }
    };

    const handlePrevClick = () => {
        setCurrentImageIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : 0);
    };

    const handleNextClick = () => {
        setCurrentImageIndex(prevIndex =>
            prevIndex < projectData.imageUrls.length - 1 ? prevIndex + 1 : prevIndex
        );
    };

    const downloadFile = () => {
        if (projectData.fileUrl) {
            window.open(projectData.fileUrl);
        }
    };

    const toggleBookmark = async () => {
        const newBookmarkStatus = !isBookmarked;
        setIsBookmarked(newBookmarkStatus);

        const userRef = doc(db, "users", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            let updatedBookmarks = userDoc.data().bookmarks || [];
            if (newBookmarkStatus) {
                updatedBookmarks = [...updatedBookmarks, projectId];
            } else {
                updatedBookmarks = updatedBookmarks.filter(id => id !== projectId);
            }

            await updateDoc(userRef, {
                bookmarks: updatedBookmarks
            });
        }
    };

    const handleClosePopup = useCallback(() => {
        setIsClosing(true); // 닫힘 애니메이션 시작
        setTimeout(() => { // 애니메이션 지속 시간 후 실제로 팝업 닫기
            setShowPopup(false);
            onPopupClose();
        }, 500); // 0.5초 후 실행 (애니메이션 시간과 일치)
    }, [setShowPopup, onPopupClose]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                handleClosePopup();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClosePopup]);

    const handleShare = () => {
        const encodedProjectId = btoa(projectId);
        const shareUrl = `${window.location.origin}/?sharingcode=${encodedProjectId}`;

        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert("공유 URL이 클립보드에 복사되었습니다.");
            })
            .catch(err => {
                console.error("클립보드에 복사 실패:", err);
                alert("URL 복사에 실패했습니다.");
            });
    };

    const submitComment = async () => {
        if (!auth.currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }

        if (comment.trim() === "" && rating <= 0) {
            alert("댓글 또는 별점을 입력해주세요.");
            return;
        }

        setIsSubmitting(true); // 댓글 제출 시작 시

        const existingCommentQuery = query(collection(db, "comments"), where("projectId", "==", projectId), where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(existingCommentQuery);

        if (!querySnapshot.empty) {
            alert("이미 이 프로젝트에 댓글을 달았습니다.");
            setIsSubmitting(false); // 댓글이 이미 존재하면 작업 종료 시
            return;
        }

        const commentData = {
            projectId,
            userId: auth.currentUser.uid,
            comment: comment.trim(),
            rating,
            createdAt: new Date(),
            likes: [],
            commentLikesCount: 0
        };

        try {
            await addDoc(collection(db, "comments"), commentData);
            setComment("");
            setRating(0);
            fetchComments();
            updateProjectRatingAverage(projectId);
        } catch (error) {
            console.error("댓글 추가 실패:", error);
            alert("댓글을 추가하는데 실패했습니다.");
        }

        setIsSubmitting(false); // 댓글 작업 완료 시
    };

    useEffect(() => {
        fetchComments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchComments = async () => {
        const q = query(collection(db, "comments"), where("projectId", "==", projectId), orderBy("commentLikesCount", "desc"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const commentsWithUsernamesAndPhotos = [];

        for (const docSnapshot of querySnapshot.docs) {
            const commentData = docSnapshot.data();
            const userRef = doc(db, "users", commentData.userId);
            const userSnapshot = await getDoc(userRef);

            if (userSnapshot.exists()) {
                const userData = userSnapshot.data();
                commentsWithUsernamesAndPhotos.push({
                    ...commentData,
                    id: docSnapshot.id,
                    displayName: userData.displayName || "익명",
                    photoURL: userData.photoURL || defaultProfileImageUrl // 기본 이미지 경로로 대체
                });
            } else {
                commentsWithUsernamesAndPhotos.push({
                    ...commentData,
                    id: docSnapshot.id,
                    displayName: "알 수 없음",
                    photoURL: defaultProfileImageUrl
                });
            }
        }

        setComments(commentsWithUsernamesAndPhotos);
    };

    function StarRating({ rating, setRating }) {
        const handleRatingSelect = (index, position) => {
            const rect = position.currentTarget.getBoundingClientRect();
            const positionX = position.clientX || position.changedTouches[0].clientX;
            const clickPosition = positionX - rect.left;
            const halfWidth = rect.width / 2;

            if (clickPosition < halfWidth) {
                setRating(index - 0.5);
            } else {
                setRating(index);
            }
        };

        const handleStarClick = (index, event) => {
            handleRatingSelect(index, event);
        };

        const handleStarTouch = (index, event) => {
            event.preventDefault();
            handleRatingSelect(index, event);
        };

        return (
            <div>
                {[...Array(5)].map((_, index) => {
                    const starIndex = index + 1;
                    return (
                        <button
                            key={starIndex}
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={(e) => handleStarClick(starIndex, e)}
                            onTouchEnd={(e) => handleStarTouch(starIndex, e)}
                        >
                            {starIndex <= rating ? (
                                <FaStar color="#ffc107" size={'25px'} />
                            ) : starIndex - 0.5 === rating ? (
                                <FaStarHalfAlt color="#ffc107" size={'25px'} />
                            ) : (
                                <FaRegStar color="#ffc107" size={'25px'} />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    function StarDisplay({ rating }) {
        const totalStars = 5;
        let stars = [];

        let [intPart, decimalPart] = parseFloat(rating).toString().split('.').map(num => parseInt(num, 10));
        decimalPart = decimalPart ? decimalPart / 10 : 0;

        for (let i = 0; i < intPart; i++) {
            stars.push(<FaStar key={i} color="#ffc107" />);
        }

        if (decimalPart >= 0.5) {
            stars.push(<FaStarHalfAlt key="half" color="#ffc107" />);
            intPart += 1;
        }

        for (let i = intPart; i < totalStars; i++) {
            stars.push(<FaRegStar key={i} color="#ffc107" />);
        }

        return <div style={{ display: 'flex' }}>{stars}</div>;
    }

    const handleDeleteComment = async (commentId) => {
        if (window.confirm("정말로 삭제하시겠습니까?")) {
            try {
                await deleteDoc(doc(db, "comments", commentId));
                updateProjectRatingAverage(projectId);
                fetchComments();
            } catch (error) {
                console.error("삭제 중 오류 발생:", error);
                alert("삭제에 실패했습니다.");
            }
        }
    };

    const updateProjectRatingAverage = async (projectId) => {
        const ratingsQuery = query(collection(db, "comments"), where("projectId", "==", projectId));
        const snapshot = await getDocs(ratingsQuery);

        let totalRating = 0;
        snapshot.forEach(doc => {
            totalRating += doc.data().rating;
        });

        const ratingCount = snapshot.size;

        const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

        const projectRef = doc(db, "projects", projectId);
        await updateDoc(projectRef, {
            ratingAverage: averageRating,
            ratingCount: ratingCount
        });
    };


    const toggleLike = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("로그인이 필요합니다.");
            return;
        }

        const projectRef = doc(db, "projects", projectId);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const userLikes = projectData.likes || [];
            const userHasLiked = userLikes.includes(user.uid);

            let updatedLikes;
            if (userHasLiked) {
                // 이미 추천한 경우, 추천 취소
                updatedLikes = userLikes.filter(id => id !== user.uid);
            } else {
                // 아직 추천하지 않은 경우, 추천 추가
                updatedLikes = [...userLikes, user.uid];
            }

            // likesCount를 projects 컬렉션의 likes 배열의 길이로 설정
            const likesCount = updatedLikes.length;

            await updateDoc(projectRef, {
                likes: updatedLikes,
                likesCount: likesCount // likesCount 업데이트
            });

            // 상태 업데이트
            setLikesCount(likesCount);
            setIsLiked(!userHasLiked);
        }
    };

    const handlePopupClick = (event) => {
        event.stopPropagation();
    };

    const navigateToMyPage = (userId, event) => {
        event.stopPropagation(); // 이벤트 버블링 방지
        const encodedUserId = btoa(userId);
        navigate(`/userProfile/${encodedUserId}`);
        handleClosePopup()
    };

    const handleLikeComment = async (commentId) => {
        const commentRef = doc(db, "comments", commentId);
        const commentSnap = await getDoc(commentRef);
        const commentData = commentSnap.data();
        const userId = auth.currentUser.uid; // 현재 로그인한 사용자 ID

        let updatedLikes = commentData.likes || [];
        if (updatedLikes.includes(userId)) {
            // 사용자 ID가 이미 있으면 좋아요 취소
            updatedLikes = updatedLikes.filter(id => id !== userId);
        } else {
            // 사용자 ID가 없으면 좋아요 추가
            updatedLikes.push(userId);
        }

        // 좋아요를 토글할 때마다 commentLikesCount를 업데이트합니다.
        const updatedCommentLikesCount = updatedLikes.length;

        // Firestore에 업데이트할 데이터
        const updatedData = {
            likes: updatedLikes,
            commentLikesCount: updatedCommentLikesCount
        };

        // Firestore에 업데이트
        await updateDoc(commentRef, updatedData);
        // 댓글 목록을 다시 불러오거나 상태를 업데이트하여 UI를 새로고침
        fetchComments();
    };

    const handleTagClick = (tag) => {
        onTagClick(tag); // 부모 컴포넌트로 태그 클릭 이벤트 전달
    };

    return (
        <div className="project-detail-overlay" onClick={handleClosePopup}>
            <div className={`project-detail-popup ${isClosing ? 'closing' : ''}`} onClick={handlePopupClick}>
                <button className="close-button" onClick={() => handleClosePopup()}><IoMdClose className='closeBtn' /></button>
                <div className="project-detail-container">
                    <div className="project-content">
                        {projectData && (
                            <>
                                <div className="project-image-slider">
                                    <div
                                        className="project-images-container"
                                        style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                                    >
                                        {projectData.imageUrls.map((url, index) => (
                                            <img key={index} src={url} alt={`이미지 ${index + 1}`} />
                                        ))}
                                    </div>
                                    {currentImageIndex > 0 && (
                                        <button className="slider-button prev-button" onClick={handlePrevClick}>
                                            <MdArrowBackIosNew size={'20px'} />
                                        </button>
                                    )}
                                    {currentImageIndex < projectData.imageUrls.length - 1 && (
                                        <button className="slider-button next-button" onClick={handleNextClick}>
                                            <MdArrowForwardIos size={'20px'} />
                                        </button>
                                    )}
                                    <div className="image-index-overlay">
                                        {currentImageIndex + 1}/{projectData.imageUrls.length}
                                    </div>
                                </div>
                                <div className="project-info">
                                    <div className="project-info-header">
                                        <h2 className="project-title">{projectData.title}</h2>
                                        <div className="project-date-views">
                                            <span className="project-date" {...(projectData.updatedAt && { title: `수정됨: ${projectData.updatedAt.toDate().toLocaleString('ko-KR')}` })}>
                                                {projectData.createdAt}
                                            </span>
                                            <span className="project-views">조회수 {projectData.views}회</span>
                                        </div>
                                    </div>
                                    <div className="project-info-body">
                                        <div className="author-info">
                                            <img src={projectData?.authorPhotoURL || defaultProfileImageUrl}
                                                onClick={(event) => navigateToMyPage(projectData.userId, event)}
                                                alt="Author"
                                                className="author-profile-image" />
                                            <span className="project-author">{authorName}</span>
                                        </div>
                                        <div className="project-actions">
                                            <button className="like-button" onClick={toggleLike} title='추천'>
                                                {isLiked ? <TbThumbUpFilled size={"20px"} /> : <TbThumbUp size={"20px"} />}
                                                <span className="likes-count">{likesCount}</span>
                                            </button>
                                            <button className="bookmark-button" onClick={toggleBookmark} title='북마크'>
                                                {isBookmarked ? <BsBookmarkFill size={"20px"} /> : <BsBookmark size={"20px"} />}
                                            </button>
                                            <button className="share-button" onClick={handleShare} title='공유'><FaRegShareSquare size={'20px'} /> </button>
                                            {projectData.fileUrl && (
                                                <button className="download-button" onClick={downloadFile} title='다운로드'><BiSolidDownload size={"20px"} /></button>
                                            )}
                                            {isAuthor && (
                                                <>
                                                    <button className="edit-button" onClick={handleEditProject} title='수정'><LiaEditSolid size={"20px"} /></button>
                                                    <button className="delete-button" onClick={handleDeleteProject} title='삭제'><MdDeleteOutline size={"20px"} /></button>
                                                </>

                                            )}
                                        </div>
                                    </div>
                                    <a href={ensureAbsoluteUrl(projectData.link)}
                                        className="project-url"
                                        target="_blank"
                                        rel="noopener noreferrer">{projectData.link}</a>
                                    <p className="project-description">{projectData.description}</p>
                                    <p className='project-hashtags'>
                                        {Array.isArray(projectData.hashtags) ? (
                                            projectData.hashtags.map(tag => (
                                                <span key={tag} onClick={() => handleTagClick(tag)}>{tag}</span>
                                            ))
                                        ) : (
                                            <span onClick={() => handleTagClick(projectData.hashtags)}>{projectData.hashtags}</span>
                                        )}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="project-comments-section">
                        <div className="comments-header">
                            <h3>리뷰</h3>

                        </div>
                        <div className="comments-list">
                            {comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <img src={comment.photoURL}
                                        onClick={(event) => navigateToMyPage(comment.userId, event)}
                                        alt="Profile"
                                        className="comment-profile-image" />
                                    <div className="comment-body"> {/* Flex 컨테이너 추가 */}
                                        <div className="commentContent">
                                            <div className='namediv' >
                                                <strong>{comment.displayName}</strong>
                                            </div>
                                            <StarDisplay rating={comment.rating} />
                                            <p>{comment.comment}</p>
                                            <p className="comment-date">{timeAgo(comment.createdAt.toDate())}</p>
                                        </div>
                                    </div>
                                    <div className='comment-text-and-delete'>
                                        {auth.currentUser && auth.currentUser.uid === comment.userId && (
                                            <button className='deleteComment' onClick={() => handleDeleteComment(comment.id)}><MdDeleteOutline size={'20px'} /></button>
                                        )}
                                        <div className="comment-likes">
                                            <button className="like-comment-button" onClick={() => handleLikeComment(comment.id)}>
                                                {comment.likes && comment.likes.includes(auth.currentUser?.uid) ? <TbThumbUpFilled size={"20px"} /> : <TbThumbUp size={"20px"} />}
                                                <span>{comment.likes ? comment.likes.length : 0}</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="rating-input-section">
                            <StarRating rating={rating} setRating={setRating} />
                        </div>
                        <div className="comment-input-section">
                            <input
                                type="text"
                                placeholder="작품을 평가 및 피드백해 주세요! "
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                            <button type="submit" onClick={submitComment} disabled={isSubmitting}>작성</button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
export default ProjectDetail;
