import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY_COLOR = '#0061AF';

interface TournamentStepIndicatorProps {
  currentStep: 1 | 2;
}

export default function TournamentStepIndicator({ currentStep }: TournamentStepIndicatorProps) {
  return (
    <View style={styles.stepIndicatorContainer}>
      <View style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}>
        {currentStep === 2 ? (
          <Ionicons name="checkmark" size={14} color="#FFF" />
        ) : (
          <Text style={styles.stepText}>1</Text>
        )}
      </View>

      {currentStep === 1 && (
        <Text style={[styles.stepLabel, styles.stepLabelActive]}>
          Thông tin cơ bản
        </Text>
      )}

      <View style={[styles.stepLine, currentStep === 2 && styles.stepLineActive]} />

      {currentStep === 2 && (
        <Text style={[styles.stepLabel, styles.stepLabelActive]}>
          Cài đặt giải đấu
        </Text>
      )}

      <View style={[styles.stepCircle, currentStep === 2 && styles.stepCircleActive]}>
        <Text style={styles.stepText}>2</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FFF',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: PRIMARY_COLOR,
  },
  stepText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: PRIMARY_COLOR,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 12,
  },
  stepLineActive: {
    backgroundColor: PRIMARY_COLOR,
  },
});
