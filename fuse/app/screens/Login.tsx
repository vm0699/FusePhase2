import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FusePopup } from "../../components/FusePopup";

export default function LoginPage({ navigation }) {
  const [popupState, setPopupState] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    tone?: "default" | "success" | "error" | "info";
  }>({ visible: false, title: "" });

  const handleNavigation = () => {
    navigation.navigate("PhoneVerif");
  };

  const showPopup = (
    title: string,
    message?: string,
    tone: "default" | "success" | "error" | "info" = "default"
  ) => {
    setPopupState({ visible: true, title, message, tone });
  };

  return (
    <LinearGradient colors={["#e60f3f", "#e5dad1"]} style={styles.container}>
      <Text style={styles.title}>Fuse</Text>

      <Image
        source={require("../../assets/heart-animation.gif")}
        style={styles.animation}
      />

      <TouchableOpacity style={styles.button} onPress={handleNavigation}>
        <Text style={styles.buttonText}>Use mobile number</Text>
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          By signing up, you agree to our{" "}
          <Text
            style={styles.linkText}
            onPress={() =>
              showPopup("Terms", "Terms content has not been wired yet.", "info")
            }
          >
            Terms
          </Text>
          . See how we use your data in our{" "}
          <Text
            style={styles.linkText}
            onPress={() =>
              showPopup(
                "Privacy Policy",
                "Privacy policy content has not been wired yet.",
                "info"
              )
            }
          >
            Privacy Policy
          </Text>
          .
        </Text>
        <Text style={styles.infoText}>We never post to Facebook.</Text>
      </View>

      <FusePopup
        visible={popupState.visible}
        title={popupState.title}
        message={popupState.message}
        tone={popupState.tone}
        onClose={() => setPopupState((prev) => ({ ...prev, visible: false }))}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 50,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins-Bold",
  },
  animation: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: "contain",
  },
  button: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Poppins-SemiBold",
  },
  infoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  infoText: {
    color: "#ffffff",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "Poppins",
  },
  linkText: {
    textDecorationLine: "underline",
    color: "#ffffff",
  },
});
