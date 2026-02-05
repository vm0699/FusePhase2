import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OnboardingStepperProps {
    currentStep: number; // 1-based index
    totalSteps: number;
}

const OnboardingStepper: React.FC<OnboardingStepperProps> = ({
    currentStep,
    totalSteps,
}) => {
    return (
        <View style={styles.container}>
            {Array.from({ length: totalSteps }).map((_, index) => {
                const stepNumber = index + 1;
                const isCompleted = stepNumber < currentStep;
                const isCurrent = stepNumber === currentStep;
                const isUpcoming = stepNumber > currentStep;

                return (
                    <React.Fragment key={stepNumber}>
                        <View
                            style={[
                                styles.step,
                                isCompleted && styles.stepCompleted,
                                isCurrent && styles.stepCurrent,
                                isUpcoming && styles.stepUpcoming,
                            ]}
                        />
                        {/* Add connecting line between steps (except after last step) */}
                        {index < totalSteps - 1 && (
                            <View
                                style={[
                                    styles.connector,
                                    (isCompleted || isCurrent) && styles.connectorActive,
                                ]}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    step: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    stepCompleted: {
        backgroundColor: '#ff5864',
    },
    stepCurrent: {
        backgroundColor: '#ff5864',
        width: 32,
        height: 8,
        borderRadius: 4,
    },
    stepUpcoming: {
        backgroundColor: '#E5E7EB',
    },
    connector: {
        width: 16,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    connectorActive: {
        backgroundColor: '#ff5864',
    },
});

export default OnboardingStepper;
