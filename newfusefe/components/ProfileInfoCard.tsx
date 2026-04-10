import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import {
    GraduationCap,
    Briefcase,
    MapPin,
    Church,
    Moon,
    Wine,
    Cigarette,
    Users,
    Heart,
    Globe,
    Baby,
    Home,
    Flame,
    Dog,
    Leaf,
    BookOpen,
    Calendar,
    ArrowUpDown,
    MessageSquare,
    FlaskConical,
    // Interest icons
    Star,
    Activity,
    Dumbbell,
    Mountain,
    Music,
    Film,
    Mic,
    Coffee,
    PenLine,
    Cpu,
} from "lucide-react-native";

// ─── Interest icon map ────────────────────────────────────────────────────────
const IC = 14;
const IC_COLOR = "#555";

const INTEREST_ICON_MAP: Record<string, React.ReactNode> = {
    "Aromatherapy": <Flame size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Astrology": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Cold plunging": <Leaf size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Crystals": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Deep chats": <MessageSquare size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Journalling": <BookOpen size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Mindfulness": <Heart size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Nutrition": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Gym": <Dumbbell size={IC} color={IC_COLOR} strokeWidth={2} />,
    "American football": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Athletics": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Badminton": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Baseball": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Basketball": <Activity size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Bodybuilding": <Dumbbell size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Bouldering": <Mountain size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Art": <PenLine size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Crafts": <PenLine size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Crocheting": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Dancing": <Music size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Design": <PenLine size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Drawing": <PenLine size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Fashion": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Knitting": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Bars": <Wine size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Cafe-hopping": <Coffee size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Drag shows": <Star size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Festivals": <Music size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Films": <Film size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Gigs": <Music size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Improv": <Mic size={IC} color={IC_COLOR} strokeWidth={2} />,
    "Karaoke": <Mic size={IC} color={IC_COLOR} strokeWidth={2} />,
    "AI": <Cpu size={IC} color={IC_COLOR} strokeWidth={2} />,
};

/** Strips legacy emoji prefix (e.g. "🎨 Art" → "Art") and returns clean label */
function cleanInterestLabel(raw: string): string {
    return raw.replace(/^[^\w\s]+\s*/u, "").trim();
}

function getInterestIcon(label: string): React.ReactNode {
    return INTEREST_ICON_MAP[label] ?? <Star size={IC} color={IC_COLOR} strokeWidth={2} />;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProfileInfoCardProps {
    dateOfBirth?: string;
    gender?: string;
    pronouns?: string;
    sexuality?: string;
    height?: string | number;
    work?: string;
    jobTitle?: string;
    college?: string;
    educationLevel?: string;
    lives_in?: string;
    homeTown?: string;
    religion?: string;
    zodiacSign?: string;
    politics?: string;
    ethnicity?: string;
    drinking?: string;
    smoking?: string;
    marijuana?: string;
    drugs?: string;
    datingIntentions?: string;
    relationshipType?: string;
    children?: string;
    familyPlans?: string;
    pets?: string;
    languages?: string[];
    interests?: string[];
}

// ─── Age calculator ───────────────────────────────────────────────────────────
function calcAge(dob: string): number | null {
    if (!dob || typeof dob !== "string") return null;
    try {
        // Handle common formats: "YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", ISO
        let birth: Date;
        if (/^\d{4}-\d{2}-\d{2}/.test(dob)) {
            birth = new Date(dob);
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
            // Try DD/MM/YYYY first (common in India)
            const [d, m, y] = dob.split("/");
            birth = new Date(`${y}-${m}-${d}`);
        } else {
            birth = new Date(dob);
        }
        if (isNaN(birth.getTime())) return null;
        const now = new Date();
        let age = now.getFullYear() - birth.getFullYear();
        const monthDiff = now.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age -= 1;
        }
        return age >= 18 && age < 100 ? age : null;
    } catch {
        return null;
    }
}

// ─── Icon + label row ─────────────────────────────────────────────────────────
function Row({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <View style={styles.row}>
            <View style={styles.iconCircle}>{icon}</View>
            <Text style={styles.label} numberOfLines={2}>
                {label}
            </Text>
        </View>
    );
}

