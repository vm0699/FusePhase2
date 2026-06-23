import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { Plus } from 'lucide-react-native';
import { ProfileContext } from '../../ProfileContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { useIsFocused } from '@react-navigation/native';
import { AppState } from 'react-native';
import OnboardingStepper from '../../components/OnboardingStepper';
import Button from '../../components/ui/Button';
import { theme } from '../theme';
import { API_BASE_URL } from '../config/env';



const BASE_URL = API_BASE_URL;

export default function PhotoUploadPage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext);
  const submitLockRef = useRef(false);



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
  const isFocused = useIsFocused();
  const [appReady, setAppReady] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Please enable gallery access.");
      }
    })();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      appState.current = nextState;

      if (nextState === "active") {
        setAppReady(true);
      } else {
        setAppReady(false);
      }
    });

    // initial hydration check
    if (appState.current === "active") {
      setAppReady(true);
    }

    return () => subscription.remove();
  }, []);


  const handlePickPhoto = async (index) => {
    try {
      const isReplacingExistingPhoto = Boolean(photos[index]);
      const availableIndexes = isReplacingExistingPhoto
        ? [index]
        : [
            index,
            ...photos
              .map((photo, slotIndex) =>
                photo === null && slotIndex !== index ? slotIndex : null
              )
              .filter((slotIndex) => slotIndex !== null),
          ];

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: isReplacingExistingPhoto,
        allowsMultipleSelection: !isReplacingExistingPhoto,
        selectionLimit: availableIndexes.length,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        let updated = [...photos];
        result.assets
          .slice(0, availableIndexes.length)
          .forEach((asset, assetIndex) => {
            const targetIndex = availableIndexes[assetIndex];
            if (typeof targetIndex === 'number') {
              updated[targetIndex] = asset.uri;
            }
          });
        setPhotos(updated);
        updateProfileData("photos", updated);
      }
    } catch (error) {
      console.error("❌ Photo picker error:", error);
    }
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || uploading) {
      return;
    }

    const filledPhotos = photos.filter(photo => photo !== null);
    if (filledPhotos.length < 4) {
      Alert.alert("Incomplete", "Please upload at least 4 photos.");
      return;
    }

    try {
      submitLockRef.current = true;
      setUploading(true);
      const token = await AsyncStorage.getItem("jwtToken");
      const phoneNumber = profileData.number;

      const formData = new FormData();
      formData.append("phoneNumber", phoneNumber);
      formData.append("replaceAll", "true");
      formData.append("onboardingStage", "PHOTOS_DONE");

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

      // 🔽 INSIDE handleSubmit(), REPLACE ONLY THIS PART

      const uploadedPhotos = Array.isArray(uploadJson.data?.photos)
        ? uploadJson.data.photos
        : [];
      updateProfileData("photos", uploadedPhotos);

      Alert.alert("Success", "Photos uploaded!");
      navigation.navigate("Guidelines");

    } catch (error) {
      console.error("❌ Upload Error:", error);
      Alert.alert("Error", error.message || "Something went wrong.");
    } finally {
      setUploading(false);
      submitLockRef.current = false;
    }
  };

  return (
    <View style={styles.container}>
      <OnboardingStepper currentStep={8} totalSteps={26} />
      <View style={styles.header}>
        <Text style={styles.title}>Show your{'\n'}best self</Text>
        <Text style={styles.subtitle}>
          Upload at least 4 photos — pick ones that show the real you.
        </Text>
      </View>

      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.photoBox, photo ? styles.photoBoxFilled : styles.photoBoxEmpty]}
            onPress={() => handlePickPhoto(index)}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.image} />
            ) : (
              <View style={styles.addPlaceholder}>
                <View style={styles.addIconCircle}>
                  <Plus size={20} color={theme.colors.brand} strokeWidth={2.5} />
                </View>
                <Text style={styles.addLabel}>Add photo</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.photoCount}>
        {photos.filter(p => p !== null).length}/6 photos added
        {photos.filter(p => p !== null).length < 4 && (
          <Text style={styles.photoCountWarning}> · Need at least 4</Text>
        )}
      </Text>

      <View style={styles.submitButton}>
        <Button
          label="Continue"
          loadingLabel="Uploading…"
          loading={uploading}
          disabled={photos.filter(p => p !== null).length < 4}
          onPress={handleSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F3',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 44,
    fontWeight: '300',
    color: '#1a1a1a',
    fontFamily: 'Poppins',
    lineHeight: 52,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    fontFamily: 'Poppins',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  photoBox: {
    width: '31%',
    aspectRatio: 0.8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  photoBoxEmpty: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBoxFilled: {
    borderWidth: 0,
  },
  addPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF1F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  photoCount: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'Poppins',
    marginBottom: 8,
  },
  photoCountWarning: {
    color: '#ff5864',
    fontFamily: 'Poppins',
  },
  submitButton: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    right: 24,
  },
});

