// Barra de navegación inferior (Chats / Perfil).
// Es propia en lugar de la nativa para controlar el diseño: fondo de la app,
// línea fina arriba y la pestaña activa marcada con el color de acento.
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Spacing, TouchTarget } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabIcon = { active: SymbolViewProps['name']; inactive: SymbolViewProps['name'] };

// Ícono de cada pestaña: relleno si está activa, de contorno si no (en iOS).
const ICONS: Record<string, TabIcon> = {
  index: {
    active: { ios: 'bubble.left.and.bubble.right.fill', android: 'chat' },
    inactive: { ios: 'bubble.left.and.bubble.right', android: 'chat' },
  },
  profile: {
    active: { ios: 'person.crop.circle.fill', android: 'account_circle' },
    inactive: { ios: 'person.crop.circle', android: 'account_circle' },
  },
};

const ICON_SIZE = 24;

export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useTheme();
  const keyboardVisible = useKeyboardVisible();

  // En Android el teclado empuja la barra hacia arriba: la ocultamos mientras se escribe.
  if (keyboardVisible) return null;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.bar,
        {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, Spacing.sm),
        },
      ]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const icon = ICONS[route.name];
        const color = focused ? theme.accent : theme.textMuted;

        function handlePress() {
          // Avisamos al navegador (por si alguna pantalla escucha "tabPress") y navegamos.
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        }

        return (
          <Pressable
            key={route.key}
            onPress={handlePress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={styles.tab}>
            {/* Marca superior: indica la sección activa sobre la línea de la barra */}
            <View style={[styles.indicator, focused && { backgroundColor: theme.accent }]} />
            {icon ? (
              <SymbolView
                name={focused ? icon.active : icon.inactive}
                size={ICON_SIZE}
                tintColor={color}
                fallback={<View style={styles.iconPlaceholder} />}
              />
            ) : null}
            <AppText
              variant="small"
              style={[styles.label, { color, fontWeight: focused ? '600' : '400' }]}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** true mientras el teclado está abierto (solo nos interesa en Android). */
function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    minHeight: TouchTarget + Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: Spacing.xs,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 32,
    height: 2,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  iconPlaceholder: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
  },
});
