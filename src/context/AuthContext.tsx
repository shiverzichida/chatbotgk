'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface User {
  email: string;
  role: 'admin' | 'user';
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: 'admin' | 'user', name: string) => void; // fallback setter
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Tentukan role: jika email adalah admin utama, set sebagai admin, jika tidak baca metadata
        const role = session.user.email === 'admin@gizikebugaran.com' 
          ? 'admin' 
          : (session.user.user_metadata?.role as 'admin' | 'user') || 'user';
          
        setUser({
          email: session.user.email || '',
          role,
          name: (session.user.user_metadata?.name as string) || 'User Baru'
        });
      } else {
        // Fallback check ke local storage jika supabase auth kosong tapi ada local mock session
        const savedUser = localStorage.getItem('gk_user_session');
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (e) {
            localStorage.removeItem('gk_user_session');
          }
        }
      }
      setLoading(false);
    });

    // Listen to session changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.email === 'admin@gizikebugaran.com' 
          ? 'admin' 
          : (session.user.user_metadata?.role as 'admin' | 'user') || 'user';

        setUser({
          email: session.user.email || '',
          role,
          name: (session.user.user_metadata?.name as string) || 'User Baru'
        });
      } else {
        setUser(null);
        localStorage.removeItem('gk_user_session');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (email: string, role: 'admin' | 'user', name: string) => {
    const newUser: User = { email, role, name };
    setUser(newUser);
    localStorage.setItem('gk_user_session', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out from Supabase:', e);
    }
    setUser(null);
    localStorage.removeItem('gk_user_session');
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
