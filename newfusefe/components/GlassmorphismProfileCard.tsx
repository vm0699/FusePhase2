import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassmorphismProfileCardProps {
    name: string;
    avatarUrl: string;
    completeness: number; // 0-100
}

export const GlassmorphismProfileCard = ({
    name,
    avatarUrl,
    completeness,
}: GlassmorphismProfileCardProps) => {
    const progress = Math.max(0, Math.min(100, Math.round(completeness)));

    return (
        <View style={styles.container}>
            <BlurView intensity={35} tint="light" style={styles.blurContainer}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarBorder}>
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    </View>
                </View>

                {/* Name */}
                <View style={styles.nameContainer}>
                    <Text style={styles.name}>{name}</Text>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                </View>

                {/* Completeness Text */}
                <View style={styles.completenessTextContainer}>
                    <Text style={styles.completenessText}>{progress}% Complete</Text>
                </View>
            </BlurView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: 210,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
        borderColor: 'rgba(255, 255, 255, 0.85)',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 5,
    },
    blurContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    avatarContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarBorder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(255, 88, 100, 0.55)',
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    nameContainer: {
        marginTop: 16,
        alignItems: 'center',
    },
    name: {
        marginBottom: 8,
        color: '#111827',
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0,
        textAlign: 'center',
    },
    progressBarWrapper: {
        marginTop: 4,
    },
    progressBarContainer: {
        width: 140,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 1.5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: 'rgba(255, 88, 100, 0.9)',
    },
    completenessTextContainer: {
        marginTop: 6,
    },
    completenessText: {
        fontSize: 13,
        color: '#6B7280',
        fontFamily: 'Poppins',
    },
});
