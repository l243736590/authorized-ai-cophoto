/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface AdminUser {
  username: string
  password: string
  createdAt: string
}

interface AdminContextValue {
  currentUser: string | null
  isAuthenticated: boolean
  editMode: boolean
  setEditMode: (enabled: boolean) => void
  register: (username: string, password: string) => { ok: boolean; message: string }
  login: (username: string, password: string) => { ok: boolean; message: string }
  logout: () => void
}

const AdminContext = createContext<AdminContextValue | null>(null)
const usersStorageKey = 'authorized-ai-cophoto-admin-users-v1'
const sessionStorageKey = 'authorized-ai-cophoto-admin-session-v1'
const editModeStorageKey = 'authorized-ai-cophoto-edit-mode-v1'

function loadUsers(): AdminUser[] {
  try {
    const saved = window.localStorage.getItem(usersStorageKey)
    return saved ? (JSON.parse(saved) as AdminUser[]) : []
  } catch {
    return []
  }
}

function saveUsers(users: AdminUser[]) {
  window.localStorage.setItem(usersStorageKey, JSON.stringify(users))
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(() => window.localStorage.getItem(sessionStorageKey))
  const [editMode, setEditModeState] = useState(() => window.localStorage.getItem(editModeStorageKey) === 'true')

  const value = useMemo<AdminContextValue>(() => {
    function register(username: string, password: string) {
      const normalizedUsername = username.trim()
      if (normalizedUsername.length < 3 || password.length < 6) {
        return { ok: false, message: '账号至少 3 位，密码至少 6 位。' }
      }

      const users = loadUsers()
      if (users.some((user) => user.username === normalizedUsername)) {
        return { ok: false, message: '这个管理员账号已经存在。' }
      }

      const nextUsers = [...users, { username: normalizedUsername, password, createdAt: new Date().toISOString() }]
      saveUsers(nextUsers)
      window.localStorage.setItem(sessionStorageKey, normalizedUsername)
      window.localStorage.setItem(editModeStorageKey, 'true')
      setCurrentUser(normalizedUsername)
      setEditModeState(true)
      return { ok: true, message: '注册成功，已进入管理员模式。' }
    }

    function login(username: string, password: string) {
      const normalizedUsername = username.trim()
      const user = loadUsers().find((item) => item.username === normalizedUsername && item.password === password)
      if (!user) {
        return { ok: false, message: '账号或密码不正确。' }
      }

      window.localStorage.setItem(sessionStorageKey, normalizedUsername)
      window.localStorage.setItem(editModeStorageKey, 'true')
      setCurrentUser(normalizedUsername)
      setEditModeState(true)
      return { ok: true, message: '登录成功。' }
    }

    function logout() {
      window.localStorage.removeItem(sessionStorageKey)
      window.localStorage.setItem(editModeStorageKey, 'false')
      setCurrentUser(null)
      setEditModeState(false)
    }

    function setEditMode(enabled: boolean) {
      if (!currentUser) {
        return
      }

      window.localStorage.setItem(editModeStorageKey, String(enabled))
      setEditModeState(enabled)
    }

    return {
      currentUser,
      isAuthenticated: Boolean(currentUser),
      editMode: Boolean(currentUser) && editMode,
      setEditMode,
      register,
      login,
      logout,
    }
  }, [currentUser, editMode])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used inside AdminProvider')
  }
  return context
}
