import React, { useState } from 'react';
import { storage, db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function ProjectUpload() {
    const [image, setImage] = useState(null);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [link, setLink] = useState('');

    const handleImageChange = e => {
        if (e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    };

    const handleFileChange = e => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const uploadFile = async (file, folder) => {
        const fileRef = ref(storage, `${folder}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const saveProjectData = async (userId, title, description, link, imageUrl, fileUrl) => {
        try {
            const docRef = await addDoc(collection(db, "projects"), {
                userId,
                title, // title 추가
                description,
                link,
                imageUrl,
                fileUrl,
                createdAt: new Date()
            });
            console.log("문서 작성 성공, ID:", docRef.id);
        } catch (e) {
            console.error("문서 작성 에러:", e);
        }
    };

    const uploadToFirebase = async () => {
        let imageUrl, fileUrl;
        if (image) {
            imageUrl = await uploadFile(image, 'images');
            console.log('이미지 URL:', imageUrl);
        }
        if (file) {
            fileUrl = await uploadFile(file, 'files');
            console.log('파일 URL:', fileUrl);
        }

        const userId = auth.currentUser ? auth.currentUser.uid : null;
        if (userId && (imageUrl || fileUrl)) {
            saveProjectData(userId, title, description, link, imageUrl, fileUrl);
        }
    };

    const handleSubmit = e => {
        e.preventDefault();
        uploadToFirebase();
    };

    return (
        <div className="projectUpload">
            <form onSubmit={handleSubmit}>
                <p>프로젝트 이름</p>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} /> {/* 프로젝트 이름 입력 필드 */}

                <p>이미지</p>
                <input type="file" onChange={handleImageChange} />

                <p>설명</p>
                <input type="text" value={description} onChange={e => setDescription(e.target.value)} />

                <p>링크</p>
                <input type="text" value={link} onChange={e => setLink(e.target.value)} />

                <p>파일</p>
                <input type="file" onChange={handleFileChange} />

                <button type="submit">업로드</button>
            </form>
        </div>
    );
}

export default ProjectUpload;
