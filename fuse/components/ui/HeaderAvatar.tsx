import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Avatar from "./Avatar";
import { useProfile } from "../../ProfileContext";

type Props = {
  size?: number;
};

export default function HeaderAvatar({ size = 34 }: Props) {
  const navigation = useNavigation<any>();
  const { profileData } = useProfile();

  const photo = profileData?.photos?.[0] ?? null;
  const name = profileData?.name ?? null;

  return (
    <Pressable
      onPress={() => navigation.navigate("Profile")}
      hitSlop={8}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.8 }]}
    >
      <Avatar uri={photo} name={name} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 100,
  },
});
