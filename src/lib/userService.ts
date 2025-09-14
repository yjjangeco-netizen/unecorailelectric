import type { User, UserPublic, PermissionType } from './types';
import { supabase } from './supabaseClient';

export class UserService {
  // API를 통한 로그인
  static async login(username: string, password: string): Promise<User | null> {
    try {
      console.log('로그인 시도:', username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('로그인 실패:', errorData.error);
        return null;
      }

      const { user } = await response.json();
      console.log('로그인 성공:', user.username);

      return user;
    } catch (error) {
      console.error('로그인 오류:', error);
      return null;
    }
  }

  // DB에서 사용자 프로필 조회
  static async getUserProfile(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.log('프로필 조회 실패:', error);
        return null;
      }

      const user: User = {
        id: (data as any).id,
        username: (data as any).username,
        password: (data as any).password,
        name: (data as any).name,
        department: (data as any).depart || (data as any).department || '',
        position: (data as any).position || '',
        level: (data as any).level, // 원본 level 값 보존
        is_active: (data as any).is_active,
        stock_view: (data as any).stock_view || false,
        stock_in: (data as any).stock_in || false,
        stock_out: (data as any).stock_out || false,
        stock_disposal: (data as any).stock_disposal || false,
        work_tools: (data as any).work_tools || false,
        daily_log: (data as any).daily_log || false,
        work_manual: (data as any).work_manual || false,
        sop: (data as any).sop || false,
        user_management: (data as any).user_management || false,
        created_at: (data as any).created_at,
        updated_at: (data as any).updated_at
      };

      return user;
    } catch (error) {
      console.error('프로필 조회 오류:', error);
      return null;
    }
  }

  // level을 permissions로 변환하는 함수
  static mapLevelToPermissions(level: string): PermissionType[] {
    console.log('권한 매핑 - 원본 level:', level);
    
    // level이 문자열인 경우 처리
    const levelStr = String(level).toLowerCase().trim();
    
    // 직책 기반 권한 매핑 (우선순위 높음)
    if (levelStr === '팀장' || levelStr === 'team_leader' || levelStr === 'teamleader') {
      console.log('팀장 권한으로 administrator + level3 부여');
      return ['administrator', 'level1', 'level2', 'level3'];
    } else if (levelStr === '과장' || levelStr === 'manager') {
      console.log('과장 권한으로 level2 부여');
      return ['level1', 'level2'];
    } else if (levelStr === '대리' || levelStr === 'assistant_manager') {
      console.log('대리 권한으로 level2 부여');
      return ['level1', 'level2'];
    } else if (levelStr === '사원' || levelStr === 'staff') {
      console.log('사원 권한으로 level1 부여');
      return ['level1'];
    }
    
    // 숫자 level을 권한으로 변환
    if (levelStr === '1' || levelStr === 'level1') {
      return ['level1'];
    } else if (levelStr === '2' || levelStr === 'level2') {
      return ['level1', 'level2'];
    } else if (levelStr === '3' || levelStr === 'level3') {
      return ['level1', 'level2', 'level3'];
    } else if (levelStr === '4' || levelStr === 'level4') {
      return ['level1', 'level2', 'level3', 'level4'];
    } else if (levelStr === '5' || levelStr === 'level5') {
      return ['level1', 'level2', 'level3', 'level4', 'level5'];
    } else if (levelStr === 'admin' || levelStr === 'administrator' || levelStr === '관리자') {
      console.log('관리자 권한으로 administrator 부여');
      return ['administrator'];
    }
    
    // 기본값: level1 권한 부여
    console.log('기본 권한 level1 부여');
    return ['level1'];
  }
}
