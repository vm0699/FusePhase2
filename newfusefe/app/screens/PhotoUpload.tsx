import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { ProfileContext } from '../../ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_URL = "http://172.20.10.4:5000";
const ONBOARDING_STEP_KEY = '@onboarding_step'; // 🔹 2.1

export default function PhotoUploadPage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext);

  const initializePhotos = () => {
    if (profileData?.photos && Array.isArray(profileData.photos)) {
      const filled = [...profileData.photos];
      while (filled.length < 6) filled.push(null);
      return filled;
    }
    return Array(6).fill(null);
  };

  const [photos, setPhotos] = useState(initializePhotos);
  const [uploading, setUploading] = useState(false);

  // 🔹 2.1 — persist current onboarding step (LOCAL resume)
  useEffect(() => {
    AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'PhotoUpload');
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Please enable gallery access.");
      }
    })();
  }, []);

  const handlePickPhoto = async (index) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        let updated = [...photos];
        updated[index] = result.assets[0].uri;
        setPhotos(updated);
        updateProfileData("photos", updated);
      }
    } catch (error) {
      console.error("❌ Photo picker error:", error);
    }
  };

  const handleSubmit = async () => {
    const filledPhotos = photos.filter(photo => photo !== null);
    if (filledPhotos.length < 4) {
      Alert.alert("Incomplete", "Please upload at least 4 photos.");
      return;
    }

    try {
      setUploading(true);
      const token = await AsyncStorage.getItem("jwtToken");
      const phoneNumber = profileData.number;

      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);

      const compressAndCalculateSize = async (uris, fallback = false) => {
        let totalSize = 0;
        const compressedPhotos = [];

        for (const uri of uris) {
          const compressed = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: fallback ? 600 : 800 } }],
            {
              compress: fallback ? 0.2 : 0.4,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          const response = await fetch(compressed.uri);
          const blob = await response.blob();
          totalSize += blob.size;

          compressedPhotos.push({
            uri: compressed.uri,
            name: compressed.uri.split('/').pop(),
            type: 'image/jpeg',
          });
        }

        return { totalSize, compressedPhotos };
      };

      // 🔁 First compression attempt
      let { totalSize, compressedPhotos } =
        await compressAndCalculateSize(filledPhotos);

      // 🔁 Fallback compression
      if (totalSize > 1024 * 1024) {
        const fallbackResult =
          await compressAndCalculateSize(filledPhotos, true);
        totalSize = fallbackResult.totalSize;
        compressedPhotos = fallbackResult.compressedPhotos;
      }

      if (totalSize > 1024 * 1024) {
        Alert.alert(
          "Size Exceeded",
          "Total image size exceeds 1MB. Please remove or replace one photo."
        );
        setUploading(false);
        return;
      }

      compressedPhotos.forEach(photo => {
        formData.append("photos", photo);
      });

      const uploadRes = await fetch(
        `${BASE_URL}/api/profile/upload-photos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.message || "Upload failed");

      const uploadedPhotos = uploadJson.data.photos;
      updateProfileData("photos", uploadedPhotos);

      // =====================================================
      // 🔥 2.1 CORE CHANGE — BACKEND CHECKPOINT SAVE
      // Mark photos done in DB
      // =====================================================
      await fetch(`${BASE_URL}/api/profile/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          updates: {
            photos: uploadedPhotos,
            onboardingStage: "PHOTOS_DONE", // ✅ backend checkpoint
          },
        }),
      });
      // =====================================================

      // 🔹 2.1 — advance local resume pointer
      await AsyncStorage.setItem(ONBOARDING_STEP_KEY, 'Guidelines');

      Alert.alert("Success", "Photos uploaded!");
      navigation.navigate("Guidelines");
    } catch (error) {
      console.error("❌ Upload Error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add at least 4 great photos</Text>
      <Text style={styles.description}>
        Whether it’s you with your pet, doing what you love, or at your favorite place — let your photos talk!
      </Text>

      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoBox}
            onPress={() => handlePickPhoto(index)}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.image} />
            ) : (
              <Text style={styles.placeholder}>+</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {uploading && (
        <ActivityIndicator
          size="large"
          color="#ff5864"
          style={{ marginTop: 16 }}
        />
      )}

      <TouchableOpacity
        style={[
          styles.submitButton,
          {
            backgroundColor:
              photos.filter(p => p !== null).length >= 4
                ? "#e60f3f"
                : "#ff586480",
          },
        ]}
        disabled={photos.filter(p => p !== null).length < 4}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 40 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 30 },
  description: { fontSize: 14, color: "#555", marginBottom: 20 },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  photoBox: {
    width: 100,
    height: 100,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },

  image: { width: "100%", height: "100%", borderRadius: 10 },
  placeholder: { fontSize: 32, color: "#aaa" },

  submitButton: {
    backgroundColor: "#ff5864", // ✅ App color
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
