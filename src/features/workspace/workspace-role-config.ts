import type { AssignedTaskState } from '@/types'
import {
  UserRole,
  ITV3_REVIEWER_APPROVABLE_STATES,
  isEditableTaskState,
  normalizeUserRole,
} from '@/types'

export function isAnnotatorRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.Annotator
}

export function isReviewerRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.Reviewer
}

/** Kept until Part 3 removes Final Reviewer from admin surfaces. */
export function isFinalReviewerRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.FinalReviewer
}

export type ReferenceTabsMode = 'none' | 'annotators'

export type WorkspaceRoleCaps = {
  usesDiffResolver: boolean
  usesApproveAction: boolean
  dictionaryEnabled: boolean
  referenceTabs: ReferenceTabsMode
}

const ANNOTATOR_CAPS: WorkspaceRoleCaps = {
  usesDiffResolver: false,
  usesApproveAction: false,
  dictionaryEnabled: true,
  referenceTabs: 'none',
}

const REVIEWER_CAPS: WorkspaceRoleCaps = {
  usesDiffResolver: true,
  usesApproveAction: true,
  dictionaryEnabled: true,
  referenceTabs: 'annotators',
}

/** Workspace caps for Annotator / Reviewer only — Final Reviewer has no workspace access. */
export function getWorkspaceRoleCaps(role: UserRole | string | undefined): WorkspaceRoleCaps | null {
  const normalized = normalizeUserRole(role)
  if (isAnnotatorRole(normalized)) return ANNOTATOR_CAPS
  if (isReviewerRole(normalized)) return REVIEWER_CAPS
  return null
}

/** Whether the working area (diff resolver / editor) is editable for this state. */
export function isWorkspaceEditable(
  state: AssignedTaskState,
  _role?: UserRole | string | undefined
): boolean {
  return isEditableTaskState(state)
}

/** Reviewer — reject annotator slot(s) while task is in reviewing. */
export function canReviewerRejectAnnotators(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  return isReviewerRole(role) && state === 'reviewing'
}

/** Whether a reviewer may approve/submit the assigned task in this state. */
export function isApprovableTaskState(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  if (!isReviewerRole(role)) return false
  return (ITV3_REVIEWER_APPROVABLE_STATES as readonly string[]).includes(state)
}
