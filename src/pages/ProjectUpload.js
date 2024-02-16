import React, { useState, useRef } from 'react';
import { storage, db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import '../styles/ProjectDetail.css';
import { useNavigate } from 'react-router-dom';

import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { BiSolidDownload } from "react-icons/bi";
import { FaStar, FaRegStar, FaStarHalfAlt, FaRegShareSquare } from 'react-icons/fa';
import { MdDeleteOutline, MdArrowForwardIos, MdArrowBackIosNew } from "react-icons/md";
import { IoMdClose } from "react-icons/io";
import { TbThumbUp, TbThumbUpFilled } from "react-icons/tb";
import { LiaEditSolid } from "react-icons/lia";

function ProjectUpload() {

    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const navigate = useNavigate()

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages([...images, ...Array.from(e.target.files).slice(0, 5 - images.length)]);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // 파일 입력 필드 초기화
            }
        }
    };

    const setAsThumbnail = (index) => {
        setImages((prevImages) => {
            const newImages = [...prevImages];
            const selectedImage = newImages.splice(index, 1)[0];
            newImages.unshift(selectedImage);
            return newImages;
        });
    };

    const removeImage = (index) => {
        setImages((prevImages) => prevImages.filter((_, i) => i !== index));
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // 파일 입력 필드 초기화
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFiles = async (files, folder) => {
        const urls = [];
        for (const file of files) {
            const fileRef = ref(storage, `${folder}/${file.name}`);
            await uploadBytes(fileRef, file);
            const url = await getDownloadURL(fileRef);
            urls.push(url);
        }
        return urls;
    };

    const uploadFile = async (file, folder) => {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const saveProjectData = async (userId, title, description, link, imageUrls, fileUrl) => {
        try {
            const projectData = {
                userId,
                title,
                description,
                link,
                imageUrls,
                views: 0,
                createdAt: new Date(),
            };

            // fileUrl이 정의되어 있지 않은 경우를 고려하여 추가
            if (fileUrl) {
                projectData.fileUrl = fileUrl;
            }

            await addDoc(collection(db, 'projects'), projectData);
            alert('업로드 완료');
            navigate('/');
        } catch (e) {
            console.error('문서 작성 에러: ', e);
        }
    };

    const uploadToFirebase = async () => {
        setIsUploading(true); // 업로드 시작

        let imageUrls = [], fileUrl;
        if (images.length) {
            imageUrls = await uploadFiles(images, 'images');
        }
        if (file) {
            fileUrl = await uploadFile(file, 'files');
        }

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (userId) {
            try {
                await saveProjectData(userId, title, description, link, imageUrls, fileUrl);
                alert('업로드 완료');
                navigate('/');
            } catch (error) {
                console.error('업로드 중 오류 발생:', error);
                alert('업로드에 실패했습니다.');
            } finally {
                setIsUploading(false); // 업로드 완료 또는 실패 시
            }
        } else {
            alert('로그인이 필요합니다.');
            setIsUploading(false); // 사용자가 로그인하지 않은 경우
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
        e.preventDefault();
        uploadToFirebase();
    };

    return (
        <div className="project-detail-popup-up">
            <form>
                <div className="project-detail-container">
                    <div className="project-content-up">
                        <div className="project-image-slider" id='slider-up' >
                            <img />
                            <div className="image-index-overlay">(1/5)</div>
                            <div>
                                <button className="slider-button prev-button"><MdArrowBackIosNew size={'20px'} /></button>
                                <button className="slider-button next-button"><MdArrowForwardIos size={'20px'} /></button>
                            </div>
                        </div>
                        <div className="project-info">
                            <div className="project-info-header">
                                <h2 className="project-title">
                                    <input type="text" placeholder='프로젝트 제목' value={title} onChange={(e) => setTitle(e.target.value)} />
                                </h2>
                                <div className="project-date-views">
                                    <span className="project-date">new Date</span>
                                    <span className="project-views">조회수 100회</span>
                                </div>
                            </div>
                            <div className="project-info-body">
                                <span className="project-author">이름</span>
                                <div className="project-actions">
                                    <button className="like-button" title='좋아요'><span className="likes-count"><TbThumbUp size={"20px"} />99</span></button>
                                    <button className="bookmark-button" title='북마크'><BsBookmark size={"20px"} /></button>
                                    <button className="share-button" title='공유'><FaRegShareSquare size={'20px'} /> </button>
                                    <button className="download-button" title='다운로드'><BiSolidDownload size={"20px"} /></button>
                                    <button className="edit-button" title='수정'><LiaEditSolid size={"20px"} /></button>
                                    <button className="delete-button" title='삭제'><MdDeleteOutline size={"20px"} /></button>
                                </div>
                            </div>
                            <input type="text" className='project-url' value={link} placeholder='https://example.com' onChange={(e) => setLink(e.target.value)} />
                            <p className="project-description">
                                <textarea
                                    className='up-texta'
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    rows="5"
                                    placeholder="프로젝트에 대한 설명을 작성하세요"
                                >
                                </textarea>
                                <p>({description.length}/{maxDescriptionLength})</p>
                            </p>
                        </div>
                    </div>
                    <div className="project-comments-section-up">
                        <p>이미지 (최대 5개)</p>
                        <p style={{ fontSize: '13px', fontWeight: 'normal' }}>좌클릭 썸네일 선택, 우클릭 삭제</p>
                        <input type="file" multiple onChange={handleImageChange} ref={fileInputRef} />
                        <div className="image-preview">
                            {images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`preview-item ${index === 0 ? 'selected-thumbnail' : ''}`}
                                    onClick={() => setAsThumbnail(index)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        removeImage(index);
                                    }}
                                >
                                    <img src={URL.createObjectURL(image)} alt={`이미지-${index}`} />
                                </div>
                            ))}
                        </div>

                        <button type="submit" onClick={handleSubmit} disabled={isUploading}>업로드</button>
                    </div>
                </div>
            </form>
        </div >
    );
}

export default ProjectUpload;