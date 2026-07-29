import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  useWindowDimensions,
  ImageSourcePropType,
  NativeSyntheticEvent,
  NativeScrollEvent,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  image: ImageSourcePropType;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Kết nối đam mê',
    description: 'Dễ dàng tìm kiếm bạn bè, tạo nhóm chơi thể thao nội bộ và rủ rê đồng đội thi đấu.',
    image: require('../../../assets/images/onboarding1.jpg'),
  },
  {
    id: '2',
    title: 'Quản lý giải đấu',
    description: 'Tạo phòng chơi giao hữu, tự động xếp lịch thi đấu và quản lý sơ đồ vòng đấu chuyên nghiệp.',
    image: require('../../../assets/images/onboarding2.jpg'),
  },
  {
    id: '3',
    title: 'Cập nhật Tỷ số',
    description: 'Ghi nhận tỉ số live tức thì, theo dõi Bảng xếp hạng và thống kê phong độ cá nhân.',
    image: require('../../../assets/images/onboarding3.jpg'),
  },
];

export default function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  // Xử lý sự kiện vuốt slide để cập nhật index
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const contentOffsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(contentOffsetX / width);
      if (index !== currentIndex && index >= 0 && index < SLIDES.length) {
        setCurrentIndex(index);
      }
    },
    [currentIndex, width]
  );

  // Chuyển sang màn hình Login
  const handleFinish = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  // Xử lý khi nhấn nút "Tiếp tục" hoặc "Bắt đầu ngay"
  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  }, [currentIndex, handleFinish]);

  // Render từng item của FlatList
  const renderItem = useCallback(
    ({ item }: { item: OnboardingSlide }) => (
      <View style={[styles.slide, { width }]}>
        <View style={styles.imageContainer}>
          <Image source={item.image} style={styles.image} resizeMode="contain" />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    ),
    [width]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFBF7" />

      {/* Header: Nút "Bỏ qua" ở góc trên bên phải (Chỉ hiển thị ở màn 1 và 2) */}
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleFinish}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipText}>Bỏ qua</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}
      </View>

      {/* Body: FlatList danh sách slide vuốt ngang */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />

      {/* Footer: Pagination Dots & Action Button */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {currentIndex === SLIDES.length - 1 ? 'Bắt đầu ngay' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerPlaceholder: {
    height: 30,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  imageContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
    paddingTop: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 36,
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    height: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#0066CC',
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#E0E0E0',
  },
  button: {
    width: '100%',
    height: 54,
    backgroundColor: '#0066CC',
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066CC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
