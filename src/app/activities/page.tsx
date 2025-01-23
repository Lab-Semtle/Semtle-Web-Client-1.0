"use client"

import { useEffect, useRef, useState } from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Plus, Trash2 } from "lucide-react"

interface Activity {
  id: number
  title: string
  content: string
  image: string
  date: string
  category: string
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const loader = useRef(null)
  const [category, setCategory] = useState("all")

  const fetchActivities = async (pageNum: number) => {
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newActivities = Array.from({ length: 5 }, (_, i) => ({
      id: pageNum * 5 + i,
      title: `Activity ${pageNum * 5 + i + 1}`,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      image: `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-r9PxyW9Tt5x5zUBIMUnpXOl6yjhPIs.png`,
      date: new Date(2024, 0, pageNum * 5 + i + 1).toISOString(),
      category: ["전체", "세미나", "행사", "기타"][Math.floor(Math.random() * 4)],
    }))

    setActivities((prev) =>
      [...prev, ...newActivities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    )
    setLoading(false)
  }

  useEffect(() => {
    fetchActivities(page)
  }, [page])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && !loading) {
          setPage((prev) => prev + 1)
        }
      },
      { threshold: 1.0 },
    )

    if (loader.current) {
      observer.observe(loader.current)
    }

    return () => observer.disconnect()
  }, [loading])

  const filteredActivities = activities.filter((activity) => category === "all" || activity.category === category)

  const handleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]))
  }

  const handleDelete = () => {
    setActivities((prev) => prev.filter((activity) => !selectedIds.includes(activity.id)))
    setSelectedIds([])
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        {/* 새 게시물 버튼 숨김처리시 opacity값 0 */}
        <Button onClick={() => console.log("Create new post")} className="gap-2 opacity-100">
          <Plus className="h-4 w-4" />새 게시물 작성하기
        </Button>

        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 
          bg-white dark:bg-gray-800 shadow-lg rounded-lg px-4 py-2 flex items-center gap-4
          transition-all duration-200 ${selectedIds.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"}`}
        >
          <span className="text-sm font-medium">{selectedIds.length}개 선택됨</span>
          <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex gap-2">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="세미나">세미나</SelectItem>
                <SelectItem value="행사">행사</SelectItem>
                <SelectItem value="기타">기타</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1 relative">
              <Input placeholder="검색어를 입력하세요" className="pl-10" />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            </div>
            <Button variant="secondary">검색</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex gap-4 p-4">
                <div className="flex items-center">
                    {/* 체크박스 숨김처리시 opacity값 0 */}
                    <Checkbox
                    checked={selectedIds.includes(activity.id)}
                    onCheckedChange={() => handleSelect(activity.id)}
                    className="ml-2 mr-4 opacity-100"
                  />
                </div>
                <div className="w-[120px] h-[120px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={activity.image || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold mb-2">{activity.title}</h3>
                  <p className="text-gray-600 mb-2 line-clamp-2">{activity.content}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{format(new Date(activity.date), "yyyy.MM.dd")}</span>
                    <span className="text-sm text-gray-500">{activity.category}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-pulse">Loading more activities...</div>
          </div>
        )}
        <div ref={loader} className="h-4" />
      </div>
    </div>
  )
}

