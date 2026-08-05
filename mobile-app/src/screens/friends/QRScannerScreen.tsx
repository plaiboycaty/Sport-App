import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator,
  PanResponder,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import jsQR from 'jsqr';
import jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { friendService } from '@/services/friendService';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

// Polyfill Buffer toàn cục cho React Native
if (typeof global.Buffer === 'undefined') { //buffer dùng để xử lý dữ liệu dạng nhị phân 
  (global as any).Buffer = Buffer;
}

const { width } = Dimensions.get('window');
const SCAN_SIZE = width * 0.72; // Kích thước khung vuông quét ở trung tâm

type QRScannerScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'QRScanner'>;
};

export default function QRScannerScreen({ navigation }: QRScannerScreenProps) {
  const insets = useSafeAreaInsets();

  // 1. Quản lý quyền truy cập Camera
  const [permission, requestPermission] = useCameraPermissions(); // useCameraPermissions dùng để hiển thị quyền truy cập camera(thư viện expo-camera)

  // 2. Trạng thái camera & quét
  const [torch, setTorch] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [loadingScan, setLoadingScan] = useState(false);
  const [isMyQRVisible, setIsMyQRVisible] = useState(false);

  // 3. Quản lý cử chỉ vuốt xuống (Swipe Down) để tắt Modal
  const panY = useRef(new Animated.Value(0)).current;   // animated.value dùng để lưu trữ giá trị theo thời gian thực

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 70 || gestureState.vy > 0.5) {
          Animated.timing(panY, {
            toValue: 400,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            setIsMyQRVisible(false);
            panY.setValue(0);
          });
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        }
      },
    })
  ).current;

  // Reset vị trí vuốt khi Modal mở lên
  const openMyQRModal = () => {
    panY.setValue(0);
    setIsMyQRVisible(true);
  };

  // 3. Thông tin Profile của người dùng hiện tại
  const [myProfile, setMyProfile] = useState<{
    full_name: string;
    avatar_url?: string;
    friend_code: string;
  } | null>(null);

  useEffect(() => {
    loadMyProfile();
  }, []);

  const loadMyProfile = async () => {
    try {
      const profile = await friendService.getCurrentUserProfile();
      if (profile) {
        setMyProfile(profile);
      }
    } catch (e) {
      console.error('Lỗi khi tải profile cá nhân:', e);
    }
  };

  // 4. Xử lý mã QR thu được (từ Camera hoặc Thư viện ảnh)
  const processFriendCode = async (rawString: string) => {
    if (scanned || loadingScan) return;
    setScanned(true);
    setLoadingScan(true);

    try {
      let friendCode = rawString.trim();

      // Kiểm tra định dạng Prefixed (ví dụ: SPORT_FRIEND:SPT-1234)
      if (friendCode.startsWith('SPORT_FRIEND:')) {
        friendCode = friendCode.replace('SPORT_FRIEND:', '');
      } else {
        // Hoặc định dạng JSON ({"type": "SPORT_APP_FRIEND", "code": "..."})
        try {
          const parsed = JSON.parse(rawString);
          if (parsed.code) {
            friendCode = parsed.code;
          }
        } catch {
          // Sử dụng nguyên chuỗi friendCode nếu không phải JSON
        }
      }

      // Gửi lời mời kết bạn bằng friend_code
      const result = await friendService.sendFriendRequest(friendCode);

      Alert.alert('Thành công! 🎉', result.message, [
        {
          text: 'Quét mã khác',
          onPress: () => {
            setScanned(false);
            setLoadingScan(false);
          },
        },
        {
          text: 'Trở về',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Không thể kết bạn',
        error.message || 'Mã QR không đúng định dạng mã bạn bè.',
        [
          {
            text: 'Quét lại',
            onPress: () => {
              setScanned(false);
              setLoadingScan(false);
            },
          },
        ]
      );
    } finally {
      setLoadingScan(false);
    }
  };

  // 5. Sự kiện Camera phát hiện mã QR realtime
  const handleBarcodeScanned = ({ data }: { data: string }) => {
    processFriendCode(data);
  };

  // 6. Mở thư viện ảnh và giải mã QR từ ảnh bằng Pure JS (jsQR + jpeg-js)
  const pickImageAndScan = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ // Mở thư viện ảnh
        mediaTypes: ['images'],
        quality: 1,
        base64: true,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        setLoadingScan(true);

        const base64Data = result.assets[0].base64;
        const rawBuffer = Buffer.from(base64Data, 'base64');

        let decodedJpeg;
        try {
          decodedJpeg = jpeg.decode(rawBuffer, { tolerantDecoding: true });
        } catch (decodeErr) {
          console.warn('Lỗi decode JPEG:', decodeErr);
        }

        if (decodedJpeg && decodedJpeg.data) {
          const code = jsQR(
            new Uint8ClampedArray(decodedJpeg.data),
            decodedJpeg.width,
            decodedJpeg.height
          );

          setLoadingScan(false);

          if (code && code.data) {
            processFriendCode(code.data);
            return;
          }
        }

        setLoadingScan(false);
        Alert.alert(
          'Không tìm thấy QR',
          'Không phát hiện thấy mã QR hợp lệ trong ảnh đã chọn. Vui lòng thử tấm ảnh rõ nét hơn!'
        );
      }
    } catch (error) {
      setLoadingScan(false);
      console.error('Lỗi đọc QR từ thư viện ảnh:', error);
      Alert.alert('Lỗi đọc ảnh', 'Không thể giải mã dữ liệu mã QR từ ảnh đã chọn.');
    }
  };

  // Trường hợp chưa được cấp quyền Camera
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0061AF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={54} color="#6B7280" />
        <Text style={styles.permissionTitle}>Yêu cầu quyền truy cập Camera</Text>
        <Text style={styles.permissionSub}>
          Ứng dụng cần sử dụng Camera để bạn có thể quét mã QR kết bạn của người khác.
        </Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Cho phép truy cập Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 1. LAYER CAMERA LIVE FULLSCREEN */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={torch}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* 2. BANKING SCANNER OVERLAY */}
        <View style={styles.overlayContainer}>
          {/* Top Overlay: Header & Quay lại */}
          <View style={[styles.overlayTop, { paddingTop: insets.top > 0 ? insets.top : 24 }]}>
            <TouchableOpacity
              style={[styles.backButton, { top: insets.top > 0 ? insets.top + 4 : 28 }]}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Quét mã QR kết bạn</Text>
          </View>

          {/* Middle Overlay: Khung hình vuông có cắt trong suốt ở trung tâm */}
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            <View style={styles.scanSquare}>
              {/* 4 góc viền sáng màu neon nhạt kiểu app ngân hàng */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              {/* Indicator đang load khi quét */}
              {loadingScan && (
                <View style={styles.loadingScanOverlay}>
                  <ActivityIndicator size="large" color="#FFFFFF" />
                  <Text style={styles.loadingScanText}>Đang kiểm tra mã...</Text>
                </View>
              )}
            </View>
            <View style={styles.overlaySide} />
          </View>

          {/* Bottom Overlay: Gợi ý, Nút Đèn flash, Nút Thư viện, Nút QR của tôi */}
          <View style={[styles.overlayBottom, { paddingBottom: Math.max(insets.bottom + 16, 28) }]}>
            {!isMyQRVisible && (
              <>
                <Text style={styles.hintText}>Căn chỉnh mã QR của bạn bè vào giữa khung hình</Text>

                {/* Thanh công cụ: Đèn & Thư viện */}
                <View style={styles.toolRow}>
                  <TouchableOpacity
                    style={styles.toolBtn}
                    onPress={() => setTorch(!torch)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.toolIconCircle, torch && styles.toolIconActive]}>
                      <Ionicons
                        name={torch ? 'flash' : 'flash-off-outline'}
                        size={22}
                        color={torch ? '#0061AF' : '#FFFFFF'}
                      />
                    </View>
                    <Text style={styles.toolText}>{torch ? 'Tắt Đèn' : 'Bật Đèn'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.toolBtn} onPress={pickImageAndScan} activeOpacity={0.8}>
                    <View style={styles.toolIconCircle}>
                      <Ionicons name="images-outline" size={22} color="#FFFFFF" />
                    </View>
                    <Text style={styles.toolText}>Thư viện ảnh</Text>
                  </TouchableOpacity>
                </View>

                {/* 3. NÚT MỞ MÃ QR CỦA TÔI Ở ĐÁY MÀN HÌNH */}
                <TouchableOpacity
                  style={styles.myQrCardButton}
                  onPress={openMyQRModal}
                  activeOpacity={0.9}
                >
                  <Ionicons name="qr-code" size={22} color="#0061AF" />
                  <Text style={styles.myQrCardText}>Mã QR của tôi</Text>
                  <Ionicons name="chevron-up" size={20} color="#6B7280" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </CameraView>

      {/* 4. MODAL/BOTTOM SHEET BẬT LÊN HIỂN THỊ QR CỦA BẢN THÂN */}
      <Modal
        visible={isMyQRVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsMyQRVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackgroundTouchable}
            activeOpacity={1}
            onPress={() => setIsMyQRVisible(false)}
          />
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.modalCard,
              {
                paddingBottom: Math.max(insets.bottom + 20, 28),
                transform: [{ translateY: panY }],
              },
            ]}
          >
            {/* Handle Bar (Vùng chạm vuốt xuống) */}
            <View style={styles.modalHandle} />

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setIsMyQRVisible(false)}
            >
              <Ionicons name="close-circle-sharp" size={28} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Info Người dùng */}
            <View style={styles.profileHeader}>
              <Image
                source={{
                  uri:
                    myProfile?.avatar_url ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
                }}
                style={styles.avatar}
              />
              <Text style={styles.profileName}>{myProfile?.full_name || 'Người dùng'}</Text>
              <Text style={styles.profileCodeLabel}>
                MÃ BẠN BÈ: <Text style={styles.profileCodeValue}>{myProfile?.friend_code || '---'}</Text>
              </Text>
            </View>

            {/* QR Code cá nhân */}
            <View style={styles.qrContainer}>
              {myProfile?.friend_code ? (
                <QRCode
                  value={`SPORT_FRIEND:${myProfile.friend_code}`}
                  size={210}
                  color="#0061AF"
                  backgroundColor="#FFFFFF"
                />
              ) : (
                <ActivityIndicator size="large" color="#0061AF" />
              )}
            </View>

            <Text style={styles.qrInstruction}>
              Đưa mã này cho bạn bè để quét và gửi lời mời kết bạn ngay lập tức!
            </Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#FBF9F5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionSub: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionBtn: {
    backgroundColor: '#0061AF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },

  /* OVERLAY MÀN HÌNH QUÉT */
  overlayContainer: {
    flex: 1,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    padding: 8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* KHUNG QUÉT GIỮA */
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  scanSquare: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#38BDF8', // Màu xanh lam tươi sáng ngân hàng
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 14,
  },

  loadingScanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  loadingScanText: {
    color: '#FFFFFF',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  /* DƯỚI KHUNG QUÉT */
  overlayBottom: {
    flex: 1.6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  toolRow: {
    flexDirection: 'row',
    gap: 48,
    marginVertical: 10,
  },
  toolBtn: {
    alignItems: 'center',
  },
  toolIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIconActive: {
    backgroundColor: '#FFFFFF',
  },
  toolText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },

  /* CARD MÃ QR CỦA TÔI NỔI Ở ĐÁY */
  myQrCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  myQrCardText: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },

  /* MODAL QR CÁ NHÂN */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalBackgroundTouchable: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 0,
    paddingTop: 12,
    alignItems: 'center',
    position: 'relative',
  },
  modalHandle: {
    width: 44,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 16,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#0061AF',
  },
  profileName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1F2937',
  },
  profileCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  profileCodeValue: {
    color: '#0061AF',
    fontWeight: '800',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#0061AF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  qrInstruction: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
});
