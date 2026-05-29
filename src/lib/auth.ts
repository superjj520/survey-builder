'use client'

import { Session } from '@supabase/supabase-js'
import { supabaseClient, supabase } from './supabase'
import { Profile } from './types'

// Use the same client instance so auth session is shared with data queries
const getAuthClient = () => supabaseClient.client

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await getAuthClient().auth.signInWithPassword({ email, password })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function register(
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string; needsVerification?: boolean }> {
  const { error } = await getAuthClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true, needsVerification: true }
}

export async function resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await getAuthClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/`,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function isAuthenticated(): Promise<boolean> {
  const { data: { user } } = await getAuthClient().auth.getUser()
  return !!user
}

export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await getAuthClient().auth.getSession()
  return session
}

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await getAuthClient().auth.getUser()
  return user?.id || null
}

export async function getProfile(): Promise<Profile | null> {
  const userId = await getCurrentUserId()
  if (!userId) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
  return data as Profile | null
}

export async function updateProfile(updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>): Promise<{ success: boolean; error?: string }> {
  const userId = await getCurrentUserId()
  if (!userId) return { success: false, error: '未登录' }
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function logout() {
  await getAuthClient().auth.signOut()
}
