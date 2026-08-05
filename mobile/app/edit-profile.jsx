import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing } from '../constants/theme';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import ImagePickerField from '../components/ui/ImagePickerField';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function EditProfile() {
  const router = useRouter();
  const { user, refreshUser } = useAuthStore();
  const [form, setForm] = useState({ name: '', phone: '', avatar: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '', avatar: user.avatar || '' });
    }
  }, [user]);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.name) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateMe(form);
      await refreshUser();
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.base }}>
        <ImagePickerField 
          label="Profile Picture" 
          value={form.avatar} 
          onChangeText={v => update('avatar', v)} 
          placeholder="Upload a profile picture" 
        />
        <Input 
          label="Full Name *" 
          value={form.name} 
          onChangeText={v => update('name', v)} 
          placeholder="Your full name" 
          icon="person-outline" 
        />
        <Input 
          label="Email Address" 
          value={user?.email || ''} 
          onChangeText={() => {}} 
          placeholder="Email" 
          icon="mail-outline"
          editable={false}
        />
        <Input 
          label="Phone Number" 
          value={form.phone} 
          onChangeText={v => update('phone', v)} 
          placeholder="Your phone number" 
          keyboardType="phone-pad" 
          icon="call-outline" 
        />

        <Button title="Save Changes" onPress={handleSave} loading={loading} style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
});
