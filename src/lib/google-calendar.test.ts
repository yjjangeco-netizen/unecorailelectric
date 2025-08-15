import { transformWorkDiaryEntry } from '@/lib/google-calendar'

// Mock external dependencies
jest.mock('@google-cloud/local-auth', () => ({
  authenticate: jest.fn()
}))

jest.mock('googleapis', () => ({
  google: {
    calendar: jest.fn(() => ({
      events: {
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      }
    }))
  }
}))

describe('google-calendar', () => {
  test('transformWorkDiaryEntry converts basic entry', () => {
    const entry = {
      id: '1',
      date: '2025-01-15',
      content: '테스트 업무',
      user_id: 'user1',
      created_at: '2025-01-15T09:00:00Z'
    }

    const result = transformWorkDiaryEntry(entry)

    expect(result).toEqual({
      summary: '업무일지: 테스트 업무',
      description: '테스트 업무',
      start: {
        date: '2025-01-15'
      },
      end: {
        date: '2025-01-15'
      }
    })
  })

  test('transformWorkDiaryEntry handles long content', () => {
    const entry = {
      id: '2',
      date: '2025-01-15',
      content: '매우 긴 업무 내용'.repeat(10),
      user_id: 'user1',
      created_at: '2025-01-15T09:00:00Z'
    }

    const result = transformWorkDiaryEntry(entry)

    expect(result.summary).toContain('업무일지:')
    expect(result.summary.length).toBeLessThanOrEqual(100) // 제목 길이 제한
    expect(result.description).toBe(entry.content)
  })

  test('transformWorkDiaryEntry handles empty content', () => {
    const entry = {
      id: '3',
      date: '2025-01-15',
      content: '',
      user_id: 'user1',
      created_at: '2025-01-15T09:00:00Z'
    }

    const result = transformWorkDiaryEntry(entry)

    expect(result.summary).toBe('업무일지: (내용 없음)')
    expect(result.description).toBe('')
  })

  test('transformWorkDiaryEntry handles invalid date', () => {
    const entry = {
      id: '4',
      date: 'invalid-date',
      content: '테스트',
      user_id: 'user1',
      created_at: '2025-01-15T09:00:00Z'
    }

    expect(() => transformWorkDiaryEntry(entry)).toThrow()
  })
});
