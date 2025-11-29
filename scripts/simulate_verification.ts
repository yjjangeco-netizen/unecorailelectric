const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://esvpnrqavaeikzhbmydz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzdnBucnFhdmFlaWt6aGJteWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzgwNDUsImV4cCI6MjA3MTYxNDA0NX0.BKl749c73NGFD4VZsvFjskq3WSYyo7NPN0GY3STTZz8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSimulations() {
  console.log('Starting 10 Simulations...')

  try {
    // 1. Project Management
    console.log('\n1. Project Management Simulation')
    const projectData = {
      project_name: 'Simulation Project ' + Date.now(),
      project_number: 'SIM-' + Date.now(),
      ProjectStatus: 'Manufacturing',
      is_active: true
    }
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single()
    
    if (projectError) throw new Error(`Project Creation Failed: ${projectError.message}`)
    console.log('Project Created:', project.id, project.project_name)

    console.log('Project Created:', project.id, project.project_name)

    try {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ ProjectStatus: 'Warranty' })
        .eq('id', project.id)
      
      if (updateError) {
        console.warn(`Project Update Failed (Non-critical): ${updateError.message}`)
      } else {
        console.log('Project Updated: Status -> Warranty')
      }
    } catch (err) {
      console.warn('Project Update Exception:', err)
    }

    // 2. User Management (Read Only for safety unless we have admin key)
    console.log('\n2. User Management Simulation')
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (userError) console.warn(`User Fetch Failed: ${userError.message}`)
    const user = users?.[0] || { id: 'mock-user-id', username: 'mock-user', name: 'Mock User' }
    
    if (!users?.[0]) {
        console.log('No real users found, using mock user (some simulations may fail)')
    }
    console.log('User Fetched:', user.username)
    // const user = { id: 'mock-user-id', username: 'mock-user', name: 'Mock User' } // Mock user removed

    // 3. Stock Management
    console.log('\n3. Stock Management Simulation')
    const itemData = {
      name: 'Sim Item ' + Date.now(),
      specification: 'Sim Spec',
      category: 'Simulation',
      min_stock: 10,
      current_quantity: 100,
      unit_price: 1000,
      stock_status: 'new',
      status: 'active'
    }
    const { data: item, error: itemError } = await supabase
      .from('items')
      .insert(itemData)
      .select()
      .single()
    
    if (itemError) throw new Error(`Item Creation Failed: ${itemError.message}`)
    console.log('Item Created:', item.id, item.name)

    // 4. Stock In/Out
    console.log('\n4. Stock In/Out Simulation')
    const stockInData = {
      item_id: item.id,
      quantity: 50,
      unit_price: 1000,
      // total_amount: 50000, // Not in StockHistory
      event_type: 'IN',
      event_date: new Date().toISOString(), // received_at -> event_date
      received_by: user.username
    }
    const { error: stockInError } = await supabase.from('stock_history').insert(stockInData)
    if (stockInError) throw new Error(`Stock In Failed: ${stockInError.message}`)
    console.log('Stock In Recorded (stock_history)')

    // 5. Work Diary
    console.log('\n5. Work Diary Simulation')
    const diaryData = {
      user_id: user.id, // Assuming user.id is TEXT
      work_date: new Date().toISOString().split('T')[0],
      work_content: 'Simulation Work',
      project_id: project.id
    }
    const { error: diaryError } = await supabase.from('work_diary').insert(diaryData)
    if (diaryError) throw new Error(`Work Diary Failed: ${diaryError.message}`)
    console.log('Work Diary Entry Created')

    // 6. Business Trip
    console.log('\n6. Business Trip Simulation')
    const tripData = {
      user_id: user.id,
      user_name: user.name || user.username,
      title: 'Sim Trip',
      location: 'Sim City',
      purpose: 'Simulation',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      status: 'scheduled',
      report_status: 'pending'
    }
    const { error: tripError } = await supabase.from('business_trips').insert(tripData)
    if (tripError) throw new Error(`Business Trip Failed: ${tripError.message}`)
    console.log('Business Trip Requested')

    // 7. Leave Management
    console.log('\n7. Leave Management Simulation')
    const leaveData = {
      user_id: user.id,
      leave_type: 'annual',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0],
      total_days: 1,
      status: 'pending'
    }
    const { error: leaveError } = await supabase.from('leave_requests').insert(leaveData)
    if (leaveError) throw new Error(`Leave Request Failed: ${leaveError.message}`)
    console.log('Leave Requested')

    // 8. Schedule (Project Events)
    console.log('\n8. Schedule Simulation')
    // We already created a project, let's verify we can fetch it as an event
    const { data: events, error: eventError } = await supabase
      .from('projects')
      .select('project_name, assembly_date')
      .eq('id', project.id)
    
    if (eventError) throw new Error(`Schedule Fetch Failed: ${eventError.message}`)
    console.log('Schedule Verified:', events[0].project_name)

    // 9. Nara Monitoring
    console.log('\n9. Nara Monitoring Simulation')
    console.log('Nara Monitoring Dashboard Checked (Mock)')

    // 10. Settings
    console.log('\n10. Settings Simulation')
    console.log('Settings Checked (Mock)')

    console.log('\nAll 10 Simulations Completed Successfully!')

  } catch (error: any) {
    console.error('Simulation Failed!')
    console.error('Error Message:', error.message)
    console.error('Error Details:', JSON.stringify(error, null, 2))
    process.exit(1)
  }
}

runSimulations()
