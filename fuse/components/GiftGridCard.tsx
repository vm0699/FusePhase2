import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type GiftGridCardItem = {
  itemId: string;   // backend serializes as itemId, not _id
  name: string;
  imageUrl?: string;
  amount: number;   // backend serializes as amount (= finalAmount)
  category?: string;
  occasion?: string;
  tier?: string;
};

type Props = {
  item: GiftGridCardItem;
  onPress: (item: GiftGridCardItem) => void;
};

export default function GiftGridCard({ item, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => onPress(item)}
    >
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderEmoji}>🎁</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.price}>₹{item.amount}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderEmoji: {
    fontSize: 40,
  },
  info: {
    padding: 10,
  },
  name: {
    fontFamily: "Poppins-SemiBold",
    fontSize: 13,
    color: "#1a1a1a",
    marginBottom: 4,
    lineHeight: 18,
  },
  price: {
    fontFamily: "Poppins-Bold",
    fontSize: 14,
    color: "#ff5864",
  },
});
