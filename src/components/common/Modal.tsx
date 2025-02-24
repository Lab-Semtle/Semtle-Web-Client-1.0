'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { XIcon } from 'lucide-react';

export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      dialogRef.current?.scrollTo({ top: 0 });
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return createPortal(
    <motion.dialog
      ref={dialogRef}
      onClose={() => router.back()} // ESC 버튼 닫기
      onClick={(e) => {
        if ((e.target as HTMLElement).nodeName === 'DIALOG') {
          router.back(); // 모달 바깥 클릭 시 닫기
        }
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        className="relative max-w-lg rounded-lg bg-white p-6 shadow-lg"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫히지 않음
      >
        <button
          className="absolute right-2 top-2 text-gray-600"
          onClick={() => router.back()}
        >
          <XIcon className="h-6 w-6" />
        </button>
        <div className="max-h-[80vh] overflow-y-auto px-4">{children}</div>
      </motion.div>
    </motion.dialog>,
    document.getElementById('modal-root') as HTMLElement,
  );
}
