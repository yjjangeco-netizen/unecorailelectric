'use client'

import AuthGuard from '@/components/AuthGuard'
import PostBoard from '@/components/PostBoard'

export default function SOPPage() {
  return (
    <AuthGuard>
      <PostBoard
        boardType="sop"
        title="SOP 업무 절차서"
        description="업무 절차서를 블로그처럼 직접 작성합니다. 글자 크기·색상·링크를 자유롭게 넣을 수 있어요."
      />
    </AuthGuard>
  )
}
