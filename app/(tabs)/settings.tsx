import { NewsCategory, useSettings } from '@/hooks/SettingsContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const { unit, setUnit, categories, toggleCategory } = useSettings();

  const newsCategories = [
    { key: 'business', label: 'Business' },
    { key: 'entertainment', label: 'Entertainment' },
    { key: 'health', label: 'Health' },
    { key: 'technology', label: 'Technology' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>

        {/* Temperature Unit Section */}
        <Text style={styles.sectionTitle}>Temperature Unit</Text>
        <TouchableOpacity
          style={styles.option}
          onPress={() => setUnit('metric')}
        >
          <View style={[styles.radio, unit === 'metric' && styles.radioSelected]}>
            {unit === 'metric' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.optionText}>Celsius</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.option}
          onPress={() => setUnit('imperial')}
        >
          <View style={[styles.radio, unit === 'imperial' && styles.radioSelected]}>
            {unit === 'imperial' && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.optionText}>Fahrenheit</Text>
        </TouchableOpacity>

        {/* News Categories Section */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>News Categories</Text>
        {newsCategories.map((category) => {
          const isSelected = categories.includes(category.key as NewsCategory);
          return (
            <TouchableOpacity
              key={category.key}
              style={styles.option}
              onPress={() => toggleCategory(category.key as NewsCategory)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <View style={styles.checkboxDot} />}
              </View>
              <Text style={styles.optionText}>{category.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#000',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    borderColor: '#000',
  },
  checkboxDot: {
    width: 12,
    height: 12,
    backgroundColor: '#000',
  },
  optionText: {
    fontSize: 16,
  },
});