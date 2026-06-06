// Updated UpdateProfilePage with Work integration
// Updated UpdateProfilePage with My Vices section
// Updated with Hinge-style photo management (drag, delete, reorder)

import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { ProfileContext } from "../../ProfileContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { consumeProfileEditDraft } from "../utils/profileEditDraft";
import { API_BASE_URL } from "../config/env";
import * as ImageManipulator from "expo-image-manipulator";

const BASE_URL = API_BASE_URL;
const PHOTO_SLOT_COUNT = 6;

const hasOwn = (obj: Record<string, any>, key: string) =>
  Object.prototype.hasOwnProperty.call(obj, key);

const isLocalAssetUri = (uri: string | null) =>
  typeof uri === "string" &&
  (uri.startsWith("file://") || uri.startsWith("content://") || uri.startsWith("ph://"));

const normalizePhotoSlots = (input: Array<string | null | undefined> = []) => {
  const next = input.slice(0, PHOTO_SLOT_COUNT).map((value) => value ?? null);
  while (next.length < PHOTO_SLOT_COUNT) next.push(null);
  return next;
};

export default function EditProfilePage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photos, setPhotos] = useState<(string | null)[]>(Array(PHOTO_SLOT_COUNT).fill(null));
  const [prompts, setPrompts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [tempFields, setTempFields] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState(false);
  const [isPhotoChanged, setIsPhotoChanged] = useState(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const pendingDraft = consumeProfileEditDraft();

      if (pendingDraft) {
        setTempFields((prev) => ({
          ...prev,
          [pendingDraft.fieldKey]: pendingDraft.value,
        }));
      }
    }, [])
  );

  useEffect(() => {
    const fetchUserProfile = async () => {
      setUploading(true);
      try {
        const token = await AsyncStorage.getItem("jwtToken");
        const response = await fetch(`${BASE_URL}/api/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.success) {
          const {
            name,
            dateOfBirth,
            height,
            age,
            gender,
            photos,
            prompts,
            pronouns,
            sexuality,
            college,
            work,
            datingIntentions,
            educationLevel,
            homeTown,
            interests,
            jobTitle,
            languages,
            politics,
            religion,
            ethnicity,
            children,
            pets,
            zodiacSign,
            drinking,
            smoking,
            marijuana,
            drugs,
          } = data.data;

          setName(name || "");
          setDob(dateOfBirth || "");
          setHeight(height || "");
          setAge(age || "");
          setGender(gender || "");

          const photoSlots = normalizePhotoSlots(
            Array.isArray(photos) ? photos : []
          );
          setPhotos(photoSlots);

          setPrompts(prompts || []);
          updateProfileData({ ...data.data });

          const numPhotos = (photos || []).filter((p: any) => !!p).length;
          const numPrompts = (prompts || []).filter((p: any) => p.answer)
            .length;

          const fieldsToCheck = [
            name,
            dateOfBirth,
            height,
            age,
            gender,
            pronouns,
            sexuality,
            college,
            work,
            datingIntentions,
            educationLevel,
            homeTown,
            interests?.length ? "interests" : null,
            jobTitle,
            languages,
            politics,
            religion,
            ethnicity,
            children,
            pets,
            zodiacSign,
            drinking,
            smoking,
            marijuana,
            drugs,
          ];

          let filled = fieldsToCheck.filter(Boolean).length;
          if (numPhotos > 0) filled++;
          if (numPrompts > 0) filled++;

          const totalFields = fieldsToCheck.length + 2;
          const percent = Math.round((filled / totalFields) * 100);
          setCompletion(percent);
        }
      } catch (error) {
        console.error("❌ Error fetching user profile:", error);
      } finally {
        setUploading(false);
      }
    };
    fetchUserProfile();
  }, []);

  const handlePickPhoto = async (index: number) => {
    try {
      console.log("[UpdateProfilePage] handlePickPhoto:start", {
        index,
        currentPhotos: photos,
      });

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });

      console.log("[UpdateProfilePage] handlePickPhoto:pickerResult", {
        index,
        canceled: result.canceled,
        assetCount: result.assets?.length || 0,
        firstAssetUri: result.assets?.[0]?.uri || null,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        const updated = [...photos];
        updated[index] = uri;
        const normalized = normalizePhotoSlots(updated);
        console.log("[UpdateProfilePage] handlePickPhoto:setPhotos", {
          index,
          replacementUri: uri,
          normalized,
        });
        setPhotos(normalized);
        updateProfileData("photos", normalized.filter((photo): photo is string => !!photo));
        setIsPhotoChanged(true);
      }
    } catch (error) {
      console.error("Photo Error", error);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const updated = [...photos];
    updated[index] = null;
    const normalized = normalizePhotoSlots(updated);
    console.log("[UpdateProfilePage] handleDeletePhoto", {
      index,
      normalized,
    });
    setPhotos(normalized);
    updateProfileData("photos", normalized.filter((photo): photo is string => !!photo));
    setIsPhotoChanged(true);
  };

  const handleDone = async () => {
    console.log("[UpdateProfilePage] handleDone:start", {
      photos,
      isPhotoChanged,
      tempFields,
    });
    setUpdating(true);
    const token = await AsyncStorage.getItem("jwtToken");
    const phoneNumber = profileData?.phoneNumber;

    if (!token || !phoneNumber) {
      Alert.alert("Error", "Missing token or phone number");
      setUpdating(false);
      return;
    }

    try {
      // 1️⃣ First upload any locally changed photos via upload-photos
      const uploadedPhotoSlots = [...photos];

      for (let index = 0; index < uploadedPhotoSlots.length; index++) {
        const uri = uploadedPhotoSlots[index];

        if (!isLocalAssetUri(uri)) {
          console.log("[UpdateProfilePage] handleDone:skipUploadExistingRemote", {
            index,
            uri,
          });
          continue;
        }

        console.log("[UpdateProfilePage] handleDone:uploadSlot", {
          index,
          uri,
        });

        const compressAndCalculateSize = async (
          sourceUri: string,
          fallback = false
        ) => {
          const compressed = await ImageManipulator.manipulateAsync(
            sourceUri,
            [{ resize: { width: fallback ? 600 : 800 } }],
            {
              compress: fallback ? 0.2 : 0.4,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          const localResponse = await fetch(compressed.uri);
          const blob = await localResponse.blob();

          return {
            size: blob.size,
            photo: {
              uri: compressed.uri,
              name: compressed.uri.split("/").pop() || `photo-${index}.jpg`,
              type: "image/jpeg",
            },
          };
        };

        let { size, photo } = await compressAndCalculateSize(uri);

        if (size > 1024 * 1024) {
          const fallbackResult = await compressAndCalculateSize(uri, true);
          size = fallbackResult.size;
          photo = fallbackResult.photo;
        }

        if (size > 1024 * 1024) {
          throw new Error("Image size exceeds 1MB after compression.");
        }

        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber);
        formData.append("replaceIndex", String(index));
        // @ts-ignore
        formData.append("photos", photo);

        const response = await fetch(
          `${BASE_URL}/api/profile/upload-photos`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          }
        );

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("🚨 Unexpected server response (not JSON).");
          throw new Error("Server returned unexpected response format.");
        }

        const data = await response.json();
        console.log("[UpdateProfilePage] handleDone:uploadResponse", {
          index,
          ok: response.ok,
          data,
        });

        if (!data.success) {
          throw new Error(data.message || "Upload failed");
        }

        const latestUploadedPhoto =
          Array.isArray(data.data?.uploadedUrls) && data.data.uploadedUrls.length > 0
            ? data.data.uploadedUrls[0]
            : Array.isArray(data.data?.photos)
              ? data.data.photos[index]
              : null;

        if (!latestUploadedPhoto) {
          throw new Error("Uploaded photo URL missing from response.");
        }

        uploadedPhotoSlots[index] = latestUploadedPhoto;
      }

      const normalizedUploadedSlots = normalizePhotoSlots(uploadedPhotoSlots);
      console.log("[UpdateProfilePage] handleDone:normalizedUploadedSlots", {
        normalizedUploadedSlots,
      });
      setPhotos(normalizedUploadedSlots);
      updateProfileData(
        "photos",
        normalizedUploadedSlots.filter((photo): photo is string => !!photo)
      );

      // 2️⃣ Build updates payload (tempFields + reordered photos)
      const cleanPhotos = normalizedUploadedSlots.filter(
        (p): p is string => !!p
      ); // remove nulls, keep order

      const updatesPayload: Record<string, any> = {
        ...tempFields,
      };

      if (isPhotoChanged) {
        updatesPayload.photos = cleanPhotos;
      }

      console.log("[UpdateProfilePage] handleDone:updatesPayload", updatesPayload);

      if (Object.keys(updatesPayload).length > 0) {
        try {
          console.log(
            "🛠 [UpdateProfilePage] Sending updates to /profile/update:",
            updatesPayload
          );

          const response = await fetch(`${BASE_URL}/api/profile/update`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ updates: updatesPayload }),
          });

          const result = await response.json();
          console.log(
            "📥 [UpdateProfilePage] Response from /profile/update:",
            result
          );

          if (!result.success) {
            throw new Error(result.message || "Update failed");
          }

          if (result.data?.profile) {
            const savedPhotoSlots = normalizePhotoSlots(
              Array.isArray(result.data.profile.photos)
                ? result.data.profile.photos
                : []
            );
            console.log("[UpdateProfilePage] handleDone:applySavedProfile", {
              savedPhotoSlots,
              profilePhotos: result.data.profile.photos,
            });
            setPhotos(savedPhotoSlots);
            updateProfileData(result.data.profile);
          }

          setTempFields({});
          setIsPhotoChanged(false);
        } catch (err: any) {
          console.error("❌ Failed to update profile:", err);
          Alert.alert(
            "Update Error",
            err.message || "Error updating profile data."
          );
          setUpdating(false);
          return;
        }
      } else {
        console.log("ℹ️ [UpdateProfilePage] No field updates to send.");
      }

      Alert.alert("Success", "Profile updated!");
      navigation.goBack();
    } catch (error: any) {
      console.error("❌ Upload error:", error);
      Alert.alert(
        "Upload Error",
        error.message || "Something went wrong during photo upload."
      );
    } finally {
      setUpdating(false);
    }
  };

  const renderInfoSection = (
    title: string,
    items: { title: string; key: string; value: any }[]
  ) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionEyebrow}>{title}</Text>
      <View style={styles.sectionCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.itemRow,
              index === items.length - 1 && styles.itemRowLast,
            ]}
            onPress={() => {
              const screenMap: Record<string, string> = {
                Pronouns: "PronounsScreen",
                Sexuality: "SexualityScreen",
                "College or university": "College",
                Work: "Work",
                "Dating Intentions": "DatingIntentions",
                "Education level": "EduLevel",
                "Home town": "HomeTown",
                "I'm interested in": "Interests",
                "Job title": "JobTitle",
                "Languages spoken": "Languages",
                Politics: "Politics",
                "Religious beliefs": "Religion",
                Ethnicity: "Ethnicity",
                Children: "Children",
                Pets: "Pets",
                "Zodiac sign": "Zodiac",
                Drinking: "Drinking",
                Smoking: "Smoking",
                Marijuana: "Marijuana",
                Drugs: "Drugs",
              };
              if (screenMap[item.title]) {
                const currentValue = hasOwn(tempFields, item.key)
                  ? tempFields[item.key]
                  : item.value;
                // @ts-ignore
                navigation.navigate(screenMap[item.title], {
                  mode: "edit",
                  fieldKey: item.key,
                  currentValue,
                });
              }
            }}
          >
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemValue}>
                {(() => {
                  const rawValue = hasOwn(tempFields, item.key)
                    ? tempFields[item.key]
                    : item.value;

                  if (Array.isArray(rawValue)) {
                    return rawValue.length > 0 ? rawValue.join(", ") : "Not set";
                  }

                  return rawValue || "Not set";
                })()}
              </Text>
            </View>
            <View style={styles.chevronBubble}>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPhotoItem = ({
    item,
    getIndex,
    drag,
    isActive,
  }: any) => {
    const index = typeof getIndex === "function" ? getIndex() : -1;

    console.log("[UpdateProfilePage] renderPhotoItem", {
      index,
      item,
      isActive,
    });

    if (index < 0) {
      return null;
    }

    return (
      <View style={styles.photoWrapper}>
        <Pressable
          style={[
            styles.photoBox,
            isActive && styles.photoBoxActive,
          ]}
          onLongPress={() => {
            setIsDraggingPhoto(true);
            drag();
          }}
          delayLongPress={150}
          onPress={() => {
            if (!isDraggingPhoto) {
              handlePickPhoto(index);
            }
          }}
        >
          {item ? (
            <Image
              key={`photo-${index}-${item}`}
              source={{ uri: item }}
              style={styles.photo}
            />
          ) : (
            <View key={`photo-${index}-empty`} style={styles.placeholderBox}>
              <Ionicons name="add" size={24} color="#aaa" />
            </View>
          )}
          <View style={styles.slotBadge}>
            <Text style={styles.slotBadgeText}>{index + 1}</Text>
          </View>
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </Pressable>
        {item && (
          <TouchableOpacity
            style={styles.deleteBadge}
            onPress={() => handleDeletePhoto(index)}
          >
            <Ionicons name="close" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      scrollEnabled={!isDraggingPhoto}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerPill}
          onPress={() => navigation.navigate("Profile" as never)}
        >
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.name}>{name || "Name"}</Text>
          <View style={styles.completionPill}>
            <Text style={styles.completion}>{completion}% complete</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerPill} onPress={handleDone}>
          {updating ? (
            <ActivityIndicator color="#ff5864" />
          ) : (
            <Text style={styles.done}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>Profile Editor</Text>
        <Text style={styles.heroTitle}>Refresh how your profile feels.</Text>
        <Text style={styles.heroBody}>
          Curate photos, identity, and preferences with the same clean Fuse look.
        </Text>
      </View>

      <View style={styles.sectionBlock}>
        <Text style={styles.sectionEyebrow}>My photos & videos</Text>
        <View style={styles.photoSectionCard}>
          <View style={styles.draggableContainer}>
            <DraggableFlatList
              data={photos}
              extraData={photos}
              numColumns={3}
              keyExtractor={(_, index) => index.toString()}
              renderItem={renderPhotoItem}
              containerStyle={styles.draggableList}
              onDragEnd={({ data }) => {
                // data is (string | null)[]
                let normalized = [...data];
                while (normalized.length < PHOTO_SLOT_COUNT) {
                  normalized.push(null);
                }
                if (normalized.length > PHOTO_SLOT_COUNT) {
                  normalized = normalized.slice(0, PHOTO_SLOT_COUNT);
                }
                setPhotos(normalized);
                setIsPhotoChanged(true);
                setIsDraggingPhoto(false);
              }}
              onRelease={() => setIsDraggingPhoto(false)}
              onDragBegin={() => setIsDraggingPhoto(true)}
              scrollEnabled={false}
              activationDistance={0}
            />
          </View>

          <Text style={styles.editText}>Tap to edit, long-press to drag and reorder</Text>
          <Text style={styles.warning}>Up to 6 photos or videos recommended</Text>
        </View>
      </View>

      {renderInfoSection("Identity", [
        { title: "Pronouns", key: "pronouns", value: profileData?.pronouns },
        { title: "Gender", key: "gender", value: gender },
        {
          title: "Sexuality",
          key: "sexuality",
          value: profileData?.sexuality,
        },
        {
          title: "I'm interested in",
          key: "interests",
          value: profileData?.interests,
        },
      ])}

      {renderInfoSection("My Virtues", [
        { title: "Work", key: "work", value: profileData?.work },
        {
          title: "College or university",
          key: "college",
          value: profileData?.college,
        },
        {
          title: "Job title",
          key: "jobTitle",
          value: profileData?.jobTitle,
        },
        {
          title: "Dating Intentions",
          key: "datingIntentions",
          value: profileData?.datingIntentions,
        },
        {
          title: "Education level",
          key: "educationLevel",
          value: profileData?.educationLevel,
        },
        {
          title: "Home town",
          key: "homeTown",
          value: profileData?.homeTown,
        },
        {
          title: "Languages spoken",
          key: "languages",
          value: profileData?.languages,
        },
        {
          title: "Politics",
          key: "politics",
          value: profileData?.politics,
        },
        {
          title: "Religious beliefs",
          key: "religion",
          value: profileData?.religion,
        },
        {
          title: "Ethnicity",
          key: "ethnicity",
          value: profileData?.ethnicity,
        },
        { title: "Children", key: "children", value: profileData?.children },
        { title: "Pets", key: "pets", value: profileData?.pets },
        {
          title: "Zodiac sign",
          key: "zodiacSign",
          value: profileData?.zodiacSign,
        },
      ])}

      {renderInfoSection("My Vices", [
        {
          title: "Drinking",
          key: "drinking",
          value: profileData?.drinking,
        },
        {
          title: "Smoking",
          key: "smoking",
          value: profileData?.smoking,
        },
        {
          title: "Marijuana",
          key: "marijuana",
          value: profileData?.marijuana,
        },
        { title: "Drugs", key: "drugs", value: profileData?.drugs },
      ])}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F3" },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 60 : 44,
    paddingBottom: 18,
  },
  headerPill: {
    minWidth: 72,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerCenter: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  cancel: {
    color: "#6B7280",
    fontWeight: "600",
    fontFamily: "Poppins-SemiBold",
    fontSize: 14,
  },
  done: {
    color: "#ff5864",
    fontWeight: "700",
    fontFamily: "Poppins-Bold",
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    textAlign: "center",
  },
  completionPill: {
    marginTop: 4,
    backgroundColor: "#FFF5F5",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  completion: {
    fontSize: 12,
    color: "#ff5864",
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
  },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroEyebrow: {
    fontSize: 12,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 22,
    color: "#1a1a1a",
    fontFamily: "Poppins-Bold",
    marginBottom: 8,
  },
  heroBody: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    fontFamily: "Poppins",
  },
  sectionBlock: {
    marginTop: 2,
    marginBottom: 18,
    marginHorizontal: 16,
  },
  sectionEyebrow: {
    fontSize: 13,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  photoSectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    paddingTop: 14,
    paddingBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  draggableContainer: {
    paddingHorizontal: 12,
  },
  draggableList: {
    overflow: "visible",
  },

  photoWrapper: {
    width: "33.333%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },

  photoBox: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#FDE2E4",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#FFF8F8",
  },
  photoBoxActive: {
    opacity: 0.92,
    borderColor: "#ff5864",
    transform: [{ scale: 1.03 }],
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  placeholderBox: {
    width: 80,
    height: 80,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  plusCircle: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#ff5864",
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    backgroundColor: "#1a1a1a",
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  slotBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(26,26,26,0.72)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  slotBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Poppins-Bold",
  },
  editText: {
    textAlign: "center",
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
    fontFamily: "Poppins",
  },
  warning: {
    textAlign: "center",
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
    fontFamily: "Poppins",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  itemRowLast: {
    borderBottomWidth: 0,
  },
  itemCopy: {
    flex: 1,
    paddingRight: 14,
  },
  itemTitle: {
    fontSize: 11,
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Poppins-SemiBold",
    marginBottom: 3,
  },
  itemValue: {
    fontSize: 15,
    color: "#1a1a1a",
    fontFamily: "Poppins",
  },
  chevronBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
});
