// import React from "react";
// import { 
//   View, Text, StyleSheet, Image, ScrollView, TouchableOpacity 
// } from "react-native";
// import { Heart } from "lucide-react-native";

// interface ProfileCardProps {
//   profile: {
//     name: string;
//     age: number;
//     height: string;
//     gender: string;
//     interests: string[];
//     photos: string[];
//     prompts: { question: string; answer: string }[];
//   };
//   handleSendCompliment: (complimentText: string) => void;
//   onAutoLike: () => void; // ✅ Auto-like and move to next profile
// }

// export default function ProfileCard({ profile, handleSendCompliment, onAutoLike }: ProfileCardProps) {
//   return (
//     <ScrollView contentContainerStyle={styles.card}>
      
//       {/* ✅ First Profile Photo with Small Heart */}
//       <View style={styles.photoContainer}>
//         <Image 
//           source={{ uri: profile.photos[0] || "https://via.placeholder.com/150" }} 
//           style={styles.photo} 
//         />
//         <TouchableOpacity style={styles.smallHeart} onPress={onAutoLike}>
//           <Heart size={22} color="red" />
//         </TouchableOpacity>
//       </View>

//       {/* ✅ Basic Profile Info */}
//       <View style={styles.profileInfoContainer}>
//         <Text style={styles.name}>{profile.name}, {profile.age}</Text>
//         <Text style={styles.detail}>Height: {profile.height}</Text>
//         <Text style={styles.detail}>Gender: {profile.gender}</Text>
//         <Text style={styles.detail}>Interests: {profile.interests.join(", ")}</Text>
//       </View>

//       {/* ✅ Additional Photos & Prompts */}
//       {profile.photos.slice(1).map((photo, index) => (
//         <View key={index} style={styles.photoPromptContainer}>
//           <Image source={{ uri: photo || "https://via.placeholder.com/150" }} style={styles.photo} />
//           {profile.prompts[index] && (
//             <View style={styles.promptContainer}>
//               <Text style={styles.promptQuestion}>{profile.prompts[index].question}</Text>
//               <Text style={styles.promptAnswer}>{profile.prompts[index].answer}</Text>
//               <TouchableOpacity 
//     style={styles.smallHeart} 
//     onPress={() => handleSendCompliment("")} // ✅ Auto-like without popup
// >
//     <Heart size={22} color="red" />
// </TouchableOpacity>
//             </View>
//           )}
//         </View>
//       ))}
      
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   card: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  
//   photoContainer: { 
//     position: "relative", 
//     alignItems: "center" 
//   },
  
//   photo: { 
//     width: "100%", 
//     height: 300, 
//     borderRadius: 10 
//   },
  
//   smallHeart: { 
//     position: "absolute", 
//     top: 10, 
//     right: 10, 
//     backgroundColor: "rgba(255,255,255,0.8)", 
//     padding: 8, 
//     borderRadius: 20 
//   },

//   profileInfoContainer: { 
//     alignItems: "center", 
//     marginBottom: 10 
//   },
  
//   name: { 
//     fontSize: 22, 
//     fontWeight: "bold" 
//   },
  
//   detail: { 
//     fontSize: 16, 
//     color: "#555" 
//   },

//   photoPromptContainer: { 
//     marginTop: 15 
//   },

//   promptContainer: { 
//     padding: 10, 
//     backgroundColor: "#f5f5f5", 
//     borderRadius: 8, 
//     marginTop: 5 
//   },

//   promptQuestion: { 
//     fontSize: 16, 
//     fontWeight: "bold" 
//   },

//   promptAnswer: { 
//     fontSize: 14, 
//     color: "#555" 
//   },

//   heartButton: { 
//     alignSelf: "flex-end", 
//     marginTop: 5 
//   },
// });






import React from "react";
import { 
  View, Text, StyleSheet, Image, ScrollView, TouchableOpacity 
} from "react-native";
import { Heart } from "lucide-react-native";

