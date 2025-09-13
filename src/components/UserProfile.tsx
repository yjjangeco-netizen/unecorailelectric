import { useUser } from '../hooks/useUser';

export function UserProfile() {
  const { user, loading, error, isAdmin, hasPermission } = useUser();

  if (loading) return <div className="p-4">로딩 중...</div>;
  if (error) return <div className="p-4 text-red-600">오류: {error}</div>;
  if (!user) return <div className="p-4">로그인이 필요합니다</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">{user.name}</h2>
      <div className="space-y-2">
        <p><strong>부서:</strong> {user.department}</p>
        <p><strong>직책:</strong> {user.position}</p>
        <p><strong>이메일:</strong> {user.email}</p>
        <p><strong>권한:</strong> {user.permissions.join(', ')}</p>
        
        {isAdmin() && (
          <div className="mt-4 p-3 bg-blue-100 text-blue-800 rounded">
            관리자 권한
          </div>
        )}
        
        {hasPermission('level5') && (
          <div className="mt-2 p-2 bg-green-100 text-green-800 rounded">
            고급 권한
          </div>
        )}
      </div>
    </div>
  );
}
