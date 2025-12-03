import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Todo 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Todo 조회 오류:', error)
      return NextResponse.json({ error: 'Todo 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Todo 조회 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// Todo 생성
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    
    if (!userId) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { title, dueDate, priority, category } = body

    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://esvpnrqavaeikzhbmydz.supabase.co'
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: userId,
        title,
        completed: false,
        due_date: dueDate || null,
        priority: priority || 'medium',
        category: category || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Todo 생성 오류:', error)
      return NextResponse.json({ error: 'Todo 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Todo 생성 중 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

