import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { authAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSignup = async () => {
    if (!name || !email || !phone || !password || !confirmPassword) { setError('Please fill all fields'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      await authAPI.signup({ fullName: name, email: email.toLowerCase().trim(), phone, password });
      setShowOtp(true);
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Signup failed. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setError('Please enter the OTP code'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.verifyEmail({ email: email.toLowerCase().trim(), otp });
      const token = await auth.currentUser.getIdToken();
      const resMe = await authAPI.getMe();
      await login(token, resMe.data);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e.response?.data?.detail || e.message || 'Invalid OTP code. Please try again.');
    } finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setError('');
    try {
      await authAPI.resendOtp({ email: email.toLowerCase(), type: 'signup' });
      Alert.alert('Sent!', 'Verification OTP has been resent to your email.');
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to resend OTP.');
    }
  };

  if (showOtp) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>We've sent a 6-digit OTP code to {email}</Text>
          </View>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Input label="Verification Code" value={otp} onChangeText={setOtp} placeholder="Enter 6-digit code" keyboardType="number-pad" icon="lock-closed-outline" />

          <Button title="Verify & Login" onPress={handleVerifyOtp} loading={loading} style={styles.btn} />

          <TouchableOpacity style={styles.linkRow} onPress={handleResendOtp}>
            <Text style={styles.linkText}>Didn't receive code? </Text>
            <Text style={styles.linkAccent}>Resend OTP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.linkRow, { marginTop: spacing.lg }]} onPress={() => setShowOtp(false)}>
            <Text style={styles.linkAccent}>Back to Register</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Go2Pick and start ordering</Text>
        </View>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        <Input label="Full Name" value={name} onChangeText={setName} placeholder="Enter your name" icon="person-outline" />
        <Input label="Email" value={email} onChangeText={setEmail} placeholder="Enter your email" keyboardType="email-address" icon="mail-outline" />
        <Input label="Phone Number" value={phone} onChangeText={setPhone} placeholder="Enter your phone" keyboardType="phone-pad" icon="call-outline" />
        <Input label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry icon="lock-closed-outline" />
        <Input label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm your password" secureTextEntry icon="lock-closed-outline" />

        <Button title="Create Account" onPress={handleSignup} loading={loading} style={styles.btn} />

        <TouchableOpacity style={styles.linkRow} onPress={() => router.back()}>
          <Text style={styles.linkText}>Already have an account? </Text>
          <Text style={styles.linkAccent}>Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.xl, paddingTop: 80 },
  header: { marginBottom: spacing.xxl },
  title: { fontSize: fontSize.xxxl, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: 4 },
  errorBox: { backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: borderRadius.sm, marginBottom: spacing.base },
  errorText: { color: colors.error, fontSize: fontSize.sm, fontWeight: '500' },
  btn: { marginTop: spacing.sm, marginBottom: spacing.base },
  linkRow: { flexDirection: 'row', justifyContent: 'center' },
  linkText: { fontSize: fontSize.md, color: colors.textSecondary },
  linkAccent: { fontSize: fontSize.md, color: colors.accent, fontWeight: '700' },
});
