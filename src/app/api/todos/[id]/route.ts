import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Todo 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { title, completed, dueDate, priority, category } = body

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (completed !== undefined) updateData.completed = completed
    if (dueDate !== undefined) updateData.due_date = dueDate
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category

    const { data, error } = await supabase
      .from('todos')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Todo 수정 오류:', error)
      return NextResponse.json({ error: 'Todo 수정에 실패했습니다' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Todo를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Todo 수정 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// Todo 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', params.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Todo 삭제 오류:', error)
      return NextResponse.json({ error: 'Todo 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Todo가 삭제되었습니다' })
  } catch (error) {
    console.error('Todo 삭제 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

