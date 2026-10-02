import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// Nunca cambia: solo nos interesa saber si estamos en el servidor o en el navegador.
const subscribe = () => () => {};

/**
 * En web la app se pre-renderiza en Node (render estático), donde no se conoce
 * el modo del sistema. Para que el HTML del servidor y el primer render del
 * navegador coincidan, usamos 'light' hasta terminar de hidratar y después
 * el modo real (claro u oscuro).
 */
export function useColorScheme() {
  // false en el servidor y durante la hidratación; true después, en el navegador.
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
  const colorScheme = useRNColorScheme();

  return hydrated ? colorScheme : 'light';
}
