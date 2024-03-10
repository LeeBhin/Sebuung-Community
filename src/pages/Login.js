import React, { useEffect } from 'react';
import { auth, googleProvider, githubProvider, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faGithub } from '@fortawesome/free-brands-svg-icons';
import '../styles/Login.css'; // CSS 파일 임포트

const Login = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/mypage');
        }
    }, [user, navigate]);

    const loginWithProvider = async (provider, providerName) => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const userDoc = doc(db, 'users', user.uid);
            const userData = {
                displayName: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
                creationDate: new Date(),
                authMethod: providerName
            };
            await setDoc(userDoc, userData, { merge: true });

            const authin = getAuth();
            setPersistence(authin, browserLocalPersistence)
                .then(() => {
                    // 인증 상태 지속성이 LOCAL로 설정되었습니다.
                    // 이제 사용자의 로그인 상태가 브라우저를 닫아도 유지됩니다.
                })
                .catch((error) => {
                    console.error("인증 상태 지속성 설정 중 오류 발생:", error);
                });
        } catch (error) {
            console.error("로그인 실패:", error);
        }
    };

    const loginWithGoogle = () => loginWithProvider(googleProvider, '구글');
    const loginWithGitHub = () => loginWithProvider(githubProvider, '깃허브');

    return (
        <div className="loginWrap">
            <div className='login'>
                <p>로그인</p>
                {!user && (
                    <>
                        <button className="google socialBtn" onClick={loginWithGoogle}>
                            <FontAwesomeIcon icon={faGoogle} /> 구글
                        </button>
                        <button className="github socialBtn" onClick={loginWithGitHub}>
                            <FontAwesomeIcon icon={faGithub} /> 깃허브
                        </button>
                        <div className='agree'>
                            "자랑 다모음" 웹사이트에 로그인함으로써, 귀하는 본 웹사이트의 [개인정보 처리방침]과 [이용약관]을 읽고 이해했으며, 이에 동의한다는 것을 확인합니다. 본 웹사이트는 귀하가 제공한 개인정보를 회원 관리, 서비스 개선 및 맞춤형 서비스 제공, 마케팅 및 광고 등의 목적으로만 사용합니다.
                        </div>

                        <div className='privacy'>
                            <p>개인정보 처리방침</p>
                            <p>1. 개인정보의 처리 목적: "자랑 다모음"는 회원 관리, 서비스 제공 및 개선, 신규 기능 개발, 회원 간 커뮤니케이션 촉진, 법적 요구 사항 준수 등을 위해 개인정보를 처리합니다.</p>

                            <p>2. 수집하는 개인정보 항목 및 수집 방법: 회원 가입 및 서비스 이용 과정에서 이름, 이메일 주소, 서비스 이용 기록, 접속 로그, 쿠키 등이 수집될 수 있으며, 수집 방법은 웹사이트 가입, 고객센터 문의, 이벤트 응모 등을 통해 이루어집니다.</p>

                            <p>3. 개인정보의 보관 기간 및 파기 방법: 원칙적으로 개인정보 보유기간이 종료되거나 처리 목적이 달성된 경우에는 해당 정보를 지체 없이 파기합니다. 보관 기간은 법적 의무 이행을 위해 필요한 기간 동안이며, 파기 방법은 전자적 파일 형태의 경우 복원이 불가능한 방법으로, 종이 문서의 경우 분쇄하거나 소각합니다.</p>

                            <p>4. 개인정보의 제3자 제공 및 처리 위탁: "자랑 다모음"는 원칙적으로 사용자의 동의 없이 개인정보를 외부에 공개하지 않습니다. 단, 법률에 근거한 요청 등에 필수적인 경우에 한하여 최소한의 정보만을 제공합니다.</p>

                            <p>5. 이용자의 권리와 그 행사 방법: 사용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 개인정보의 처리 정지 요구도 가능합니다. 이를 위해 웹사이트 내 "마이페이지" 메뉴를 이용하거나 개인정보 보호책임자에게 이메일로 요청할 수 있습니다.</p>

                            <p>6. 개인정보 보호책임자 연락처: 이빈 damoeumofficial@gmail.com</p>

                            <p>7. 변경사항 공지: 본 개인정보 처리방침은 법령, 정책 및 보안 기술의 변경에 따라 내용의 추가, 삭제 및 수정이 있을 시에는 변경사항의 시행 일주일 전부터 웹사이트의 공지사항을 통해 고지할 것입니다.</p>
                        </div>

                        <div className='use'>
                            <p>이용약관</p>
                            <p>제1조 (목적)</p>
                            <p>본 약관은 "자랑 다모음" 웹사이트(이하 "서비스")의 이용 조건 및 절차, 이용자와 "자랑 다모음"의 권리, 의무, 책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.</p>

                            <p>제2조 (약관의 효력 및 변경)</p>
                            <p>본 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.</p>
                            <p>"자랑 다모음"은 법률의 변경, 서비스 정책의 변경 등의 이유로 약관을 변경할 수 있으며, 변경된 약관은 지정된 날짜부터 효력을 발생합니다.</p>

                            <p>제3조 (용어의 정의)</p>
                            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
                            <p>이용자: 본 약관에 따라 "자랑 다모음"이 제공하는 서비스를 받는 회원 및 비회원</p>
                            <p>회원: "자랑 다모음"에 개인정보를 제공하여 회원등록을 한 자로서, "자랑 다모음"의 정보를 지속적으로 제공받으며, "자랑 다모음"이 제공하는 서비스를 계속적으로 이용할 수 있는 자</p>
                            <p>비회원: 회원에 가입하지 않고 "자랑 다모음"이 제공하는 서비스를 이용하는 자</p>

                            <p>제4조 (서비스의 제공 및 변경)</p>
                            <p>"자랑 다모음"은 다음과 같은 서비스를 제공합니다.</p>
                            <p>자랑 및 업적 공유 서비스</p>
                            <p>회원 간 소통 및 정보 공유 서비스</p>
                            <p>기타 "자랑 다모음"이 추가, 개발 또는 제휴 등을 통해 제공하는 서비스</p>
                            <p>제5조 (서비스의 중단)</p>
                            <p>"자랑 다모음"은 컴퓨터 등 정보통신설비의 보수점검·교체와 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</p>

                            <p>제6조 (회원 가입)</p>
                            <p>"자랑 다모음" 서비스에 로그인 시 사용자는 자동으로 본 이용약관 및 개인정보 처리방침에 동의한 것으로 간주합니다.</p>
                            <p>사용자는 "자랑 다모음"의 서비스를 이용하기 위해 필요한 최소한의 정보(이름, 이메일 주소 등)를 제공해야 하며, 해당 정보는 서비스 제공 목적으로만 사용됩니다.</p>
                            <p>로그인을 통해 자동 가입이 이루어지며, 사용자는 언제든지 자신의 계정을 관리할 권리가 있습니다. 이에 포함된 권리는 계정 정보 수정, 서비스 탈퇴 등입니다.</p>
                            <p>"자랑 다모음"은 사용자가 서비스 이용 과정에서 제공한 정보를 기반으로 개인화된 서비스를 제공할 수 있습니다.</p>

                            <p>제7조 (회원의 의무)</p>
                            <p>회원은 본 약관에서 규정하는 사항과 기타 "자랑 다모음"이 정한 제반 규정, 공지사항 등을 준수하여야 합니다.</p>
                            <p>회원은 "자랑 다모음"의 사전 승낙 없이 서비스를 이용하여 어떠한 영리 행위도 할 수 없습니다.</p>

                            <p>제8조 (개인정보보호)</p>
                            <p>"자랑 다모음"은 이용자의 개인정보를 보호하고 존중합니다. "자랑 다모음"의 개인정보 처리방침은 관련 법령 및 정부 지침을 준수합니다.</p>

                            <p>제9조 (약관의재판 및 해석)</p>
                            <p>본 약관과 "자랑 다모음"과 이용자 간의 서비스 이용에 관한 해석 및 분쟁에 관하여는 대한민국 법령을 적용합니다.</p>
                            <p>서비스 이용 중 발생한 이용자와 "자랑 다모음" 간의 분쟁은 민사조정법 등 관련 법령에 따른 조정 절차에 의해 해결을 추구합니다.</p>

                            <p>제10조 (면책 조항)</p>
                            <p>"자랑 다모음"은 천재지변 또는 이에 준하는 불가항력적 사유가 발생하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                            <p>"자랑 다모음"은 회원의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</p>
                            <p>"자랑 다모음"은 회원이 서비스를 이용하여 기대하는 이익을 얻지 못하였거나 서비스 자료에 대한 접근 또는 이용과정에서 입은 손해 등에 대해 책임을 지지 않습니다.</p>

                            <p>제11조 (권리의 귀속 및 저작물의 이용)</p>
                            <p>"자랑 다모음"이 제공하는 서비스, 그에 수반되는 프로그램, 이미지, 마크, 로고 등에 대한 저작권 및 기타 지적재산권은 "자랑 다모음"에 귀속됩니다.</p>
                            <p>회원은 "자랑 다모음"이 제공하는 서비스를 이용함에 있어서 "자랑 다모음"의 지적재산권을 침해하거나 제3자의 지적재산권을 침해하여서는 안 됩니다.</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default Login;
