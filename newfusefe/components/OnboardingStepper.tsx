import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';

interface OnboardingStepperProps {
    currentStep: number; // 1-based
    totalSteps: number;
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
    currentStep,
    totalSteps,
}) => {
    if (!totalSteps || totalSteps <= 0) return null;

    const safeCurrentStep = Math.min(Math.max(currentStep, 1), totalSteps);

    const scrollRef = useRef<ScrollView | null>(null);
    const [containerWidth, setContainerWidth] = useState(0);

    // Dense mode for big flows like 26 steps
    const isDense = totalSteps > 10;

    const dotSize = isDense ? 10 : 8;
    const currentDotWidth = isDense ? 24 : 32;
    const connectorWidth = isDense ? 10 : 16;
    const extraMargin = 8;

    // Approx width per step (dot + connector + margin)
    const stepUnitWidth = dotSize + connectorWidth + extraMargin;

    const handleLayout = (e: LayoutChangeEvent) => {
        setContainerWidth(e.nativeEvent.layout.width);
    };

    useEffect(() => {
        if (!scrollRef.current || !containerWidth) return;

        const targetIndex = safeCurrentStep - 1; // 0-based
        const totalContentWidth = stepUnitWidth * totalSteps;

        // Center of current step in content coordinates
        const centerX = targetIndex * stepUnitWidth + stepUnitWidth / 2;

        let offsetX = centerX - containerWidth / 2;
        if (offsetX < 0) offsetX = 0;

        const maxOffset = Math.max(0, totalContentWidth - containerWidth);
        if (offsetX > maxOffset) offsetX = maxOffset;

        scrollRef.current.scrollTo({
            x: offsetX,
            y: 0,
            animated: true,
        });
    }, [safeCurrentStep, containerWidth, stepUnitWidth, totalSteps]);

    return (
        <View style={styles.wrapper} onLayout={handleLayout}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEnabled={false} // user can't scroll, only auto-scroll
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.row}>
                    {Array.from({ length: totalSteps }).map((_, index) => {
                        const stepNumber = index + 1;
                        const isCompleted = stepNumber < safeCurrentStep;
                        const isCurrent = stepNumber === safeCurrentStep;
                        const isUpcoming = stepNumber > safeCurrentStep;

                        return (
                            <React.Fragment key={stepNumber}>
                                <View
                                    style={[
                                        styles.stepBase,
                                        {
                                            width: isCurrent ? currentDotWidth : dotSize,
                                            height: dotSize,
                                            borderRadius: dotSize / 2,
                                        },
                                        isCompleted && styles.stepCompleted,
                                        isCurrent && styles.stepCurrent,
                                        isUpcoming && styles.stepUpcoming,
                                    ]}
                                />
                                {index < totalSteps - 1 && (
                                    <View
                                        style={[
                                            styles.connectorBase,
                                            { width: connectorWidth },
                                            (isCompleted || isCurrent) && styles.connectorActive,
                                        ]}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 200,
        alignSelf: 'center',
    },
    scrollContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepBase: {
        backgroundColor: '#E5E7EB', // default upcoming
    },
    stepCompleted: {
        backgroundColor: '#ff5864',
    },
    stepCurrent: {
        backgroundColor: '#ff5864',
    },
    stepUpcoming: {
        backgroundColor: '#E5E7EB',
    },
    connectorBase: {
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 3,
    },
    connectorActive: {
        backgroundColor: '#ff5864',
    },
});

export default OnboardingStepper;
