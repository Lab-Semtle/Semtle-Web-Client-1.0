'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Eye } from 'lucide-react';
import { DataTable } from '@/components/admin/table/data-table';
import { Badge } from '@/components/ui/badge';
import { useFetchPaginatedActivity } from '@/hooks/api/activity/useFetchPaginatedActivities';
import {
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
} from '@/hooks/api/activity/useManageActivity';
import { ActivityPost, mapActivityList } from '@/types/activity';
import ActivityEditForm from '@/components/form/ActivityEditForm'; // 활동게시물 수정/작성 폼
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSession } from 'next-auth/react';

// 타입 : '공지' | '세미나' | '행사' | '기타';
export default function ActivityManagePage() {
  const { data: session } = useSession();
  const [category, setCategory] = useState<'공지' | '세미나' | '행사' | '기타'>(
    '공지',
  );
  const { posts, totalPages, isLoading, error, page, setPage } =
    useFetchPaginatedActivity(category); // 초기값 페칭 훅
  const createActivity = useCreateActivity(); // 생성 훅
  const updateActivity = useUpdateActivity(); // 수정 훅
  const deleteActivity = useDeleteActivity(); // 삭제 훅
  const [isDialogOpen, setIsDialogOpen] = useState(false); // 팝업 상태
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add'); // 팝업 모드
  // 체크박스 선택 데이터 관리
  const [currentPost, setCurrentPost] = useState<Partial<ActivityPost>>({
    title: '',
    content: '',
    writer: '',
    type: '기타',
  });

  /** 게시물 추가/수정 핸들러 */
  const handleSubmitForm = async (formData: FormData) => {
    console.log(
      '[handleSubmitForm] 요청 시작 - FormData:',
      Object.fromEntries(formData.entries()),
    );

    const newPost = {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      writer: session?.user?.name || '관리자',
      type: formData.get('category') as string,
      image_url: (formData.get('imagePath') as string) || undefined,
    };

    console.log(
      `[handleSubmitForm] ${dialogMode === 'add' ? '게시물 추가' : '게시물 수정'} 요청 데이터:`,
      newPost,
    );

    try {
      if (dialogMode === 'add') {
        console.log('[handleSubmitForm] createActivity 호출 시작...');
        await createActivity.mutateAsync(newPost);
        console.log('[handleSubmitForm] createActivity 성공!');
      } else {
        if (!currentPost.id) {
          throw new Error('게시물 ID가 없습니다.');
        }

        await updateActivity.mutateAsync({
          post_id: currentPost.id!,
          ...newPost,
        });
        console.log('[handleSubmitForm] updateActivity 성공!');
      }

      setIsDialogOpen(false);
      alert(`게시물이 ${dialogMode === 'add' ? '추가' : '수정'}되었습니다!`);
    } catch (error) {
      console.error('[handleSubmitForm] 게시물 저장 오류:', error);
      alert('게시물 저장에 실패했습니다.');
    }
  };

  /** 선택 게시물 삭제 */
  const handleDeletePost = async (selectedPosts: ActivityPost[]) => {
    if (
      !confirm(`정말로 ${selectedPosts.length}개의 게시물을 삭제하시겠습니까?`)
    )
      return;
    try {
      await Promise.all(
        selectedPosts.map((post) =>
          deleteActivity.mutateAsync({ board_id: post.id }),
        ),
      );
      alert(`${selectedPosts.length}개의 게시물이 삭제되었습니다!`);
    } catch (error) {
      console.error('게시물 삭제 오류:', error);
      alert('게시물 삭제에 실패했습니다.');
    }
  };

  /** 수정모드 다이얼로그 열기 */
  const openEditDialog = (post: ActivityPost) => {
    setCurrentPost(post);
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  /** 테이블 컬럼 */
  const columns: ColumnDef<ActivityPost>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'title',
      header: '제목',
      cell: ({ row }) => <div>{row.getValue('title')}</div>,
    },
    {
      accessorKey: 'writer',
      header: '작성자',
      cell: ({ row }) => <div>{row.getValue('writer')}</div>,
    },
    {
      accessorKey: 'created_at',
      header: '작성일자',
      cell: ({ row }) => (
        <div>{new Date(row.getValue('created_at')).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: 'type',
      header: '유형',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <Badge
            className={`${
              type === '공지'
                ? 'bg-red-400 text-white'
                : type === '세미나'
                  ? 'bg-blue-400 text-white'
                  : type === '행사'
                    ? 'bg-green-400 text-white'
                    : 'bg-gray-400 text-white'
            } rounded-full px-3 py-1`}
          >
            {type}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '설정',
      cell: ({ row }) => {
        const post = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">메뉴 열기</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Eye className="mr-2 h-4 w-4" /> 상세 보기
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <p>ID : {post.id}</p>
                    <p>제목 : {post.title}</p>
                    <p>유형 : {post.type}</p>
                    <p>이미지 : {post.image_url}</p>
                    <p>내용 : {post.content}</p>
                    <p>작성자 : {post.writer}</p>
                    <p>
                      작성 일자: {new Date(post.created_at).toLocaleString()}
                    </p>
                  </DialogHeader>
                </DialogContent>
              </Dialog>

              <DropdownMenuItem onClick={() => openEditDialog(post)}>
                <Edit className="mr-2 h-4 w-4" /> 수정 하기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      {/* 데이터 로딩 중 메시지 */}
      {isLoading && (
        <p className="text-center text-gray-500">데이터 불러오는 중...</p>
      )}

      {/* API 호출 실패 메시지 */}
      {error && <p className="text-center text-red-500">{error.message}</p>}

      {!isLoading && !error && (
        <>
          {/* 게시물 추가/수정 다이얼로그 */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {dialogMode === 'add' ? 'Add Post' : 'Edit Post'}
                </DialogTitle>
              </DialogHeader>

              <ActivityEditForm
                mode={dialogMode === 'add' ? 'create' : 'update'}
                initialData={
                  dialogMode === 'edit'
                    ? {
                        title: currentPost.title || '',
                        category: currentPost.type || '기타',
                        content: currentPost.content || '',
                        imageUrl: currentPost.image_url || undefined,
                      }
                    : undefined
                }
                onSubmit={handleSubmitForm}
              />
            </DialogContent>
          </Dialog>

          <div className="mb-6 mt-4 flex justify-end px-4">
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory(value as '공지' | '세미나' | '행사' | '기타')
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="공지">공지</SelectItem>
                <SelectItem value="세미나">세미나</SelectItem>
                <SelectItem value="행사">행사</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 활동 게시물 테이블 */}
          <DataTable
            columns={columns}
            data={posts}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onAdd={() => {
              setCurrentPost({
                title: '',
                content: '',
                writer: '',
                type: '기타',
              });
              setDialogMode('add');
              setIsDialogOpen(true);
            }}
            onDelete={handleDeletePost} // 선택 삭제 활성화
            showSearch={true} // 검색창 활성화
            showPagination={true} // 페이지네이션 활성화
            filterColumn="title" // 검색할 컬럼
          />
        </>
      )}
    </div>
  );
}
