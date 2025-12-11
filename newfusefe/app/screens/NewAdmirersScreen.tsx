import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Back icon

const NewAdmirersScreen = ({ navigation }) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>New admirers</Text>
        <View style={{ width: 28 }} /> {/* Placeholder for symmetry */}
      </View>

      {/* Description */}
      <Text style={styles.subtitle}>Get updates about who’s interested in you</Text>

      {/* Options */}
      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>Push notifications</Text>
        <Switch
          value={pushNotifications}
          onValueChange={setPushNotifications}
          trackColor={{ false: '#ccc', true: '#000' }}
          thumbColor={pushNotifications ? '#fff' : '#fff'}
        />
      </View>

      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>In-app notifications</Text>
        <Switch
          value={inAppNotifications}
          onValueChange={setInAppNotifications}
          trackColor={{ false: '#ccc', true: '#000' }}
          thumbColor={inAppNotifications ? '#fff' : '#fff'}
        />
      </View>
    </View>
  );
};

export default NewAdmirersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionContainer: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    fontSize: 16,
    color: '#000',
  },
});