// ─── Thin divider ─────────────────────────────────────────────────────────────
function Divider() {
    return <View style={styles.divider} />;
}

// ─── Icon mapping for lifestyle scroll pills ──────────────────────────────────
const LIFESTYLE_ICON_MAP: Record<
    string,
    { icon: React.ReactNode; label: string }
> = {};

function LifestyleIcons(props: {
    drinking?: string;
    smoking?: string;
    marijuana?: string;
    drugs?: string;
    sexuality?: string;
    educationLevel?: string;
    religion?: string;
    pets?: string;
    ethnicity?: string;
    lives_in?: string;
    politics?: string;
    zodiacSign?: string;
    childLabel?: string;
}) {
    const { drinking, smoking, marijuana, drugs, sexuality, educationLevel, religion, pets, ethnicity, lives_in, politics, zodiacSign, childLabel } = props;
    const items: { icon: React.ReactNode; value: string }[] = [
        drinking ? { icon: <Wine size={15} strokeWidth={2} color="#3A3A3A" />, value: drinking } : null,
        smoking ? { icon: <Cigarette size={15} strokeWidth={2} color="#3A3A3A" />, value: smoking } : null,
        marijuana ? { icon: <Leaf size={15} strokeWidth={2} color="#3A3A3A" />, value: marijuana } : null,
        drugs ? { icon: <FlaskConical size={15} strokeWidth={2} color="#3A3A3A" />, value: drugs } : null,
        sexuality ? { icon: <Heart size={15} strokeWidth={2} color="#3A3A3A" />, value: sexuality } : null,
        educationLevel ? { icon: <BookOpen size={15} strokeWidth={2} color="#3A3A3A" />, value: educationLevel } : null,
        religion ? { icon: <Church size={15} strokeWidth={2} color="#3A3A3A" />, value: religion } : null,
        pets ? { icon: <Dog size={15} strokeWidth={2} color="#3A3A3A" />, value: pets } : null,
        ethnicity ? { icon: <Users size={15} strokeWidth={2} color="#3A3A3A" />, value: ethnicity } : null,
        lives_in ? { icon: <MapPin size={15} strokeWidth={2} color="#3A3A3A" />, value: lives_in } : null,
        politics ? { icon: <Globe size={15} strokeWidth={2} color="#3A3A3A" />, value: politics } : null,
        zodiacSign ? { icon: <Moon size={15} strokeWidth={2} color="#3A3A3A" />, value: zodiacSign } : null,
        childLabel ? { icon: <Baby size={15} strokeWidth={2} color="#3A3A3A" />, value: childLabel } : null,
    ].filter(Boolean) as { icon: React.ReactNode; value: string }[];

    if (!items.length) return null;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lifestyleRow}
        >
            {items.map((item, idx) => (
                <View key={idx} style={styles.lifestylePill}>
                    <View style={styles.lifestylePillIcon}>{item.icon}</View>
                    <Text style={styles.lifestyleText}>{item.value}</Text>
                </View>
            ))}
        </ScrollView>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProfileInfoCard({
    dateOfBirth,
    gender,
    pronouns,
    sexuality,
    height,
    work,
    jobTitle,
    college,
    educationLevel,
    lives_in,
    homeTown,
    religion,
    zodiacSign,
    politics,
    ethnicity,
    drinking,
    smoking,
    marijuana,
    drugs,
    datingIntentions,
    relationshipType,
    children,
    familyPlans,
    pets,
    languages,
    interests,
}: ProfileInfoCardProps) {

    const age = calcAge(dateOfBirth ?? "");

    const hasLifestyle = drinking || smoking || marijuana || drugs ||
        sexuality || educationLevel || religion || pets || ethnicity || lives_in || politics || zodiacSign || children || familyPlans;

    const hasRows =
        age !== null || gender || pronouns || height ||
        work || jobTitle || college ||
        homeTown ||
        datingIntentions || relationshipType ||
        (languages && languages.length > 0);

    const hasInterests = interests && interests.length > 0;

    if (!hasLifestyle && !hasRows && !hasInterests) return null;

    const genderLabel = [gender, pronouns].filter(Boolean).join("  ·  ");
    const jobLabel = [jobTitle, work].filter(Boolean).join("  ·  ");
    const childLabel = [children, familyPlans].filter(Boolean).join("  ·  ");

    return (
        <View style={styles.card}>

            {/* ── ZONE 1: Lifestyle horizontal scroll ── */}
            {hasLifestyle ? (
                <LifestyleIcons
                    drinking={drinking}
                    smoking={smoking}
                    marijuana={marijuana}
                    drugs={drugs}
                    sexuality={sexuality}
                    educationLevel={educationLevel}
                    religion={religion}
                    pets={pets}
                    ethnicity={ethnicity}
                    lives_in={lives_in}
                    politics={politics}
                    zodiacSign={zodiacSign}
                    childLabel={childLabel}
                />
            ) : null}

            {hasLifestyle && hasRows ? <Divider /> : null}

            {/* ── ZONE 2: Icon rows ── */}

            {age !== null ? (
                <Row
                    icon={<Calendar size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={`${age} years old`}
                />
            ) : null}

            {height ? (
                <Row
                    icon={<ArrowUpDown size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={`${height} cm`}
                />
            ) : null}

            {genderLabel ? (
                <Row
                    icon={<Users size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={genderLabel}
                />
            ) : null}

            {jobLabel ? (
                <Row
                    icon={<Briefcase size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={jobLabel}
                />
            ) : null}

            {college ? (
                <Row
                    icon={<GraduationCap size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={college}
                />
            ) : null}

            {homeTown ? (
                <Row
                    icon={<Home size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={`From ${homeTown}`}
                />
            ) : null}

            {datingIntentions ? (
                <Row
                    icon={<Flame size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={datingIntentions}
                />
            ) : null}

            {relationshipType ? (
                <Row
                    icon={<Heart size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={relationshipType}
                />
            ) : null}

            {languages && languages.length > 0 ? (
                <Row
                    icon={<MessageSquare size={17} strokeWidth={2} color="#3A3A3A" />}
                    label={Array.isArray(languages) ? languages.join(", ") : languages}
                />
            ) : null}

            {/* ── ZONE 3: Interests horizontal scroll ── */}
            {hasInterests ? (
                <>
                    {hasRows ? <Divider /> : null}
                    <Text style={styles.sectionLabel}>Interests</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.chipsRow}
                    >
                        {interests!.map((item, idx) => {
                            const label = cleanInterestLabel(item);
                            return (
                                <View key={idx} style={styles.chip}>
                                    {getInterestIcon(label)}
                                    <Text style={styles.chipText}>{label}</Text>
                                </View>
                            );
                        })}
                    </ScrollView>
                </>
            ) : null}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ICON_BG = "#EFEFEF";

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: "#E8E8E8",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        gap: 11,
    },

    // Lifestyle scroll
    lifestyleRow: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 2,
    },
    lifestylePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderWidth: 1,
        borderColor: "#E8E8E8",
    },
    lifestylePillIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: ICON_BG,
        alignItems: "center",
        justifyContent: "center",
    },
    lifestyleText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#2E2E2E",
        fontFamily: "Poppins",
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
    },

    // Icon rows
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: ICON_BG,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    label: {
        fontSize: 15,
        fontWeight: "500",
        color: "#2E2E2E",
        flexShrink: 1,
        fontFamily: "Poppins",
    },

    // Interests chips
    chipsRow: {
        flexDirection: "row",
        gap: 8,
        paddingVertical: 2,
    },
    chip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#F5F5F5",
        borderRadius: 20,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: "#E8E8E8",
    },
    chipText: {
        fontSize: 13,
        fontWeight: "500",
        color: "#2E2E2E",
        fontFamily: "Poppins",
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: "600",
        color: "#999",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: -3,
        fontFamily: "Poppins-SemiBold",
    },
});
