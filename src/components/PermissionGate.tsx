import type { ReactNode } from 'react';
import { useUser } from '../hooks/useUser';
import type { PermissionType } from '../lib/types';

interface PermissionGateProps {
  children: ReactNode;
  requiredPermission?: PermissionType;
  requiredLevel?: number;
  requiredFeature?: string;
  fallback?: ReactNode;
}

export function PermissionGate({ 
  children, 
  requiredPermission, 
  requiredLevel, 
  requiredFeature,
  fallback = null 
}: PermissionGateProps) {
  const { hasPermission, hasLevel, canAccessFeature, isAuthenticated } = useUser();

  if (!isAuthenticated) return fallback;

  if (requiredPermission && !hasPermission(requiredPermission)) return fallback;
  if (requiredLevel && !hasLevel(requiredLevel)) return fallback;
  if (requiredFeature && !canAccessFeature(requiredFeature)) return fallback;

  return <>{children}</>;
}
