import React, { useState, useRef, useEffect } from 'react';
import { storage, db, auth } from '../firebase';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

import '../styles/ProjectDetail.css';
import '../styles/ProjectUpload.css'

import { BsBookmark } from 'react-icons/bs';
import { BiSolidDownload } from "react-icons/bi";
import { FaRegShareSquare } from 'react-icons/fa';
import { MdDeleteOutline, MdArrowForwardIos, MdArrowBackIosNew } from "react-icons/md";
import { TbThumbUp } from "react-icons/tb";
import { LiaEditSolid } from "react-icons/lia";

function ProjectUpload() {

    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [thumbnailIndex, setThumbnailIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [authorDisplayName, setAuthorDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hashtags, setHashtags] = useState(['#세붕이']);
    const navigate = useNavigate()

    useEffect(() => {

        const fetchAuthorDisplayName = async () => {
            if (auth.currentUser) {
                const userRef = doc(db, "users", auth.currentUser.uid);
                const docSnap = await getDoc(userRef);
                if (docSnap.exists()) {
                    setAuthorDisplayName(docSnap.data().displayName);
                } else {
                    console.log("해당 사용자를 찾을 수 없습니다.");
                }
            }
        };

        fetchAuthorDisplayName();

        const timer = setInterval(() => {
            setCurrentTime(new Date()); // 1초마다 현재 시간 업데이트
        }, 1000);

        return () => clearInterval(timer); // 컴포넌트 언마운트 시 타이머 정리
    }, []);

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages([...images, ...Array.from(e.target.files).slice(0, 5 - images.length)]);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleImageClick = (index) => {
        setThumbnailIndex(index);
    };

    const removeImage = (index) => {
        // 현재 보여지는 이미지가 삭제되면, 다음 이미지 또는 이전 이미지로 이동
        let newIndex = currentImageIndex;

        if (images.length === 1) {
            // 마지막 남은 이미지를 삭제하는 경우
            newIndex = 0;
        } else if (index === currentImageIndex) {
            // 현재 표시된 이미지를 삭제하는 경우
            if (index === images.length - 1) {
                // 마지막 이미지를 삭제하는 경우, 인덱스를 하나 줄임
                newIndex = currentImageIndex - 1;
            } // 그 외 경우는 다음 이미지를 보여줄 수 있으므로 인덱스 조정 필요 없음
        } else if (index < currentImageIndex) {
            // 현재 표시된 이미지보다 앞에 있는 이미지를 삭제하는 경우, 인덱스 조정
            newIndex = currentImageIndex - 1;
        }

        // 이미지 배열에서 해당 이미지 삭제 후, 현재 이미지 인덱스 업데이트
        setImages(prevImages => prevImages.filter((_, i) => i !== index));
        setCurrentImageIndex(newIndex);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 이전 이미지로 이동하는 함수
    const handlePrevImage = () => {
        setCurrentImageIndex(prevIndex => prevIndex > 0 ? prevIndex - 1 : images.length - 1);
    };

    // 다음 이미지로 이동하는 함수
    const handleNextImage = () => {
        setCurrentImageIndex(prevIndex => prevIndex < images.length - 1 ? prevIndex + 1 : 0);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFiles = async (files, folder) => {
        setIsUploading(true);
        setIsLoading(true);
        try {
            const urls = [];
            for (const file of files) {
                const fileRef = ref(storage, `${folder}/${file.name}`);
                await uploadBytes(fileRef, file);
                const url = await getDownloadURL(fileRef);
                urls.push(url);
            }
            return urls;
        } catch (error) {
            console.error('업로드 중 오류 발생:', error);
            alert('업로드에 실패했습니다.');
        } finally {
            setIsUploading(false);
            setIsLoading(false);
        }
    };

    const uploadFile = async (file, folder) => {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const saveProjectData = async (userId, title, description, link, imageUrls, fileUrl) => {
        const thumbnailUrl = imageUrls[thumbnailIndex];

        const filteredHashtags = hashtags.filter(tag => tag.trim() !== '#');

        try {
            const projectData = {
                userId,
                title,
                description,
                link,
                imageUrls,
                thumbnailUrl,
                fileUrl,
                hashtags: filteredHashtags,
                views: 0,
                likesCount: 0,
                createdAt: new Date(),
                ratingAverage: 0
            };

            if (fileUrl) {
                projectData.fileUrl = fileUrl;
            }

            await addDoc(collection(db, 'projects'), projectData);
            navigate('/');
        } catch (e) {
            console.error('문서 작성 에러: ', e);
        }
    };

    const uploadToFirebase = async () => {
        setIsUploading(true);

        // 이미지 업로드
        const imageUrls = await uploadFiles(images, 'images');

        let fileUrl = "";
        if (file) {
            // 파일 업로드 및 URL 반환
            fileUrl = await uploadFile(file, 'files');
        }

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (userId) {
            try {
                // fileUrl은 실제 파일의 URL
                await saveProjectData(userId, title, description, link, imageUrls, fileUrl);

                alert('업로드 완료');
                navigate('/');
            } catch (error) {
                console.error('업로드 중 오류 발생:', error);
                alert('업로드에 실패했습니다.');
            } finally {
                setIsUploading(false);
            }
        } else {
            alert('로그인이 필요합니다.');
            setIsUploading(false);
        }
    };

    const maxDescriptionLength = 800;

    const handleDescriptionChange = (e) => {
        const text = e.target.value;
        if (text.length <= maxDescriptionLength) {
            setDescription(text);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // 폼의 기본 제출 동작 방지

        // 필수 요소 검증
        if (!title.trim() || !description.trim() || images.length === 0) {
            return;
        }

        // 모든 검증을 통과했을 경우, 업로드 로직 실행
        uploadToFirebase();
    };


    const reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        return result;
    };

    const onDragEnd = (result) => {
        // 드롭되지 않은 아이템은 무시
        if (!result.destination) {
            return;
        }

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        // 이미지 순서 변경
        const newImages = reorder(
            images,
            sourceIndex,
            destinationIndex
        );

        // 썸네일 인덱스 업데이트
        let newThumbnailIndex = thumbnailIndex;
        if (thumbnailIndex === sourceIndex) {
            // 원래 썸네일이 이동한 경우, 썸네일 인덱스를 목적지 인덱스로 업데이트
            newThumbnailIndex = destinationIndex;
        } else if (thumbnailIndex > sourceIndex && thumbnailIndex <= destinationIndex) {
            // 원래 썸네일이 이동 범위 안에 있고, 드래그된 아이템이 썸네일 앞에서 뒤로 이동한 경우
            newThumbnailIndex -= 1;
        } else if (thumbnailIndex < sourceIndex && thumbnailIndex >= destinationIndex) {
            // 원래 썸네일이 이동 범위 안에 있고, 드래그된 아이템이 썸네일 뒤에서 앞으로 이동한 경우
            newThumbnailIndex += 1;
        }

        // 상태 업데이트
        setImages(newImages);
        setThumbnailIndex(newThumbnailIndex);
    };

    const handleHashtagChange = (value, index) => {
        if (!value.startsWith('#')) {
            value = '#' + value; // '#' 추가
        }

        const newHashtags = [...hashtags];
        newHashtags[index] = value;

        // 빈 문자열인 요소 제거
        const filteredHashtags = newHashtags.filter(tag => tag.trim() !== '#');

        // 첫 번째 요소는 삭제되지 않도록
        if (index !== 0) {
            setHashtags(filteredHashtags);
        } else {
            setHashtags([filteredHashtags[0], ...filteredHashtags.slice(2)]);
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // 엔터 키 입력 방지
            addHashtagInput();
        }
    };

    const addHashtagInput = () => {
        if (hashtags.length < 5) { // 최대 5개까지만 추가
            setHashtags([...hashtags, '#']); // 빈 문자열 추가
            setTimeout(() => { // 비동기 처리를 위해 setTimeout 사용
                const inputs = document.querySelectorAll('.hashtag-input input');
                const lastInput = inputs[inputs.length - 1];
                lastInput.focus(); // 마지막 입력란에 포커스 이동
            }, 0);
        }
    };

    return (
        <div className='uploadWrap'>
            <div className="project-detail-popup-up">
                {isLoading && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
                <form>
                    <div className="project-detail-container">
                        <div className="project-content-up">
                            <div className="project-image-slider" id='slider-up'>
                                {images.length > 0 && (
                                    <img src={URL.createObjectURL(images[currentImageIndex])} alt={`작품 이미지 ${currentImageIndex + 1}`} />
                                )}
                                <div className="image-index-overlay">
                                    {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : "0/0"}
                                </div>
                                <div>
                                    <button type="button" className="slider-button prev-button" onClick={handlePrevImage}><MdArrowBackIosNew size={'20px'} /></button>
                                    <button type="button" className="slider-button next-button" onClick={handleNextImage}><MdArrowForwardIos size={'20px'} /></button>
                                </div>
                            </div>
                            <div className="project-info">
                                <div className="project-info-header">
                                    <h2 className="project-title">
                                        <input type="text" placeholder='작품 제목' value={title} onChange={(e) => setTitle(e.target.value)} />
                                    </h2>
                                    <div className="project-date-views">
                                        <span className="project-date">{currentTime.toLocaleString()}</span>
                                        <span className="project-views">조회수 100회</span>
                                    </div>
                                </div>
                                <div className="project-info-body">
                                    <span className="project-author">{authorDisplayName || '알 수 없음'}</span>
                                    <div className="project-actions">
                                        <button className="like-button" tabIndex="-1" type='button'><span className="likes-count"><TbThumbUp size={"20px"} />0</span></button>
                                        <button className="bookmark-button" tabIndex="-1" type='button'><BsBookmark size={"20px"} /></button>
                                        <button className="share-button" tabIndex="-1" type='button' ><FaRegShareSquare size={'20px'} /> </button>
                                        <button className="download-button" tabIndex="-1" type='button' ><BiSolidDownload size={"20px"} /></button>
                                        <button className="edit-button" tabIndex="-1" type='button'><LiaEditSolid size={"20px"} /></button>
                                        <button className="delete-button" tabIndex="-1" type='button' ><MdDeleteOutline size={"20px"} /></button>
                                    </div>
                                </div>
                                <input type="text" className='project-url' value={link} placeholder='https://example.com' onChange={(e) => setLink(e.target.value)} />
                                <div className="project-description">
                                    <textarea
                                        className='up-texta'
                                        value={description}
                                        onChange={handleDescriptionChange}
                                        rows="7"
                                        placeholder="작품에 대한 설명을 작성하세요"
                                    >
                                    </textarea>
                                    <p>({description.length}/{maxDescriptionLength})</p>
                                </div>

                                <p>파일</p>
                                <input type="file" onChange={handleFileChange} />
                            </div>
                        </div>
                        <div className="project-comments-section-up">
                            <p>이미지 (최대 5개)</p>
                            <p style={{ fontSize: '13px', fontWeight: 'normal' }}>클릭해서 썸네일 지정</p>
                            <input type="file" multiple onChange={handleImageChange} ref={fileInputRef} />
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="droppable-images" direction="horizontal">
                                    {(provided, snapshot) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="image-preview">
                                            {images.map((image, index) => (
                                                <Draggable key={index} draggableId={`image-${index}`} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`preview-item ${index === thumbnailIndex ? 'thumbnail-selected' : ''}`}
                                                            onClick={() => handleImageClick(index)}
                                                        >
                                                            <img src={URL.createObjectURL(image)} alt={`이미지-${index}`} />
                                                            {index === thumbnailIndex && (
                                                                <div className="thumbnail-text">썸네일</div>
                                                            )}
                                                            <button
                                                                type='button'
                                                                className="delete-img"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // 이미지 선택 이벤트 방지
                                                                    removeImage(index);
                                                                }}
                                                                title="삭제"
                                                            >
                                                                <MdDeleteOutline size={"20px"} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>

                            <p>#카테고리</p>
                            <div className="hashtag-inputs">
                                {hashtags.map((tag, index) => (
                                    <div key={index} className="hashtag-input">
                                        <input
                                            type="text"
                                            placeholder={`#세붕이`}
                                            value={tag}
                                            onChange={(e) => handleHashtagChange(e.target.value, index)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                className={`submitBtn ${isUploading || !title.trim() || !description.trim() || images.length === 0 ? 'disabled' : ''}`}
                                onClick={handleSubmit}
                                disabled={isUploading || !title.trim() || !description.trim() || images.length === 0}
                            >
                                업로드
                            </button>
                            <p>※ 제목, 내용, 이미지는 필수입니다</p>
                        </div>
                    </div>
                </form>
            </div >
        </div>
    );
}

export default ProjectUpload;