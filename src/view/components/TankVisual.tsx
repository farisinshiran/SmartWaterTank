import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WaterLevel } from '../../types';

interface TankVisualProps {
  level: WaterLevel;
  showPercentage?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const COLORS = {
  water: '#4FC3F7',
  waterFull: '#1565C0',
  waterLow: '#FFEB3B',
  tank: '#ECEFF1',
  tankBorder: '#90A4AE',
  text: '#37474F',
};

export const TankVisual: React.FC<TankVisualProps> = ({
  level,
  showPercentage = true,
  size = 'medium',
}) => {
  const levelToPercentage: Record<WaterLevel, number> = {
    EMPTY: 0,
    LOW: 10,
    MEDIUM: 20,
    HIGH: 50,
    FULL: 90,
  };
  const percentage = levelToPercentage[level];

  const dimensions = {
    small: { width: 80, height: 120 },
    medium: { width: 120, height: 180 },
    large: { width: 160, height: 240 },
  };

  const { width, height } = dimensions[size];
  const waterHeight = (height - 20) * (percentage / 100);

  const getWaterColor = () => {
    if (percentage >= 90) return COLORS.waterFull;
    if (percentage < 30) return COLORS.waterLow;
    return COLORS.water;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.tank, { width, height }]}>
        {/* Water */}
        <View
          style={[
            styles.water,
            {
              height: waterHeight,
              backgroundColor: getWaterColor(),
            },
          ]}
        />
        
        {/* Tank cap */}
        <View style={styles.tankCap} />
        
        {/* Water level marks */}
        <View style={styles.marksContainer}>
          <View style={[styles.mark, { bottom: '25%' }]} />
          <View style={[styles.mark, { bottom: '20%' }]} />
          <View style={[styles.mark, { bottom: '75%' }]} />
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labelContainer}>
        <Text style={styles.levelLabel}>
          {level === 'FULL' ? 'PENUH' : level === 'MEDIUM' ? 'SEDANG' : 'RENDAH'}
        </Text>
        {showPercentage && (
          <Text style={styles.percentageText}>{percentage}%</Text>
        )}
      </View>

      {/* Level indicators */}
      <View style={styles.indicatorContainer}>
        <Text style={[
          styles.indicator,
          percentage >= 20 && styles.indicatorActive
        ]}>20%</Text>
        <Text style={[
          styles.indicator,
          percentage >= 90 && styles.indicatorActive
        ]}>90%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  tank: {
    backgroundColor: COLORS.tank,
    borderWidth: 3,
    borderColor: COLORS.tankBorder,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  water: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tankCap: {
    position: 'absolute',
    top: 0,
    left: -4,
    right: -4,
    height: 14,
    backgroundColor: COLORS.tankBorder,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  marksContainer: {
    position: 'absolute',
    right: 6,
    top: 20,
    bottom: 6,
  },
  mark: {
    position: 'absolute',
    width: 12,
    height: 2,
    backgroundColor: COLORS.tankBorder,
  },
  labelContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  percentageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  indicatorContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  indicator: {
    fontSize: 10,
    color: '#90A4AE',
    fontWeight: '500',
  },
  indicatorActive: {
    color: '#0288D1',
    fontWeight: 'bold',
  },
});
