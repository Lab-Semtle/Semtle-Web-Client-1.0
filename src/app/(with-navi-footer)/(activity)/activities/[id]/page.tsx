'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, ArrowRight, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { API_ROUTES } from '@/constants/ApiRoutes';
import { fetchNcpPresignedUrl } from '@/hooks/api/useFetchNcpPresignedUrls';

interface PostData {
  board_id: number;
  title: string;
  content: string;
  writer: string;
  createdAt: string;
  images?: string[];
  type: string;
  imageUrl?: string;
}

export default function ActivityPostPage() {
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();

  /**
   * ✅ `fetchPost`를 `useCallback`으로 감싸서 의존성 문제 해결
   */
  const fetchPost = useCallback(
    async (id: number) => {
      try {
        const response = await fetch(API_ROUTES.GET_ACTIVITY_DETAIL(id));
        if (!response.ok) {
          if (response.status === 404) {
            alert('해당 게시물이 존재하지 않습니다.');
          } else {
            alert('게시물을 불러오는 중 오류가 발생했습니다.');
          }
          router.push('/activities');
          return;
        }

        const { success, data } = await response.json();
        if (success) {
          const imageUrl = data.images?.[0]
            ? await fetchNcpPresignedUrl(data.images[0])
            : '/placeholder.svg';

          setPost({
            ...data,
            imageUrl,
          });
        } else {
          alert('게시물을 불러오는 데 실패했습니다.');
          router.push('/activities');
        }
      } catch (error) {
        console.error(error);
        alert('서버 오류가 발생했습니다.');
        router.push('/activities');
      } finally {
        setLoading(false);
      }
    },
    [router], // ✅ 의존성 배열에 router 추가
  );

  useEffect(() => {
    if (params.id) {
      setLoading(true);
      fetchPost(Number(params.id));
    }
  }, [params.id, fetchPost]); // ✅ `fetchPost`를 의존성 배열에 추가

  if (loading) {
    return <div className="text-center text-lg">로딩 중...</div>;
  }

  if (!post) {
    return (
      <div className="text-center text-lg">게시물을 찾을 수 없습니다.</div>
    );
  }

  // ✅ 사용하지 않는 `handleModify` 삭제 또는 주석 처리
  /*
  const handleModify = () => {
    router.push(`/activities/edit/${post.board_id}`);
  };
  */

  const handleList = () => {
    router.push('/activities');
  };

  const handlePrevious = () => {
    const prevId = post.board_id - 1;
    if (prevId < 1) {
      alert('이전 게시물이 없습니다.');
      return;
    }
    router.push(`/activities/${prevId}`);
  };

  const handleNext = () => {
    const nextId = post.board_id + 1;
    router.push(`/activities/${nextId}`);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto mt-40 max-w-4xl p-4">
        <Card className="mb-36 border-none bg-background shadow-none dark:bg-background">
          <CardContent className="p-0">
            <div className="space-y-6">
              <h1 className="text-left text-4xl font-bold">{post.title}</h1>
              <div className="flex w-full items-center justify-between border-b pb-4 text-sm text-gray-500">
                <Badge
                  variant="outline"
                  className="bg-semtle-lite px-2 py-1 text-sm font-semibold text-white dark:bg-semtle-dark dark:text-black"
                >
                  {post.type}
                </Badge>
                <span className="text-balck text-right text-lg font-medium dark:text-white">
                  {format(new Date(post.createdAt), 'yyyy년 MM월 dd일')}
                </span>
              </div>

              <div className="relative aspect-video w-full overflow-hidden rounded-xl">
                <Image
                  src={post.imageUrl || '/logo/semtle-logo-bg-square-v2022.png'}
                  alt="게시물 이미지"
                  fill
                  className="rounded-xl object-cover"
                  priority
                />
              </div>

              {/* 게시물 내용 */}
              <div className="min-h-[150px] whitespace-pre-line text-lg font-medium">
                {post.content}
              </div>

              <div className="flex items-center justify-center">
                <div className="flex gap-5">
                  <Button onClick={handlePrevious}>
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    이전
                  </Button>
                  <Button onClick={handleList}>
                    <ListFilter className="mr-1 h-4 w-4" />
                    목록
                  </Button>
                  <Button onClick={handleNext}>
                    다음
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
