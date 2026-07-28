import { useCallback, useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Diamond, LogOut, RefreshCw, FileText, Users, LayoutDashboard, Loader2, Settings } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle, LanguageToggle, TaskFileName } from '@/components/common'
import type { AssignedTask } from '@/types'
import { TaskRejectionInfo } from './task-rejection-info'
import { RejectionHistory } from './rejection-history'

interface WorkspaceSidebarProps {
  task: AssignedTask | null
  onRefresh?: () => void
  isLoading?: boolean
}

// Status color configuration
const getStateColor = (state: string): string => {
  switch (state) {
    case 'annotating':
    case 'annotating_b':
    case 'annotating_c':
      return 'text-primary fill-primary'
    case 'reviewing':
    case 'reviewing_b':
    case 'half_annotated':
    case 'half_reviewed':
    case 'annotated':
      return 'text-warning fill-warning'
    case 'reviewed':
    case 'finalising':
    case 'finalised':
      return 'text-success fill-success'
    case 'trashed':
      return 'text-destructive fill-destructive'
    default:
      return 'text-muted-foreground'
  }
}


export function WorkspaceSidebar({
  task,
  onRefresh,
  isLoading,
}: WorkspaceSidebarProps) {
  const { t } = useTranslation('workspace')
  const { t: tCommon } = useTranslation('common')
  const { currentUser, logout } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const sidebarRef = useRef<HTMLElement>(null)

  // Close settings when clicking outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [settingsOpen])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const toggleSettings = () => {
    setSettingsOpen((prev) => !prev)
  }

  if (!currentUser) return null

  return (
    <aside
      ref={sidebarRef}
      className="fixed left-0 top-0 z-40 flex h-dvh max-h-dvh w-60 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar"
    >
      {/* Logo / Brand */}
      <div className="flex h-16 items-center px-4">
      <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sidebar-foreground font-inter">Image</span>
              <span className="text-xs text-sidebar-foreground/70 font-inter">Transcription V3</span>
            </div>
          </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <nav className="p-2">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LayoutDashboard className="h-5 w-5 shrink-0" />
          <span>{t('sidebar.dashboard')}</span>
        </Link>
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Current Task Info */}
      <div className="flex-1 overflow-y-auto p-4">
        {task ? (
          <div className="space-y-4">
            {/* Task Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-xs font-medium uppercase text-muted-foreground">
                  {t('sidebar.currentTask')}
                </div>
                {isLoading && (
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                )}
              </div>
              
              {/* Task Name */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-sidebar-accent">
                <FileText className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <TaskFileName
                    fileName={task.task_name}
                    textClassName="text-sidebar-foreground"
                    expanded
                    showExpandToggle={false}
                    enableContextMenu
                  />
                  <div className={cn(
                    'flex items-center gap-1 mt-1 text-xs',
                    getStateColor(task.state)
                  )}>
                  </div>
                  <TaskRejectionInfo task={task} role={currentUser.role} />
                  <RejectionHistory task={task} role={currentUser.role} />
                </div>
              </div>
            </div>

            {/* Group Info */}
            {task.group && task.group !== 'string' && (
              <div className="space-y-2">
                <h3 className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                  {t('sidebar.group')}
                </h3>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-sidebar-accent/50">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-sidebar-foreground truncate">
                    {task.group}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Diamond className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">{t('sidebar.noTaskAssigned')}</p>
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="mt-2"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                {t('sidebar.getTask')}
              </Button>
            )}
          </div>
        )}
      </div>

      <Separator className="bg-sidebar-border" />

      {/* User Profile & Settings */}
      <div className="shrink-0 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {/* Settings Panel - Animated */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            settingsOpen ? 'max-h-40 opacity-100 mb-2' : 'max-h-0 opacity-0'
          )}
        >
          <div className="flex flex-col gap-2 rounded-lg bg-sidebar-accent/50 p-2">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              <span className="ml-2">{tCommon('actions.logout')}</span>
            </Button>
          </div>
        </div>

        {/* Profile Row */}
        <div className="flex items-center gap-3 rounded-lg p-2">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={currentUser.picture} alt={currentUser.username ?? ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getInitials(currentUser.username ?? 'No Name')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {currentUser.username}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {currentUser.role ? `${currentUser.role}` : t('sidebar.noRole')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 shrink-0 text-muted-foreground hover:text-sidebar-foreground transition-transform duration-200',
              settingsOpen && 'rotate-90'
            )}
            onClick={toggleSettings}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
