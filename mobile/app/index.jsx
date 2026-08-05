import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { colors, fontSize } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const { token, isLoading, isOnboarded } = useAuthStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const timer = setTimeout(() => {
      if (!isOnboarded) router.replace('/onboarding');
      else if (token) router.replace('/(tabs)');
      else router.replace('/(auth)/login');
    }, 2000);
    return () => clearTimeout(timer);
  }, [isLoading, isOnboarded, token]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Go2Pick</Text>
        </View>
        <Text style={styles.title}>Go2Pick</Text>
        <Text style={styles.tagline}>Pre-order & Pickup</Text>
      </Animated.View>
      <Text style={styles.footer}>No hidden charges • Pay at shop</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  logo: { width: 90, height: 90, borderRadius: 22, backgroundColor: colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  title: { fontSize: fontSize.hero, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1 },
  tagline: { fontSize: fontSize.lg, color: 'rgba(255,255,255,0.7)', marginTop: 8, fontWeight: '500' },
  footer: { position: 'absolute', bottom: 60, color: 'rgba(255,255,255,0.4)', fontSize: fontSize.sm },
});
