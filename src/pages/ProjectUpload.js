import React, { useState, useRef } from 'react';
import { storage, db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import '../styles/ProjectUpload.css';

function ProjectUpload() {
    const [images, setImages] = useState([]);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');

    const fileInputRef = useRef(null); // 파일 입력을 위한 ref

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
        } catch (e) {
            console.error('문서 작성 에러: ', e);
        }
    };

    const uploadToFirebase = async () => {
        let imageUrls = [], fileUrl;
        if (images.length) {
            imageUrls = await uploadFiles(images, 'images');
        }
        if (file) {
            fileUrl = await uploadFile(file, 'files');
        }

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (userId) {
            saveProjectData(userId, title, description, link, imageUrls, fileUrl);
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
        <div className="projectUpload">
            <form onSubmit={handleSubmit}>
                <p>프로젝트 이름</p>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

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
                <p>설명</p>
                <textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    rows="8"
                    placeholder="프로젝트에 대한 설명을 작성하세요"
                ></textarea>
                <p>({maxDescriptionLength - description.length}/{maxDescriptionLength})</p>
                <p>URL</p>
                <input type="text" value={link} onChange={(e) => setLink(e.target.value)} />

                <p>파일</p>
                <input type="file" onChange={handleFileChange} />

                <button type="submit">업로드</button>
            </form>
        </div>
    );
}

export default ProjectUpload;