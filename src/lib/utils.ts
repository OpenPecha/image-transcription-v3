import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { UserRole } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Maps UserRole enum to translation key
 */
const ROLE_TRANSLATION_KEYS: Record<UserRole, string> = {
  [UserRole.Admin]: 'admin',
  [UserRole.Annotator]: 'annotator',
  [UserRole.Reviewer]: 'reviewer',
}

export function getRoleTranslationKey(role: UserRole): string {
  return ROLE_TRANSLATION_KEYS[role] ?? 'annotator'
}