// Carga mi perfil (username y código de amigo) para la pestaña Perfil.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

type Profile = { username: string; friendCode: string };

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('username, friend_code')
      .eq('id', userId)
      .single();

    if (loadError || !data) {
      setError(getErrorMessage(loadError));
      return;
    }
    setError(null);
    setProfile({ username: data.username, friendCode: data.friend_code });
  }, [userId]);

  // Recarga cada vez que la pestaña vuelve a estar visible.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return { profile, error, reload: load };
}
