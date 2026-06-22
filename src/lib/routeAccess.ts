export interface RouteAccessRule {
  prefix: string
  minLevel?: number
  adminOnly?: boolean
}

export const PUBLIC_PATHS = ['/', '/login', '/signup', '/debug-page']

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  { prefix: '/settings', minLevel: 5 },
  { prefix: '/user-management', minLevel: 5 },
  { prefix: '/project-management', minLevel: 5 },
  { prefix: '/manual-management', minLevel: 5 },
  { prefix: '/chatbot-management', minLevel: 5 },
  { prefix: '/work-diary/advanced-stats', minLevel: 4 },
  { prefix: '/nara-monitoring', minLevel: 4 },
  { prefix: '/dashboard', minLevel: 3 },
  { prefix: '/work-diary', minLevel: 3 },
  { prefix: '/business-trip-management', minLevel: 3 },
  { prefix: '/business-trip-reports', minLevel: 3 },
  { prefix: '/schedule', minLevel: 3 },
  { prefix: '/memo', minLevel: 3 },
  { prefix: '/as-ss', minLevel: 1 },
  { prefix: '/stock-management', minLevel: 1 },
  { prefix: '/work-tool', minLevel: 3 },
  { prefix: '/assistant-automation', minLevel: 1 }
]

export function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname)
}

export function getRouteAccessRule(pathname: string) {
  const cleanPathname = pathname.split('?')[0].split('#')[0]
  return ROUTE_ACCESS_RULES.find((rule) => cleanPathname === rule.prefix || cleanPathname.startsWith(`${rule.prefix}/`))
}

export function isAdministrator(level: string | number | undefined, username?: string) {
  const normalized = String(level || '').toLowerCase()
  return username === 'admin' || normalized === 'administrator' || normalized === 'admin'
}

export function levelNumber(level: string | number | undefined) {
  if (isAdministrator(level)) return 99
  const parsed = Number(level)
  return Number.isFinite(parsed) ? parsed : 0
}

export function canAccessRoute(pathname: string, user: { level?: string | number; username?: string } | null) {
  const rule = getRouteAccessRule(pathname)
  if (!rule) return true
  if (!user) return false
  if (isAdministrator(user.level, user.username)) return true
  if (rule.adminOnly) return false
  if (rule.minLevel !== undefined) return levelNumber(user.level) >= rule.minLevel
  return true
}
