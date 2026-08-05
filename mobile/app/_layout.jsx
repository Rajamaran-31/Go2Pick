import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => { initialize(); }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(shopkeeper)" />
        <Stack.Screen name="shops" />
        <Stack.Screen name="products" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="orders" />
        <Stack.Screen name="search" options={{ animation: 'fade' }} />
        <Stack.Screen name="shopkeeper-request" />
      </Stack>
    </>
  );
}
