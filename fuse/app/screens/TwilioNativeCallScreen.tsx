// import React, { useEffect, useState, useRef } from "react";
// import {
//   View,
//   StyleSheet,
//   Alert,
//   ActivityIndicator,
//   Text,
//   TouchableOpacity,
//   Platform,
//   NativeEventEmitter,
//   NativeModules,
// } from "react-native";
// import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
// import {
//   TwilioVideo,
//   TwilioVideoLocalView,
//   TwilioVideoParticipantView,
// } from "react-native-twilio-video-webrtc";


// type VideoCallScreenRouteParams = {
//   room: string;
//   twilioToken: string;
// };

// export default function TwilioNativeCallScreen() {
//   const navigation = useNavigation();
//   const route = useRoute<
//     RouteProp<{ TwilioNativeCallScreen: VideoCallScreenRouteParams }, "TwilioNativeCallScreen">
//   >();
//   const { room, twilioToken } = route.params;

//   const twilioRef = useRef<any>(null);
//   const [isAudioEnabled, setIsAudioEnabled] = useState(true);
//   const [isVideoEnabled, setIsVideoEnabled] = useState(true);
//   const [status, setStatus] = useState("connecting");
//   const [remoteParticipantSid, setRemoteParticipantSid] = useState("");
//   const [remoteVideoTrackSid, setRemoteVideoTrackSid] = useState("");

//   useEffect(() => {
//     if (!room || !twilioToken) {
//       console.error("❌ Missing room or Twilio token", { room, twilioToken });
//       Alert.alert("Error", "Missing room or Twilio token", [
//         { text: "OK", onPress: () => navigation.goBack() },
//       ]);
//       return;
//     }

//     console.log("🎥 Connecting to Twilio room:", room);
//   }, [room, twilioToken]);

//   const handleEndCall = () => {
//     twilioRef.current?.disconnect();
//     navigation.goBack();
//   };

//   const handleRoomDidConnect = () => {
//     console.log("✅ Connected to Twilio Room");
//     setStatus("connected");
//   };

//   const handleRoomDidDisconnect = ({ error }: any) => {
//     console.log("👋 Disconnected from room", error);
//     setStatus("disconnected");
//     navigation.goBack();
//   };

//   const handleParticipantAddedVideoTrack = ({ participant, track }: any) => {
//     console.log("🎥 Participant video track added", participant, track);
//     setRemoteParticipantSid(participant.sid);
//     setRemoteVideoTrackSid(track.trackSid);
//   };

//   const handleToggleMic = () => {
//     twilioRef.current?.setLocalAudioEnabled(!isAudioEnabled).then(setIsAudioEnabled);
//   };

//   const handleToggleVideo = () => {
//     twilioRef.current?.setLocalVideoEnabled(!isVideoEnabled).then(setIsVideoEnabled);
//   };

//   return (
//     <View style={styles.container}>
//       {status === "connecting" && (
//         <View style={styles.loadingOverlay}>
//           <ActivityIndicator size="large" color="#007AFF" />
//           <Text style={styles.statusText}>Connecting to room...</Text>
//         </View>
//       )}

//       {status === "connected" && (
//         <>
//           <TwilioVideoLocalView
//             enabled={true}
//             style={styles.localVideo}
//           />

//           {remoteParticipantSid && remoteVideoTrackSid && (
//             <TwilioVideoParticipantView
//               style={styles.remoteVideo}
//               trackIdentifier={{
//                 participantSid: remoteParticipantSid,
//                 videoTrackSid: remoteVideoTrackSid,
//               }}
//             />
//           )}
//         </>
//       )}

//       <TwilioVideo
//         ref={twilioRef}
//         token={twilioToken}
//         enableVideo={true}
//         enableAudio={true}
//         onRoomDidConnect={handleRoomDidConnect}
//         onRoomDidDisconnect={handleRoomDidDisconnect}
//         onParticipantAddedVideoTrack={handleParticipantAddedVideoTrack}
//         onParticipantRemovedVideoTrack={() => {}}
//         onRoomDidFailToConnect={(error: any) => {
//           console.error("❌ Room connection failed", error);
//           Alert.alert("Connection Failed", "Unable to join the video room.");
//           navigation.goBack();
//         }}
//       />

//       {status === "connected" && (
//         <View style={styles.controls}>
//           <TouchableOpacity
//             onPress={handleToggleMic}
//             style={[styles.controlButton, { backgroundColor: isAudioEnabled ? "green" : "gray" }]}
//           >
//             <Text style={styles.controlText}>{isAudioEnabled ? "Mute" : "Unmute"}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={handleToggleVideo}
//             style={[styles.controlButton, { backgroundColor: isVideoEnabled ? "blue" : "gray" }]}
//           >
//             <Text style={styles.controlText}>{isVideoEnabled ? "Video Off" : "Video On"}</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             onPress={handleEndCall}
//             style={[styles.controlButton, { backgroundColor: "red" }]}
//           >
//             <Text style={styles.controlText}>Leave</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: "#000" },
//   loadingOverlay: {
//     ...StyleSheet.absoluteFillObject,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: "rgba(0,0,0,0.6)",
//     zIndex: 99,
//   },
//   statusText: {
//     color: "#fff",
//     marginTop: 12,
//     fontSize: 16,
//   },
//   localVideo: {
//     width: 100,
//     height: 150,
//     position: "absolute",
//     bottom: 150,
//     right: 10,
//     zIndex: 10,
//   },
//   remoteVideo: {
//     flex: 1,
//   },
//   controls: {
//     position: "absolute",
//     bottom: 40,
//     left: 0,
//     right: 0,
//     flexDirection: "row",
//     justifyContent: "space-evenly",
//     paddingHorizontal: 10,
//   },
//   controlButton: {
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 10,
//   },
//   controlText: {
//     color: "white",
//     fontWeight: "bold",
//   },
// });
