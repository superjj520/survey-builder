'use client'

import { Session } from '@supabase/supabase-js'
import { supabaseClient, supabase } from './supabase'
import { Profile } from './types'

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseClient.client.auth.signInWithPassword({ email, password })
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
  const { error } = await supabaseClient.client.auth.signUp({
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
  const { error } = await supabaseClient.client.auth.resetPasswordForEmail(email, {
    redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/admin/`,
  })
  if (error) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabaseClient.client.auth.getSession()
  return !!data.session
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabaseClient.client.auth.getSession()
  return data.session
}

export async function getProfile(): Promise<Profile | null> {
  const session = await getSession()
  if (!session) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
  return data as Profile | null
}

export async function updateProfile(updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>): Promise<{ success: boolean; error?: string }> {
  const session = await getSession()
  if (!session) return { success: false, error: '未登录' }
  const { error } = await supabase.from('profiles').update(updates).eq('id', session.user.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function logout() {
  await supabaseClient.client.auth.signOut()
}
