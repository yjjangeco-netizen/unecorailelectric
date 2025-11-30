import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = createServerSupabaseClient()

    let query = supabase
      .from('stock_history')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      // Add one day to include the end date fully
      const end = new Date(endDate)
      end.setDate(end.getDate() + 1)
      query = query.lt('created_at', end.toISOString())
    }
    if (type && type !== 'all') {
      query = query.eq('type', type)
    }
    if (search) {
      // Search in product name, location, or reason
      query = query.or(`item_name.ilike.%${search}%,location.ilike.%${search}%,reason.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Error fetching stock history:', error)
      // If table doesn't exist, return empty list instead of 500
      if (error.code === '42P01') { // undefined_table
         return NextResponse.json({ history: [], total: 0 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      history: data || [],
      total: count || 0
    })

  } catch (error) {
    console.error('Exception in stock history API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const ids = searchParams.get('ids')?.split(',')

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No IDs provided' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { error } = await supabase
      .from('stock_history')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Error deleting stock history:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Exception in stock history DELETE API:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
