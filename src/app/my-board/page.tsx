'use client'

import AuthGuard from '@/components/AuthGuard'
import PostBoard from '@/components/PostBoard'

export default function MyBoardPage() {
  return (
    <AuthGuard requiredLevel={3}>
      <PostBoard
        boardType="personal_board"
        title="내 전용 게시판"
        description="장비/버전 말머리를 달아 자료를 자유롭게 기록합니다. (레벨 3 이상 전용)"
        prefixes={{
          machines: ['전삭기', '선반', '디스크선반', '탠덤', '공통'],
          versions: ['840C', '840D', '840Dsl', 'ONE', '공통']
        }}
        minLevel={3}
        chatbotSync
      />
    </AuthGuard>
  )
}
