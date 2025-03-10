'use client';

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from 'react';
import { FileObject } from '@/lib/utils/ncp-storage';

/** NCP 파일 업로드 및 삭제, 다운로드 컴포넌트 */
export default function NCPFileManager() {
  const [files, setFiles] = useState<FileObject[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  // 파일 목록 가져오기
  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      const data = await response.json();
      setFiles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    }
  };

  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // 파일 업로드 핸들러
  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    abortControllerRef.current = new AbortController();

    try {
      // 서명된 URL 요청
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      const { signedUrl } = await response.json();

      // 파일 업로드 요청
      await uploadFileWithProgress(
        file,
        signedUrl,
        abortControllerRef.current.signal,
      );

      alert('File uploaded successfully!');
      setFile(null); // 파일 선택 초기화
      fetchFiles(); // 파일 목록 새로고침
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Upload cancelled');
      } else {
        console.error('Error uploading file:', error);
        alert('Error uploading file');
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      abortControllerRef.current = null;
    }
  };

  // 업로드 진행률을 추적하는 함수
  const uploadFileWithProgress = (
    file: File,
    signedUrl: string,
    signal: AbortSignal,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.open('PUT', signedUrl);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      xhr.send(file);

      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new Error('Upload cancelled'));
      });
    });
  };

  // 업로드 취소 핸들러
  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 파일 다운로드 핸들러
  const handleDownload = async (key: string) => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ key }),
      });
      const { signedUrl } = await response.json();
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  // 파일 삭제 핸들러
  const handleDelete = async (key: string) => {
    try {
      await fetch('/api/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ key }),
      });
      alert('File deleted successfully!');
      fetchFiles(); // 파일 목록 새로고침
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  return (
    <div className="mx-auto mt-24 max-w-2xl rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-6 text-2xl font-semibold text-gray-800">파일 업로드</h2>
      <form onSubmit={handleUpload} className="mb-8">
        <div className="flex items-center space-x-4">
          <label className="flex-1">
            <input
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
              id="file-upload"
            />
            <div className="cursor-pointer rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-blue-500 transition duration-300 hover:bg-blue-100">
              {file ? file.name : '여기를 클릭하여 파일을 선택해주세요.'}
            </div>
          </label>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="rounded-lg bg-blue-500 px-6 py-2 text-white transition duration-300 hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      </form>

      {isUploading && (
        <div className="mb-8">
          <div className="mb-4 h-2.5 w-full rounded-full bg-gray-200">
            <div
              className="h-2.5 rounded-full bg-blue-600"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {uploadProgress.toFixed(2)}% uploaded
            </p>
            <button
              onClick={handleCancelUpload}
              className="text-red-500 transition duration-300 hover:text-red-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      <h2 className="mb-4 text-2xl font-semibold text-gray-800">
        전체 파일 목록
      </h2>
      {files.length === 0 ? (
        <p className="italic text-gray-500">파일이 없습니다...</p>
      ) : (
        <ul className="space-y-4">
          {files.map((file) => (
            <li
              key={file.Key}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
            >
              <span className="flex-1 truncate text-gray-700">{file.Key}</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => file.Key && handleDownload(file.Key)}
                  className="text-blue-500 transition duration-300 hover:text-blue-600"
                >
                  다운로드
                </button>
                <button
                  onClick={() => file.Key && handleDelete(file.Key)}
                  className="text-red-500 transition duration-300 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
