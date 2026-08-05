import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, Dimensions, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, borderRadius, fontSize, spacing } from '../../constants/theme';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;

const banners = [
  { title: 'Order Before You Visit', subtitle: 'Skip the queue! Pre-order from your favourite shops.', gradient: ['#1B2A4A', '#2D4373'] },
  { title: 'Pay at Shop', subtitle: 'No online payment needed. Pay directly when you pick up.', gradient: ['#16A34A', '#22C55E'] },
  { title: 'No Hidden Charges', subtitle: 'Same price as the shop. Zero commission, zero delivery fee.', gradient: ['#7C3AED', '#A78BFA'] },
];

export default function BannerCarousel() {
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (active + 1) % banners.length;
      scrollRef.current?.scrollTo({ x: next * BANNER_WIDTH, animated: true });
      setActive(next);
    }, 4000);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH))}
        style={{ width: BANNER_WIDTH }}
      >
        {banners.map((b, i) => (
          <View key={i} style={[styles.banner, { width: BANNER_WIDTH }]}>
            <View style={[styles.bannerGradient, { backgroundColor: b.gradient[0] }]}>
              <Text style={styles.bannerTitle}>{b.title}</Text>
              <Text style={styles.bannerSubtitle}>{b.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <View key={i} style={[styles.dot, i === active && styles.activeDot]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: spacing.base, marginTop: spacing.base },
  banner: { height: 160, borderRadius: borderRadius.lg, overflow: 'hidden' },
  bannerGradient: { flex: 1, padding: spacing.xl, justifyContent: 'center', borderRadius: borderRadius.lg },
  bannerTitle: { fontSize: fontSize.xxl, fontWeight: '800', color: '#FFFFFF', marginBottom: spacing.sm },
  bannerSubtitle: { fontSize: fontSize.md, color: 'rgba(255,255,255,0.85)', lineHeight: 22 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md, gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
  activeDot: { backgroundColor: colors.accent, width: 24 },
});