interface ProfileCardProps {
  profile: {
    name: string;
    age: number;
    height: string;
    gender: string;
    interests: string[];
    photos: string[];
    prompts: { question: string; answer: string }[];
    // ✅ Additional fields
    pronouns?: string;
    sexuality?: string;
    educationLevel?: string;
    zodiacSign?: string;
    drinking?: string;
    smoking?: string;
    marijuana?: string;
    religion?: string;
    jobTitle?: string;
    work?: string;
    politics?: string;
    languages?: string[];
  };
  handleSendCompliment: (complimentText: string) => void;
  onAutoLike: () => void;
}

export default function ProfileCard({ profile, handleSendCompliment, onAutoLike }: ProfileCardProps) {
  return (
    <ScrollView contentContainerStyle={styles.card}>
      {/* ✅ First Profile Photo with Small Heart */}
      <View style={styles.photoContainer}>
        <Image 
          source={{ uri: profile.photos[0] || "https://via.placeholder.com/150" }} 
          style={styles.photo} 
        />
        <TouchableOpacity style={styles.smallHeart} onPress={onAutoLike}>
          <Heart size={22} color="red" />
        </TouchableOpacity>
      </View>

      {/* ✅ Basic Profile Info */}
      <View style={styles.profileInfoContainer}>
        <Text style={styles.name}>{profile.name}, {profile.age}</Text>
        <Text style={styles.detail}>Height: {profile.height}</Text>
        <Text style={styles.detail}>Gender: {profile.gender}</Text>
        <Text style={styles.detail}>Interests: {profile.interests.join(", ")}</Text>
        {profile.pronouns && <Text style={styles.detail}>Pronouns: {profile.pronouns}</Text>}
        {profile.sexuality && <Text style={styles.detail}>Sexuality: {profile.sexuality}</Text>}
        {profile.educationLevel && <Text style={styles.detail}>Education: {profile.educationLevel}</Text>}
        {profile.zodiacSign && <Text style={styles.detail}>Zodiac: {profile.zodiacSign}</Text>}
        {profile.drinking && <Text style={styles.detail}>Drinks: {profile.drinking}</Text>}
        {profile.smoking && <Text style={styles.detail}>Smokes: {profile.smoking}</Text>}
        {profile.marijuana && <Text style={styles.detail}>Marijuana: {profile.marijuana}</Text>}
        {profile.religion && <Text style={styles.detail}>Religion: {profile.religion}</Text>}
        {profile.jobTitle && <Text style={styles.detail}>Job Title: {profile.jobTitle}</Text>}
        {profile.work && <Text style={styles.detail}>Work: {profile.work}</Text>}
        {profile.politics && <Text style={styles.detail}>Politics: {profile.politics}</Text>}
        {profile.languages?.length > 0 && (
          <Text style={styles.detail}>Languages: {profile.languages.join(", ")}</Text>
        )}
      </View>

      {/* ✅ Additional Photos & Prompts */}
      {profile.photos.slice(1).map((photo, index) => (
        <View key={index} style={styles.photoPromptContainer}>
          <Image source={{ uri: photo || "https://via.placeholder.com/150" }} style={styles.photo} />
          {profile.prompts[index] && (
            <View style={styles.promptContainer}>
              <Text style={styles.promptQuestion}>{profile.prompts[index].question}</Text>
              <Text style={styles.promptAnswer}>{profile.prompts[index].answer}</Text>
              <TouchableOpacity 
                style={styles.smallHeart} 
                onPress={() => handleSendCompliment("")}
              >
                <Heart size={22} color="red" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  photoContainer: { position: "relative", alignItems: "center" },
  photo: { width: "100%", height: 300, borderRadius: 10 },
  smallHeart: { position: "absolute", top: 10, right: 10, backgroundColor: "rgba(255,255,255,0.8)", padding: 8, borderRadius: 20 },
  profileInfoContainer: { alignItems: "center", marginBottom: 10 },
  name: { fontSize: 22, fontWeight: "bold" },
  detail: { fontSize: 16, color: "#555" },
  photoPromptContainer: { marginTop: 15 },
  promptContainer: { padding: 10, backgroundColor: "#f5f5f5", borderRadius: 8, marginTop: 5 },
  promptQuestion: { fontSize: 16, fontWeight: "bold" },
  promptAnswer: { fontSize: 14, color: "#555" },
  heartButton: { alignSelf: "flex-end", marginTop: 5 },
});
