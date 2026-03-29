import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginPage({ navigation }) {
  const handleNavigation = () => {
    navigation.navigate('PhoneVerif');
  };

  return (
    <LinearGradient colors={['#e60f3f', '#e5dad1']} style={styles.container}>
      {/* Logo */}
      <Text style={styles.title}>Fuse</Text>

      {/* Animated Heart Using GIF */}
      <Image
        source={require('../../assets/heart-animation.gif')} // ✅ Correct Path
        style={styles.animation}
      />

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleNavigation}>
        <Text style={styles.buttonText}>Use mobile number</Text>
      </TouchableOpacity>

      {/* Terms and Privacy Policy */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          By signing up, you agree to our{' '}
          <Text style={styles.linkText} onPress={() => Alert.alert('Terms')}>Terms</Text>.
          See how we use your data in our{' '}
          <Text style={styles.linkText} onPress={() => Alert.alert('Privacy Policy')}>Privacy Policy</Text>.
        </Text>
        <Text style={styles.infoText}>We never post to Facebook.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  animation: {
    width: 200, // ✅ Adjust size if needed
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain', // Ensures it scales properly
  },
  button: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins-SemiBold',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Poppins',
  },
  linkText: {
    textDecorationLine: 'underline',
    color: '#ffffff',
  },
});
