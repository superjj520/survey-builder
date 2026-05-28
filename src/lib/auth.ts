'use client'

const AUTH_KEY = 'survey_admin_auth'

export function login(password: string): boolean {
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD
  if (password === adminPassword) {
    localStorage.setItem(AUTH_KEY, 'true')
    return true
  }
  return false
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(AUTH_KEY) === 'true'
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}
