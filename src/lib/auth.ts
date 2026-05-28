'use client'

const AUTH_KEY = 'survey_admin_auth'
const ADMIN_PASSWORD = 'Jj23456*'

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
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
