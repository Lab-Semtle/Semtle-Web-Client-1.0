'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, SessionProvider } from 'next-auth/react';

import { useUserProfile } from '@/hooks/api/useUserProfile';
import ProfileForm from '@/components/form/ProfileForm';
import PasswordChangeDialog from '@/components/form/PasswordChangeDialog';

export default function ProfileSettingsPage() {
  return (
    <SessionProvider>
      <ProfileSettingsPageContent />
    </SessionProvider>
  );
}

function ProfileSettingsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 로그인 여부 체크
  useEffect(() => {
    if (status === 'loading') return; // 세션 로딩 중이면 대기

    console.log('session : ', session);
    if (!session?.accessToken) {
      alert('로그인이 필요합니다.');
      router.push('/signin'); // 로그인 안 되어 있으면 리다이렉트
    }
  }, [status, session, router]);

  // 인증된 경우에만 사용자 프로필 API 호출
  const { user, isLoading, updateUserProfile } = useUserProfile();

  const [isPasswordDialogOpen, setPasswordDialogOpen] = useState(
    typeof window !== 'undefined' &&
      localStorage.getItem('passwordModalOpen') === 'true',
  );
  const [userEmail, setUserEmail] = useState('');

  // user 값이 변경될 때 이메일 저장
  useEffect(() => {
    if (user?.email) {
      setUserEmail(user.email);
    }
  }, [user]);

  // 모달 열기
  const handlePasswordDialogOpen = () => {
    setPasswordDialogOpen(true);
    localStorage.setItem('passwordModalOpen', 'true'); // 상태 저장
  };

  // 모달 닫기
  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    localStorage.removeItem('passwordModalOpen'); // 상태 제거
  };

  // 모든 데이터가 준비되었을 때 렌더링
  if (status === 'loading' || isLoading || !user) {
    return <p className="text-center text-lg font-semibold">로딩 중...</p>;
  }

  return (
    <main className="flex min-h-screen flex-col justify-between">
      <section className="container mx-auto max-w-3xl px-8 py-40">
        <h1 className="mb-12 text-4xl font-bold leading-tight tracking-tight">
          개인정보 관리
        </h1>

        {/* 비밀번호 변경 다이얼로그 */}
        <PasswordChangeDialog
          isOpen={isPasswordDialogOpen}
          onClose={handlePasswordDialogClose}
          userEmail={userEmail}
        />

        {/* 개인정보 수정 폼 */}
        <ProfileForm
          user={user}
          updateUserProfile={updateUserProfile}
          onPasswordChange={handlePasswordDialogOpen} // 모달 열기
        />
      </section>
    </main>
  );
}
