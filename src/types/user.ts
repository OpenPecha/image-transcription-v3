// User roles in the system (ITv3: Admin + Annotator + Reviewer only)
export enum UserRole {
  Admin = 'admin',
  Annotator = 'annotator',
  Reviewer = 'reviewer',
}

// User interface
export interface User {
  id?: string
  username?: string
  email: string
  role?: UserRole
  group_name?: string
  group_id?: string
  application?: string
  picture?: string
  createdAt?: Date
  active?: boolean
}

// Request payload for creating users
export interface CreateUserDTO {
  username?: string
  email: string
  role?: UserRole
  group_id?: string
  picture?: string
}

// Request payload for updating users
export interface UpdateUserDTO {
  new_username?: string
  new_email?: string
  new_role?: UserRole | null
  new_group_id?: string | null
}

// Paginated response wrapper
export interface UserListResponse {
  items: User[]
  total: number
  limit: number
  offset: number
}

// User query filters
export interface UserFilters {
  search?: string
  role?: UserRole
  group_id?: string
  offset?: number
  limit?: number
}

// Role display configuration
export const ROLE_CONFIG: Record<UserRole, { label: string; description: string }> = {
  [UserRole.Admin]: { label: 'Admin', description: 'System administrator with full access' },
  [UserRole.Annotator]: { label: 'Annotator', description: 'Annotates and transcribes content' },
  [UserRole.Reviewer]: { label: 'Reviewer', description: 'Reviews and validates corrections' },
}

// User contribution from report endpoint
/** @deprecated Legacy flat contribution row — use {@link UserContributionReportResponse} instead. */
export interface UserContribution {
  task_id: string
  name: string
  char_diff: number
  batch_name: string
  rejection_count: number
  updated_time: string
  role: 'annotator' | 'reviewer'
  line_count: number | null
}

export function isLineAlignmentContribution(item: UserContribution): boolean {
  return item.line_count !== null
}

/** Maps API / legacy role strings to canonical UserRole values. */
export function normalizeUserRole(
  role: UserRole | string | undefined
): UserRole | undefined {
  if (role == null || role === '') return undefined

  const key = String(role).toLowerCase().trim().replace(/_/g, ' ').replace(/\s+/g, ' ')

  switch (key) {
    case 'admin':
      return UserRole.Admin
    case 'annotator':
      return UserRole.Annotator
    case 'reviewer':
    case 'reveiwer':
      return UserRole.Reviewer
    // Legacy ITv2 role — no longer assignable in ITv3
    case 'final reviewer':
      return undefined
    default:
      if (Object.values(UserRole).includes(role as UserRole)) {
        return role as UserRole
      }
      return undefined
  }
}

export function isUserRoleAllowed(
  userRole: UserRole | string | undefined,
  allowedRoles: readonly (UserRole | string)[]
): boolean {
  const normalized = normalizeUserRole(userRole)
  if (!normalized) return false
  return allowedRoles.some((allowed) => normalizeUserRole(allowed) === normalized)
}

// User contribution filters
export interface UserContributionFilters {
  start_date: string
  end_date: string
}

