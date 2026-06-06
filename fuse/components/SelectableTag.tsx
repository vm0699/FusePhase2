import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface SelectableTagProps {
  selected?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
  style?: object;
  disabled?: boolean;
}

export function SelectableTag({
  selected,
  onPress,
  children,
  style,
  disabled,
}: SelectableTagProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.tag,
        selected ? styles.selectedTag : styles.defaultTag,
        style,
        disabled && styles.disabledTag,
      ]}
    >
      <Text style={selected ? styles.selectedText : styles.defaultText}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },
  defaultTag: {
    borderColor: '#e5e7eb', // Gray-200 equivalent
    backgroundColor: 'transparent',
  },
  selectedTag: {
    borderColor: '#acb7ae', // Light green-gray
    backgroundColor: 'rgba(172, 183, 174, 0.1)', // Light green-gray with opacity
  },
  disabledTag: {
    opacity: 0.5,
  },
  defaultText: {
    color: '#6b7280', // Gray-400 equivalent
  },
  selectedText: {
    color: '#374151', // Gray-800 equivalent
  },
});
