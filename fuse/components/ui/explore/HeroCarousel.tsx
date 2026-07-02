import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  ImageBackground,
} from "react-native";
import { theme } from "../../../app/theme";

type HeroSlide = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  bgColor?: string;
  onPress?: () => void;
};

type Props = {
  slides: HeroSlide[];
  autoScrollMs?: number;
};

export default function HeroCarousel({ slides, autoScrollMs = 4000 }: Props) {
  const { width } = useWindowDimensions();
  const CARD_WIDTH = width - 32;
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      const next = (activeIndexRef.current + 1) % slides.length;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      activeIndexRef.current = next;
      setActiveIndex(next);
    }, autoScrollMs);
    return () => clearInterval(interval);
  }, [slides.length, autoScrollMs]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0] != null) {
      activeIndexRef.current = viewableItems[0].index;
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const defaultColors = ["#ff5864", "#FF8A65", "#7C3AED", "#059669", "#2563EB"];

  return (
    <View>
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled={false}
        snapToInterval={CARD_WIDTH + 12}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        renderItem={({ item, index }) => {
          const bg = item.bgColor || defaultColors[index % defaultColors.length];
          return (
            <Pressable
              onPress={item.onPress}
              style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}
            >
              <View
                style={[
                  styles.card,
                  { width: CARD_WIDTH, backgroundColor: bg },
                ]}
              >
                {item.imageUrl ? (
                  <ImageBackground
                    source={{ uri: item.imageUrl }}
                    style={styles.imageBg}
                    imageStyle={styles.imageStyle}
                  >
                    <View style={styles.gradient}>
                      <Text style={styles.title}>{item.title}</Text>
                      {item.subtitle ? (
                        <Text style={styles.subtitle}>{item.subtitle}</Text>
                      ) : null}
                    </View>
                  </ImageBackground>
                ) : (
                  <View style={[styles.imageBg, { justifyContent: "flex-end" }]}>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.subtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
      />
      {slides.length > 1 && (
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 172,
    borderRadius: 20,
    overflow: "hidden",
  },
  imageBg: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 18,
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradient: {
    padding: 0,
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 20,
    color: "#fff",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.88)",
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.brand,
    width: 18,
  },
});
