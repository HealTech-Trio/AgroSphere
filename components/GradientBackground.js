// components/GradientBackground.js (alternative)
import React from 'react';
import { View } from 'react-native';

const GradientBackground = ({ children, style, colors, ...props }) => {
  // Fallback to the first color if LinearGradient has issues
  return (
    <View style={[style, { backgroundColor: colors[0] }]} {...props}>
      {children}
    </View>
  );
};

export default GradientBackground;