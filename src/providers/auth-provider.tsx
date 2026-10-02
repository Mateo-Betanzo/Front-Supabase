// Guarda la sesión del usuario y la comparte con toda la app.
// También procesa los enlaces que vienen de Supabase (por ejemplo, el de
// "restablecer contraseña") para iniciar la sesión con sus tokens.
import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { createSessionFromUrl, isAuthUrl } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

type LinkStatus = 'idle' | 'processing' | 'error';

type AuthContextValue = {
  session: Session | null;
  /** true mientras leemos la sesión guardada al abrir la app */
  loading: boolean;
  /** estado del último enlace de Supabase que abrió la app */
  linkStatus: LinkStatus;
  linkError: string | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('idle');
  const [linkError, setLinkError] = useState<string | null>(null);

  // 1) Sesión guardada + cambios de sesión (login, logout, renovación de token)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // 2) Enlaces que abren la app (al arrancar o con la app ya abierta)
  useEffect(() => {
    async function handleUrl(url: string | null) {
      if (!url || !isAuthUrl(url)) return;
      setLinkStatus('processing');
      setLinkError(null);
      try {
        await createSessionFromUrl(url);
        setLinkStatus('idle');
      } catch (error) {
        setLinkError(getErrorMessage(error));
        setLinkStatus('error');
      }
    }

    Linking.getInitialURL().then(handleUrl); // la app estaba cerrada
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url)); // ya estaba abierta
    return () => subscription.remove();
  }, []);

  return <AuthContext value={{ session, loading, linkStatus, linkError }}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
