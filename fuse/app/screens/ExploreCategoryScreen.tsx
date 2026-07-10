import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { theme } from "../theme";
import exploreApi, { type Venue, type Event, type EventAudience, type EventPricingType } from "../api/exploreApi";
import VenueCard from "../../components/ui/explore/VenueCard";
import EventCard from "../../components/ui/explore/EventCard";
import { EmptyState } from "../../components/ui";

type RouteParams = {
  category: "dates" | "events" | "gifts" | "premium";
  audience?: EventAudience;
  eventCategory?: string;
  pricingType?: EventPricingType;
};

const TITLE_MAP: Record<string, string> = {
  dates: "Date Venues",
  events: "Local Events",
  gifts: "Gifts",
  premium: "Premium Experiences",
};

export default function ExploreCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { category, audience, eventCategory, pricingType } = (route.params || {}) as RouteParams;
  const insets = useSafeAreaInsets();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (category === "dates") {
          const res = await exploreApi.getVenues({ limit: 30 });
          setVenues(res.venues);
        } else if (category === "events") {
          const res = await exploreApi.getEvents({ limit: 30, audience, category: eventCategory, pricingType });
          setEvents(res.events);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category, audience, eventCategory, pricingType]);

  const items = category === "dates" ? venues : events;

  const renderItem = ({ item }: { item: Venue | Event }) => {
    if (category === "dates") {
      const venue = item as Venue;
      return (
        <VenueCard
          venue={venue}
          onPress={() => navigation.navigate("VenueDetail", { venueId: venue._id })}
          style={styles.listCard}
        />
      );
    }
    const event = item as Event;
    return (
      <EventCard
        event={event}
        onPress={() => navigation.navigate("EventDetail", { eventId: event._id })}
        style={styles.listCard}
      />
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.back}>
          <ArrowLeft size={22} color={theme.colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.title}>
          {category === "events" && audience === "MEET_PEOPLE" ? "Meet People" : TITLE_MAP[category] ?? "Explore"}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={theme.colors.brand} size="large" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing here yet"
          message="We're adding new options soon. Check back!"
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item._id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 100 },
          ]}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 12,
  },
  row: {
    gap: 12,
    justifyContent: "space-between",
  },
  listCard: {
    flex: 1,
    width: undefined,
  },
});
