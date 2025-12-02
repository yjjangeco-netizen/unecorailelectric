import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('stock_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({ 
      success: true, 
      data, 
      error,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    })
  }
}
