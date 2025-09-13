import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'add_work_diary_fields') {
      // work_diary 테이블에 새로운 컬럼들 추가
      const { error } = await supabaseServer.rpc('add_work_diary_columns')
      
      if (error) {
        console.error('Error adding columns:', error)
        return NextResponse.json({ error: 'Failed to add columns' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Work diary columns added successfully' 
      })
    }

    if (action === 'create_stats_views') {
      // 통계 뷰 생성
      const views = [
        {
          name: 'work_diary_stats',
          sql: `
            CREATE OR REPLACE VIEW work_diary_stats AS
            SELECT 
              DATE(work_date) as work_date,
              CASE 
                WHEN custom_project_name IS NOT NULL THEN custom_project_name
                ELSE p.project_name
              END as project_name,
              work_type,
              work_sub_type,
              COUNT(*) as work_count,
              COUNT(DISTINCT user_id) as user_count
            FROM work_diary wd
            LEFT JOIN projects p ON wd.project_id = p.id
            GROUP BY DATE(work_date), 
                     CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
                     work_type, 
                     work_sub_type
            ORDER BY work_date DESC
          `
        },
        {
          name: 'monthly_work_stats',
          sql: `
            CREATE OR REPLACE VIEW monthly_work_stats AS
            SELECT 
              DATE_TRUNC('month', work_date) as month,
              work_type,
              COUNT(*) as total_entries,
              COUNT(DISTINCT user_id) as active_users,
              COUNT(DISTINCT CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END) as unique_projects
            FROM work_diary wd
            LEFT JOIN projects p ON wd.project_id = p.id
            GROUP BY DATE_TRUNC('month', work_date), work_type
            ORDER BY month DESC, work_type
          `
        },
        {
          name: 'project_work_stats',
          sql: `
            CREATE OR REPLACE VIEW project_work_stats AS
            SELECT 
              CASE 
                WHEN custom_project_name IS NOT NULL THEN custom_project_name
                ELSE p.project_name
              END as project_name,
              work_type,
              work_sub_type,
              COUNT(*) as work_count,
              COUNT(DISTINCT user_id) as user_count,
              MIN(work_date) as first_work_date,
              MAX(work_date) as last_work_date
            FROM work_diary wd
            LEFT JOIN projects p ON wd.project_id = p.id
            GROUP BY CASE WHEN custom_project_name IS NOT NULL THEN custom_project_name ELSE p.project_name END,
                     work_type, 
                     work_sub_type
            ORDER BY work_count DESC
          `
        }
      ]

      for (const view of views) {
        const { error } = await supabaseServer.rpc('exec_sql', { sql: view.sql })
        if (error) {
          console.error(`Error creating view ${view.name}:`, error)
          return NextResponse.json({ 
            error: `Failed to create view ${view.name}` 
          }, { status: 500 })
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Statistics views created successfully' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in database migration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
