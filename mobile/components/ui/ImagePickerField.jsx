import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Input from './Input';
import { uploadAPI, BASE_URL } from '../../services/api';

export default function ImagePickerField({ label, value, onChangeText, placeholder = "Enter Image URL or pick from gallery" }) {
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You've refused to allow this app to access your photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleUpload(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Image picker error:', e);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const handleUpload = async (uri) => {
    setUploading(true);
    try {
      const res = await uploadAPI.uploadImage(uri);
      // The backend returns a relative URL like /uploads/filename.jpg
      // Prepend the BASE_URL so it loads correctly on this device
      const fullUrl = `${BASE_URL}${res.data.url}`;
      onChangeText(fullUrl);
    } catch (e) {
      console.log('Upload error:', e);
      Alert.alert('Upload Failed', 'There was a problem uploading your image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Input 
        label={label} 
        value={value} 
        onChangeText={onChangeText} 
        placeholder={placeholder} 
        icon="link-outline" 
      />
      
      <View style={styles.actionRow}>
        <Text style={styles.orText}>- OR -</Text>
        <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color={colors.surface} />
          ) : (
            <>
              <Ionicons name="images-outline" size={20} color={colors.surface} />
              <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {value ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: value }} style={styles.previewImage} resizeMode="cover" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md, marginTop: -spacing.sm, marginBottom: spacing.sm },
  orText: { color: colors.textLight, fontSize: fontSize.sm, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: borderRadius.md },
  uploadBtnText: { color: colors.surface, fontWeight: '600', fontSize: fontSize.sm },
  previewContainer: { marginTop: spacing.sm, borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, height: 200, width: '100%', backgroundColor: colors.surfaceHover },
  previewImage: { width: '100%', height: '100%' },
});
