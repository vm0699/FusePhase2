  import React from "react";
  import { View, Text, Image, StyleSheet } from "react-native";

  interface CardProps {
    title: string;
    description: string;
    image: string;
  }

  export const Card: React.FC<CardProps> = ({ title, description, image }) => {
    return (
      <View style={styles.card}>
        {/* Image */}
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: "#fff",
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 4,
      elevation: 3, // For Android shadow
    },
    image: {
      width: "100%",
      height: 200,
    },
    content: {
      padding: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 4,
      color: "#333",
    },
    description: {
      fontSize: 14,
      color: "#666",
    },
  });
