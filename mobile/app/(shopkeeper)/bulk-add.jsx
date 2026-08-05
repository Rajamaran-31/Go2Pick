import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import Button from '../../components/ui/Button';
import { productAPI, categoryAPI } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

export default function BulkAddProducts() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Initialize with 10 empty rows
  const createEmptyRow = () => ({ productName: '', price: '', stock: '0', category: '', description: '', imageUrl: '', uploadedUrl: '', threshold: '5' });
  const [rows, setRows] = useState(Array(10).fill(null).map(() => createEmptyRow()));
  const [loading, setLoading] = useState(false);

  const [existingCategories, setExistingCategories] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(null);

  useEffect(() => {
    categoryAPI.list()
      .then(res => {
        if (res.data && Array.isArray(res.data)) {
          setExistingCategories(res.data.map(c => c.name || c));
        }
      })
      .catch(err => console.log('Error fetching categories:', err));
  }, []);

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRows = () => {
    setRows([...rows, ...Array(10).fill(null).map(() => createEmptyRow())]);
  };

  const pickImageForRow = async (index) => {
    try {
      const { requestMediaLibraryPermissionsAsync, launchImageLibraryAsync, MediaTypeOptions } = require('expo-image-picker');
      const permissionResult = await requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert("Permission required", "You've refused to allow this app to access your photos!");
        return;
      }
      const result = await launchImageLibraryAsync({
        mediaTypes: MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const { uploadAPI, BASE_URL } = require('../../services/api');
        setLoading(true);
        const res = await uploadAPI.uploadImage(result.assets[0].uri);
        const finalUrl = res.data.url.startsWith('http') ? res.data.url : `${BASE_URL}${res.data.url}`;
        updateRow(index, 'uploadedUrl', finalUrl);
        setLoading(false);
      }
    } catch (e) {
      console.log('Picker error', e);
      Alert.alert('Error', 'Failed to upload image');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Filter out rows that are completely empty
    const validRows = rows.filter(r => 
      r.productName.trim() !== '' || 
      r.price.trim() !== '' || 
      r.category.trim() !== '' || 
      r.description.trim() !== '' || 
      (r.imageUrl || '').trim() !== '' || 
      r.uploadedUrl !== ''
    );
    
    if (validRows.length === 0) {
      Alert.alert('Error', 'Please enter at least one product.');
      return;
    }

    // Validate required fields
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      if (!r.productName.trim()) {
        Alert.alert('Validation Error', `Row ${rows.indexOf(r) + 1}: Product Name is required.`);
        return;
      }
      if (!r.price.trim()) {
        Alert.alert('Validation Error', `Row ${rows.indexOf(r) + 1}: Price is required.`);
        return;
      }
      if (!r.category.trim()) {
        Alert.alert('Validation Error', `Row ${rows.indexOf(r) + 1}: Category is required.`);
        return;
      }
    }

    const payload = {
      products: validRows.map(r => ({
        productName: r.productName.trim(),
        description: r.description.trim(),
        price: parseFloat(r.price) || 0.0,
        stock: parseInt(r.stock) || 0,
        threshold: parseInt(r.threshold) || 5,
        category: r.category.trim(),
        imageUrl: r.uploadedUrl || r.imageUrl.trim() || ''
      }))
    };

    setLoading(true);
    try {
      await productAPI.bulkAdd(payload);
      Alert.alert('Success', `Successfully imported ${payload.products.length} products!`, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to bulk import products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color={colors.textPrimary} /></TouchableOpacity>
          <Text style={styles.title}>Bulk Import</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.instructions}>Enter product details below. Empty rows will be ignored.</Text>

        <ScrollView horizontal bounces={false} style={styles.horizontalScroll} contentContainerStyle={{ minWidth: '100%' }}>
          <View style={{ flex: 1 }}>
            {/* Header Row */}
            <View style={styles.gridHeaderRow}>
              <Text style={[styles.gridHeaderCell, { flex: 0.5, minWidth: 40 }]}>#</Text>
              <Text style={[styles.gridHeaderCell, { flex: 3.5, minWidth: 320 }]}>Product Image</Text>
              <Text style={[styles.gridHeaderCell, { flex: 2, minWidth: 160 }]}>Product Name *</Text>
              <Text style={[styles.gridHeaderCell, { flex: 3, minWidth: 200 }]}>Description</Text>
              <Text style={[styles.gridHeaderCell, { flex: 1, minWidth: 90 }]}>Price (₹) *</Text>
              <Text style={[styles.gridHeaderCell, { flex: 1, minWidth: 80 }]}>Stock</Text>
              <Text style={[styles.gridHeaderCell, { flex: 1, minWidth: 80 }]}>Threshold</Text>
              <Text style={[styles.gridHeaderCell, { flex: 2.2, minWidth: 180 }]}>Category *</Text>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {rows.map((row, index) => {
                const suggestions = existingCategories.filter(cat =>
                  cat.toLowerCase().includes((row.category || '').toLowerCase()) &&
                  cat.toLowerCase() !== (row.category || '').toLowerCase()
                );

                const displayImage = row.uploadedUrl || row.imageUrl;

                return (
                  <View key={index} style={styles.gridRow}>
                    <Text style={[styles.gridCellText, { flex: 0.5, minWidth: 40 }]}>{index + 1}</Text>
                    
                    <View style={[styles.gridInputContainer, { flex: 3.5, minWidth: 320, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm }]}>
                      {displayImage ? (
                        <Image source={{ uri: displayImage }} style={{ width: 36, height: 36, borderRadius: 6, marginRight: 8 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: colors.surfaceHover, marginRight: 8, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border }}>
                          <Ionicons name="image-outline" size={18} color={colors.textLight} />
                        </View>
                      )}
                      <TextInput
                        style={{ flex: 1, height: 40, fontSize: fontSize.sm, color: colors.textPrimary, paddingHorizontal: 4 }}
                        placeholder="Paste image URL..."
                        value={row.imageUrl || ''}
                        onChangeText={(v) => updateRow(index, 'imageUrl', v)}
                      />
                      <TouchableOpacity onPress={() => pickImageForRow(index)} style={{ padding: 6, backgroundColor: colors.surfaceHover, borderRadius: 8, marginLeft: 6 }}>
                        <Ionicons name="camera-outline" size={18} color={colors.accent} />
                      </TouchableOpacity>
                    </View>

                    <TextInput
                      style={[styles.gridInput, { flex: 2, minWidth: 160 }]}
                      placeholder="Item name"
                      value={row.productName || ''}
                      onChangeText={(v) => updateRow(index, 'productName', v)}
                    />

                    <TextInput
                      style={[styles.gridInput, { flex: 3, minWidth: 200 }]}
                      placeholder="Short description"
                      value={row.description || ''}
                      onChangeText={(v) => updateRow(index, 'description', v)}
                    />

                    <TextInput
                      style={[styles.gridInput, { flex: 1, minWidth: 90 }]}
                      placeholder="0.00"
                      keyboardType="numeric"
                      value={row.price || ''}
                      onChangeText={(v) => updateRow(index, 'price', v)}
                    />

                    <TextInput
                      style={[styles.gridInput, { flex: 1, minWidth: 80 }]}
                      placeholder="0"
                      keyboardType="numeric"
                      value={row.stock || ''}
                      onChangeText={(v) => updateRow(index, 'stock', v)}
                    />

                    <TextInput
                      style={[styles.gridInput, { flex: 1, minWidth: 80 }]}
                      placeholder="5"
                      keyboardType="numeric"
                      value={row.threshold || ''}
                      onChangeText={(v) => updateRow(index, 'threshold', v)}
                    />

                    <View style={[styles.gridInputContainer, { flex: 2.2, minWidth: 180, paddingHorizontal: spacing.sm, justifyContent: 'center' }]}>
                      <TextInput
                        style={{ height: 32, fontSize: fontSize.base, color: colors.textPrimary }}
                        placeholder="e.g. Snacks"
                        value={row.category || ''}
                        onChangeText={(v) => updateRow(index, 'category', v)}
                        onFocus={() => setFocusedIndex(index)}
                      />
                      {focusedIndex === index && suggestions.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', marginTop: 2, maxHeight: 22 }} contentContainerStyle={{ alignItems: 'center' }}>
                          {suggestions.map((cat, sIdx) => (
                            <TouchableOpacity 
                              key={sIdx} 
                              onPress={() => { updateRow(index, 'category', cat); setFocusedIndex(null); }} 
                              style={{ paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.accent + '20', borderRadius: 8, marginRight: 4 }}
                            >
                              <Text style={{ fontSize: fontSize.xs - 2, color: colors.accent, fontWeight: '700' }}>{cat}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addRowBtn} onPress={addRows}>
                <Ionicons name="add" size={18} color={colors.accent} />
                <Text style={styles.addRowText}>Add 10 More Rows</Text>
              </TouchableOpacity>
              <View style={{ height: 100 }} />
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.textPrimary },
  saveText: { fontSize: fontSize.base, fontWeight: '700', color: colors.accent },
  instructions: { paddingHorizontal: spacing.base, fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  horizontalScroll: { flex: 1, backgroundColor: colors.surface },
  gridHeaderRow: { flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: colors.border, paddingVertical: spacing.sm, backgroundColor: colors.surfaceHover },
  gridHeaderCell: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textSecondary, paddingHorizontal: spacing.sm },
  gridRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, alignItems: 'center' },
  gridCellText: { fontSize: fontSize.sm, color: colors.textLight, paddingHorizontal: spacing.sm, textAlign: 'center' },
  gridInputContainer: { height: 44, borderRightWidth: 1, borderRightColor: colors.border },
  gridInput: { height: 44, fontSize: fontSize.base, color: colors.textPrimary, paddingHorizontal: spacing.sm, borderRightWidth: 1, borderRightColor: colors.border },
  miniImagePicker: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceHover, alignItems: 'center', justifyContent: 'center' },
  addRowBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, marginTop: spacing.md, gap: spacing.xs },
  addRowText: { color: colors.accent, fontWeight: '600', fontSize: fontSize.sm },
});
