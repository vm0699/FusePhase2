// Updated UpdateProfilePage with Work integration
// Updated UpdateProfilePage with My Vices section
// Updated with Hinge-style photo management (drag, delete, reorder)

import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { ProfileContext } from "../../ProfileContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

const BASE_URL = "http://172.20.10.4:5000";

export default function EditProfilePage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));
  const [prompts, setPrompts] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [tempFields, setTempFields] = useState<Record<string, any>>({});
  const [updating, setUpdating] = useState(false);
  const [isPhotoChanged, setIsPhotoChanged] = useState(false);

  const changedIndexes = useRef<Set<number>>(new Set());

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
            phoneNumber,
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

          let photoSlots: (string | null)[] = Array.isArray(photos)
            ? [...photos]
            : [];
          while (photoSlots.length < 6) photoSlots.push(null);
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
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        const updated = [...photos];
        updated[index] = uri;
        setPhotos(updated);
        changedIndexes.current.add(index);
        setIsPhotoChanged(true);
      }
    } catch (error) {
      console.error("Photo Error", error);
    }
  };

  const handleDeletePhoto = (index: number) => {
    const updated = [...photos];
    updated[index] = null;
    setPhotos(updated);
    setIsPhotoChanged(true);
  };

  const handleDone = async () => {
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
      const updatedPhotos = [...photos];

      for (const index of Array.from(changedIndexes.current)) {
        const uri = photos[index];

        if (!uri) {
          continue;
        }

        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber);
        formData.append("replaceIndex", String(index));
        // @ts-ignore
        formData.append("photos", {
          uri,
          name: `photo-${index}.jpg`,
          type: "image/jpeg",
        });

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

        if (!data.success) {
          throw new Error(data.message || "Upload failed");
        }

        if (data.data?.photos?.[index]) {
          updatedPhotos[index] = data.data.photos[index];
        }
      }

      setPhotos(updatedPhotos);
      changedIndexes.current.clear();

      // 2️⃣ Build updates payload (tempFields + reordered photos)
      const cleanPhotos = updatedPhotos.filter(
        (p): p is string => !!p
      ); // remove nulls, keep order

      const updatesPayload: Record<string, any> = {
        ...tempFields,
      };

      if (isPhotoChanged) {
        updatesPayload.photos = cleanPhotos;
      }

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
      <Text style={styles.section}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.itemRow}
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
              // @ts-ignore
              navigation.navigate(screenMap[item.title], {
                currentValue: tempFields[item.key] || item.value,
                onSelect: (val: any) => {
                  setTempFields((prev) => ({ ...prev, [item.key]: val }));
                },
              });
            }
          }}
        >
          <View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemValue}>
              {Array.isArray(tempFields[item.key])
                ? tempFields[item.key].join(", ")
                : tempFields[item.key] ?? item.value ?? "Not set"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPhotoItem = ({
    item,
    index,
    drag,
    isActive,
  }: RenderItemParams<string | null>) => {
    return (
      <View style={styles.photoWrapper}>
        <TouchableOpacity
          style={[
            styles.photoBox,
            isActive && styles.photoBoxActive,
          ]}
          onLongPress={drag}
          delayLongPress={150}
          onPress={() => handlePickPhoto(index)}
        >
          {item ? (
            <Image source={{ uri: item }} style={styles.photo} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="add" size={24} color="#aaa" />
            </View>
          )}
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile" as never)}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.name}>{name || "Name"}</Text>
          <Text style={styles.completion}>{completion}% complete</Text>
        </View>
        <TouchableOpacity onPress={handleDone}>
          {updating ? (
            <ActivityIndicator color="#6B21A8" />
          ) : (
            <Text style={styles.done}>Done</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>My photos & videos</Text>

      <View style={styles.draggableContainer}>
        <DraggableFlatList
          data={photos}
          numColumns={3}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderPhotoItem}
          onDragEnd={({ data }) => {
            // data is (string | null)[]
            let normalized = [...data];
            while (normalized.length < 6) normalized.push(null);
            if (normalized.length > 6) normalized = normalized.slice(0, 6);
            setPhotos(normalized);
            setIsPhotoChanged(true);
          }}
          scrollEnabled={false}
        />
      </View>

      <Text style={styles.editText}>Tap to edit, long-press to drag & reorder</Text>
      <Text style={styles.warning}>Up to 6 photos/videos recommended</Text>

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
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cancel: { color: "#ff5864", fontWeight: "600" },
  done: { color: "#ff5864", fontWeight: "600" },
  name: { fontSize: 32, fontWeight: "bold", textAlign: "center" },
  completion: { fontSize: 18, color: "#F97316", textAlign: "center" },
  section: {
    fontSize: 22,
    fontWeight: "500",
    color: "#9CA3AF",
    marginLeft: 16,
    marginTop: 20,
  },

  draggableContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },

  photoWrapper: {
    margin: 6,
  },

  photoBox: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FCA5A5",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    backgroundColor: "#fff",
  },
  photoBoxActive: {
    opacity: 0.85,
    borderColor: "#fb7185",
  },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  placeholderBox: {
    width: 80,
    height: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  plusCircle: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#6B21A8",
    padding: 4,
    borderRadius: 999,
  },
  deleteBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#111827",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  editText: {
    textAlign: "center",
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
  },
  warning: {
    textAlign: "center",
    fontSize: 18,
    color: "#DC2626",
    marginTop: 4,
  },
  sectionBlock: { marginTop: 24 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemTitle: { fontSize: 18, fontWeight: "600" },
  itemValue: { fontSize: 18, color: "#9CA3AF" },
});
