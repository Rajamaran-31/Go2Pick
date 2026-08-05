import { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { colors, fontSize, spacing, borderRadius } from '../constants/theme';

const { width } = Dimensions.get('window');

const slides = [
  { icon: 'storefront-outline', title: 'Browse Local Shops', description: 'Discover registered local shops near you. Browse categories, view products and prices — all from your phone.', color: colors.primary },
  { icon: 'cart-outline', title: 'Order Before You Visit', description: 'Select products, add to cart, and place your order. Choose a convenient pickup time and skip the queue.', color: colors.accentDark },
  { icon: 'wallet-outline', title: 'Pick Up & Pay at Shop', description: 'Visit the shop at your chosen time, pick up your order, and pay directly. No hidden charges, no extra fees.', color: '#7C3AED' },
];

export default function Onboarding() {
  const router = useRouter();
  const { setOnboarded } = useAuthStore();
  const [active, setActive] = useState(0);
  const scrollRef = useRef(null);

  const handleDone = async () => {
    await setOnboarded();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (active < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (active + 1) * width, animated: true });
      setActive(active + 1);
    } else {
      handleDone();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipBtn} onPress={handleDone}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {slides.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide.color }]}>
              <Ionicons name={slide.icon} size={64} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === active && styles.activeDot]} />
          ))}
        </View>
        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextText}>{active === slides.length - 1 ? 'Get Started' : 'Next'}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skipBtn: { position: 'absolute', top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: fontSize.base, color: colors.textSecondary, fontWeight: '600' },
  slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  title: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.base },
  description: { fontSize: fontSize.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 60, gap: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.border },
  activeDot: { backgroundColor: colors.accent, width: 28 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, height: 56, borderRadius: borderRadius.md, gap: 8 },
  nextText: { color: '#fff', fontSize: fontSize.lg, fontWeight: '700' },
});
