'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

export function getUserInitial(user: User | null): string {
  const source = user?.email?.trim() || '';
  if (!source) return 'U';
  return source.charAt(0).toUpperCase();
}

export function useLandingAuth(nextPath = '/') {
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      setCurrentUser(user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setCurrentUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    if (authLoading) return;
    setAuthLoading(true);
    const supabase = createClient();
    const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
    const siteUrl = runtimeOrigin || process.env.NEXT_PUBLIC_SITE_URL || '';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });

    if (error) {
      setAuthLoading(false);
      console.error(error);
      alert('登录失败：' + error.message);
    }
  }

  async function handleAuthButtonClick() {
    if (!currentUser) {
      await signInWithGoogle();
      return;
    }

    const confirmed = window.confirm('确认退出登录吗？');
    if (!confirmed) return;

    setAuthLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthLoading(false);
      console.error(error);
      alert('退出失败：' + error.message);
      return;
    }

    setCurrentUser(null);
    setAuthLoading(false);
  }

  return {
    loading,
    authLoading,
    currentUser,
    setCurrentUser,
    setAuthLoading,
    signInWithGoogle,
    handleAuthButtonClick,
  };
}
