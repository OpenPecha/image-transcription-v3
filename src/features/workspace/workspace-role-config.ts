import type { AssignedTaskState } from '@/types'
import {
  UserRole,
  ITV3_REVIEWER_APPROVABLE_STATES,
  ITV3_FINAL_REVIEWER_APPROVABLE_STATES,
  isEditableTaskState,
  normalizeUserRole,
} from '@/types'

/**
 * When true, Final Reviewer mirrors Reviewer workspace behavior (UI + API).
 * Set to false and customize FINAL_REVIEWER_CAPS when the workflow diverges.
 */
export const FINAL_REVIEWER_SHARES_REVIEWER_WORKFLOW = true

export function isAnnotatorRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.Annotator
}

export function isReviewerRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.Reviewer
}

export function isFinalReviewerRole(role: UserRole | string | undefined): boolean {
  return normalizeUserRole(role) === UserRole.FinalReviewer
}

export type ReferenceTabsMode = 'none' | 'annotators' | 'reviewers'

export interface WorkspaceRoleCaps {
  usesReviewerTranscript: boolean
  usesDiffResolver: boolean
  usesApproveAction: boolean
  dictionaryEnabled: boolean
  referenceTabs: ReferenceTabsMode
}

const ANNOTATOR_CAPS: WorkspaceRoleCaps = {
  usesReviewerTranscript: false,
  usesDiffResolver: false,
  usesApproveAction: false,
  dictionaryEnabled: true,
  referenceTabs: 'none',
}

const REVIEWER_CAPS: WorkspaceRoleCaps = {
  usesReviewerTranscript: true,
  usesDiffResolver: true,
  usesApproveAction: true,
  dictionaryEnabled: true,
  referenceTabs: 'annotators',
}

/** Final Reviewer caps when FINAL_REVIEWER_SHARES_REVIEWER_WORKFLOW is false. */
const FINAL_REVIEWER_CAPS: WorkspaceRoleCaps = {
  usesReviewerTranscript: true,
  usesDiffResolver: true,
  usesApproveAction: true,
  dictionaryEnabled: true,
  referenceTabs: 'reviewers',
}

export function getWorkspaceRoleCaps(role: UserRole | string | undefined): WorkspaceRoleCaps | null {
  const normalized = normalizeUserRole(role)
  if (isAnnotatorRole(normalized)) return ANNOTATOR_CAPS
  if (isReviewerRole(normalized)) return REVIEWER_CAPS
  if (isFinalReviewerRole(normalized)) {
    return FINAL_REVIEWER_SHARES_REVIEWER_WORKFLOW
      ? { ...REVIEWER_CAPS, referenceTabs: 'reviewers' }
      : { ...FINAL_REVIEWER_CAPS }
  }
  return null
}

/** Whether the working area (diff resolver / editor) is editable for this role and state. */
export function isWorkspaceEditable(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  if (isEditableTaskState(state)) return true
  return isFinalReviewerRole(role) && state === 'finalising'
}

/** Reviewer A only — reject annotator slot(s) while task is in reviewing. */
export function canReviewerRejectAnnotators(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  return isReviewerRole(role) && state === 'reviewing'
}

/** Final Reviewer — reject reviewer slot(s) while task is in finalising. */
export function canFinalReviewerRejectReviewers(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  return isFinalReviewerRole(role) && state === 'finalising'
}

/** Whether a reviewer-role user may approve/submit the assigned task in this state. */
export function isApprovableTaskState(
  state: AssignedTaskState,
  role: UserRole | string | undefined
): boolean {
  if (isFinalReviewerRole(role)) {
    return (ITV3_FINAL_REVIEWER_APPROVABLE_STATES as readonly string[]).includes(state)
  }
  if (isReviewerRole(role)) {
    return (ITV3_REVIEWER_APPROVABLE_STATES as readonly string[]).includes(state)
  }
  return false
}
