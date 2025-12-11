// Updated UpdateProfilePage with Work integration
// Updated UpdateProfilePage with My Vices section
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

const BASE_URL = "http://172.20.10.4:5000";

export default function EditProfilePage() {
  const navigation = useNavigation();
  const { profileData, updateProfileData } = useContext(ProfileContext);

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [photos, setPhotos] = useState(Array(6).fill(null));
  const [prompts, setPrompts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [completion, setCompletion] = useState(0);
  const [tempFields, setTempFields] = useState({});
  const [updating, setUpdating] = useState(false);

  const changedIndexes = useRef(new Set());

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
            drugs
          } = data.data;
          setName(name || "");
          setDob(dateOfBirth || "");
          setHeight(height || "");
          setAge(age || "");
          setGender(gender || "");
          let photoSlots = Array.isArray(photos) ? [...photos] : [];
          while (photoSlots.length < 6) photoSlots.push(null);
          setPhotos(photoSlots);

          setPrompts(prompts || []);
          updateProfileData({ ...data.data });

          const numPhotos = (photos || []).filter((p) => !!p).length;
          const numPrompts = (prompts || []).filter((p) => p.answer).length;

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
            drugs
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

  const handlePickPhoto = async (index) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 1,
      });
      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        let updated = [...photos];
        updated[index] = uri;
        setPhotos(updated);
        changedIndexes.current.add(index);
      }
    } catch (error) {
      console.error("Photo Error", error);
    }
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
      const updatedPhotos = [...photos];

      for (const index of changedIndexes.current) {
        const uri = photos[index];

        const formData = new FormData();
        formData.append("phoneNumber", phoneNumber);
        formData.append("replaceIndex", index);
        formData.append("photos", {
          uri,
          name: `photo-${index}.jpg`,
          type: "image/jpeg",
        });

        const response = await fetch(`${BASE_URL}/api/profile/upload-photos`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

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

      if (Object.keys(tempFields).length > 0) {
        try {
          const response = await fetch(`${BASE_URL}/api/profile/update`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber, updates: tempFields }),
          });

          const result = await response.json();
          if (!result.success) throw new Error(result.message);
          setTempFields({});
        } catch (err) {
          console.error("❌ Failed to update fields:", err);
          Alert.alert("Update Error", err.message || "Error updating profile data.");
        }
      } else {
        console.log("ℹ️ No tempFields to update.");
      }

      Alert.alert("Success", "Profile updated!");
      navigation.goBack();
    } catch (error) {
      console.error("❌ Upload error:", error);
      Alert.alert("Upload Error", error.message || "Something went wrong during photo upload.");
    } finally {
      setUpdating(false);
    }
  };

  const renderInfoSection = (title, items) => (
    <View style={styles.sectionBlock}>
      <Text style={styles.section}>{title}</Text>
      {items.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.itemRow}
          onPress={() => {
            const screenMap = {
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
              Drugs: "Drugs"
            };
            if (screenMap[item.title]) {
              navigation.navigate(screenMap[item.title], {
                currentValue: tempFields[item.key] || item.value,
                onSelect: (val) => {
                  setTempFields((prev) => ({ ...prev, [item.key]: val }));
                },
              });
            }
          }}
        >
          <View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemValue}> {
              Array.isArray(tempFields[item.key])
                ? tempFields[item.key].join(", ")
                : tempFields[item.key] ?? item.value ?? "Not set"
            }</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate("Profile")}>
          <Text style={styles.cancel}>Cancel</Text>
        </TouchableOpacity>

        <View>
          <Text style={styles.name}>{name || "Name"}</Text>
          <Text style={styles.completion}>{completion}% complete</Text>
        </View>
        <TouchableOpacity onPress={handleDone}>
          {updating ? <ActivityIndicator color="#6B21A8" /> : <Text style={styles.done}>Done</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>My photos & videos</Text>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <TouchableOpacity
            key={index}
            style={styles.photoBox}
            onPress={() => handlePickPhoto(index)}
          >
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photo} />
            ) : (
              <View style={styles.placeholderBox}>
                <Ionicons name="add" size={24} color="#aaa" />
              </View>
            )}
            <View style={styles.plusCircle}>
              <Ionicons name="add" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.editText}>Tap to edit, drag to reorder</Text>
      <Text style={styles.warning}>6 photos/videos required</Text>

      {renderInfoSection("Identity", [
        { title: "Pronouns", key: "pronouns", value: profileData?.pronouns },
        { title: "Gender", key: "gender", value: gender },
        { title: "Sexuality", key: "sexuality", value: profileData?.sexuality },
        { title: "I'm interested in", key: "interests", value: profileData?.interests },
      ])}

      {renderInfoSection("My Virtues", [
        { title: "Work", key: "work", value: profileData?.work },
        { title: "College or university", key: "college", value: profileData?.college },
        { title: "Job title", key: "jobTitle", value: profileData?.jobTitle },
        { title: "Dating Intentions", key: "datingIntentions", value: profileData?.datingIntentions },
        { title: "Education level", key: "educationLevel", value: profileData?.educationLevel },
        { title: "Home town", key: "homeTown", value: profileData?.homeTown },
        { title: "Languages spoken", key: "languages", value: profileData?.languages },
        { title: "Politics", key: "politics", value: profileData?.politics },
        { title: "Religious beliefs", key: "religion", value: profileData?.religion },
        { title: "Ethnicity", key: "ethnicity", value: profileData?.ethnicity },
        { title: "Children", key: "children", value: profileData?.children },
        { title: "Pets", key: "pets", value: profileData?.pets },
        { title: "Zodiac sign", key: "zodiacSign", value: profileData?.zodiacSign },
      ])}

      {renderInfoSection("My Vices", [
        { title: "Drinking", key: "drinking", value: profileData?.drinking },
        { title: "Smoking", key: "smoking", value: profileData?.smoking },
        { title: "Marijuana", key: "marijuana", value: profileData?.marijuana },
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
  section: { fontSize: 22, fontWeight: "500", color: "#9CA3AF", marginLeft: 16, marginTop: 20 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 12,
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
