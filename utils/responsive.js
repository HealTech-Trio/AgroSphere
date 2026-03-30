// utils/responsive.js
import { Dimensions, Platform } from 'react-native'; // REMOVE StatusBar from here

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

const scale = size => (width / guidelineBaseWidth) * size;
const verticalScale = size => (height / guidelineBaseHeight) * size;
const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

// Platform detection
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';
const isTablet = width >= 600;

// Responsive font sizes
const fontSizes = {
  tiny: moderateScale(10),
  small: moderateScale(12),
  medium: moderateScale(14),
  large: moderateScale(16),
  xlarge: moderateScale(18),
  xxlarge: moderateScale(20),
  xxxlarge: moderateScale(24),
  huge: moderateScale(28),
  xhuge: moderateScale(32),
};

// Device specific spacing
const spacing = {
  tiny: verticalScale(4),
  small: verticalScale(8),
  medium: verticalScale(16),
  large: verticalScale(24),
  xlarge: verticalScale(32),
  xxlarge: verticalScale(48),
};

export {
  width,
  height,
  scale,
  verticalScale,
  moderateScale,
  isIOS,
  isAndroid,
  isTablet,
  fontSizes,
  spacing,
};