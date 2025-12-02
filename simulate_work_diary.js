
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';
const USER_ID = 'admin'; // Using 'admin' as seen in previous checks
const TEST_CONTENT = `Simulation Test Entry ${Date.now()}`;
const TEST_DATE = new Date().toISOString().split('T')[0];

async function simulateWorkDiaryFlow() {
  console.log('--- Starting Work Diary Simulation ---');

  // 1. Create a Work Diary Entry
  console.log('\n1. Creating new work diary entry...');
  const createPayload = {
    userId: USER_ID,
    workDate: TEST_DATE,
    workContent: TEST_CONTENT,
    workType: '신규',
    workSubType: '내근',
    projectId: '', // No project for this test
    customProjectName: 'Simulation Project',
    startTime: '09:00',
    endTime: '18:00'
  };

  try {
    const createResponse = await fetch(`${BASE_URL}/api/work-diary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createPayload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create entry: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
    }

    const createResult = await createResponse.json();
    console.log('✅ Entry created successfully:', createResult.data.id);
    const newEntryId = createResult.data.id;

    // 2. Search for the Entry in History
    console.log(`\n2. Searching for entry (ID: ${newEntryId}) in history...`);
    
    // Allow a slight delay for DB propagation if needed (usually instant)
    await new Promise(resolve => setTimeout(resolve, 1000));

    const searchParams = new URLSearchParams({
      userId: USER_ID,
      startDate: TEST_DATE,
      endDate: TEST_DATE,
      limit: '100' // Fetch enough to find it
    });

    const searchResponse = await fetch(`${BASE_URL}/api/work-diary?${searchParams.toString()}`, {
        headers: {
            'x-user-level': '5', // Simulate admin to ensure we can see it
            'x-user-id': USER_ID
        }
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Failed to search history: ${searchResponse.status} ${searchResponse.statusText} - ${errorText}`);
    }

    const searchResult = await searchResponse.json();
    const foundEntry = searchResult.data.find(entry => entry.id === newEntryId);

    if (foundEntry) {
      console.log('✅ Entry found in history!');
      console.log('   - ID:', foundEntry.id);
      console.log('   - Content:', foundEntry.workContent);
      console.log('   - Date:', foundEntry.workDate);
      
      // Verify content match
      if (foundEntry.workContent === TEST_CONTENT) {
          console.log('✅ Content matches exactly.');
      } else {
          console.error('❌ Content mismatch!');
      }

    } else {
      console.error('❌ Entry NOT found in history.');
      console.log('   Total entries found:', searchResult.data.length);
      console.log('   First 3 entries:', JSON.stringify(searchResult.data.slice(0, 3), null, 2));
    }

  } catch (error) {
    console.error('❌ Simulation failed:', error.message);
  }
  console.log('\n--- Simulation Complete ---');
}

simulateWorkDiaryFlow();
