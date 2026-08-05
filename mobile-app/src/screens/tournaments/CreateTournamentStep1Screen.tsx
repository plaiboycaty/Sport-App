import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { useTournamentStore } from '@/store/useTournamentStore';
import CustomDatePickerModal from '@/components/common/CustomDatePickerModal';
import TournamentStepIndicator from '@/components/tournaments/TournamentStepIndicator';
import { MOCK_SPORTS } from '@/utils/tournamentMockData';
import Header from '@/components/common/Header';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PRIMARY_COLOR = '#0061AF';

export default function CreateTournamentStep1Screen() {
  const navigation = useNavigation<NavigationProp>();
  const { formData, setFormData } = useTournamentStore();

  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);

  const handleNext = () => {
    navigation.navigate('CreateTournamentStep2');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'mm/dd/yyyy, --:-- --';
    try {
      return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'mm/dd/yyyy, --:-- --';
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Tạo giải đấu mới" showBack={true} />

      {/* Step Indicator Component */}
      <TournamentStepIndicator currentStep={1} />

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TÊN GIẢI ĐẤU</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập tên giải (ví dụ: Summer Cup 2024)"
            value={formData.name}
            onChangeText={(text) => setFormData({ name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GIỚI THIỆU GIẢI ĐẤU</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Giới thiệu về giải đấu"
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={(text) => setFormData({ description: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CHỌN MÔN THỂ THAO</Text>
          <View style={styles.sportsContainer}>
            {MOCK_SPORTS.map((sport) => {
              const isActive = formData.sport_id === sport.id;
              return (
                <TouchableOpacity
                  key={sport.id}
                  style={[styles.sportChip, isActive && styles.sportChipActive]}
                  onPress={() => setFormData({ sport_id: sport.id })}
                >
                  <Ionicons
                    name={sport.icon as any}
                    size={16}
                    color={isActive ? '#FFF' : '#757575'}
                  />
                  <Text style={[styles.sportChipText, isActive && styles.sportChipTextActive]}>
                    {sport.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ĐỊA ĐIỂM</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="location-outline" size={20} color="#757575" style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              placeholder="Sân vận động, nhà thi đấu..."
              value={formData.location}
              onChangeText={(text) => setFormData({ location: text })}
            />
          </View>
        </View>

        {/* Start Date Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>THỜI GIAN BẮT ĐẦU</Text>
          <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowStartDateModal(true)}>
            <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
            <Text style={styles.inputText}>{formatDate(formData.start_date)}</Text>
            <Ionicons name="chevron-down-outline" size={18} color="#757575" />
          </TouchableOpacity>
        </View>

        {/* End Date Field */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>THỜI GIAN KẾT THÚC</Text>
          <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowEndDateModal(true)}>
            <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} style={styles.inputIcon} />
            <Text style={styles.inputText}>{formatDate(formData.end_date)}</Text>
            <Ionicons name="chevron-down-outline" size={18} color="#757575" />
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>GIẢI THƯỞNG</Text>
          <View style={styles.inputWithIcon}>
            <Ionicons name="medal-outline" size={20} color="#FBC02D" style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              placeholder="Giải Nhất (vd: 5.000.000đ + Cúp)"
              value={formData.prize_first}
              onChangeText={(text) => setFormData({ prize_first: text })}
            />
          </View>
          <View style={[styles.inputWithIcon, { marginTop: 12 }]}>
            <Ionicons name="medal-outline" size={20} color="#9E9E9E" style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              placeholder="Giải Nhì"
              value={formData.prize_second}
              onChangeText={(text) => setFormData({ prize_second: text })}
            />
          </View>
          <View style={[styles.inputWithIcon, { marginTop: 12 }]}>
            <Ionicons name="medal-outline" size={20} color="#FF8A65" style={styles.inputIcon} />
            <TextInput
              style={styles.inputInner}
              placeholder="Giải Ba"
              value={formData.prize_third}
              onChangeText={(text) => setFormData({ prize_third: text })}
            />
          </View>
        </View>

        <View style={styles.bannerContainer}>
          <Ionicons name="trophy-outline" size={40} color="rgba(255,255,255,0.3)" style={styles.bannerIcon} />
          <Text style={styles.bannerTitle}>Gần như hoàn tất!</Text>
          <Text style={styles.bannerText}>Hãy kiểm tra lại thông tin trước khi tiếp tục hoàn tất tạo giải đấu.</Text>
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
          <Text style={styles.nextBtnText}>Tiếp tục bước 2</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Start Date Custom Modal */}
      <CustomDatePickerModal
        visible={showStartDateModal}
        title="Chọn thời gian bắt đầu"
        value={formData.start_date}
        onConfirm={(date) => {
          setFormData({ start_date: date });
          setShowStartDateModal(false);
        }}
        onCancel={() => setShowStartDateModal(false)}
      />

      {/* End Date Custom Modal */}
      <CustomDatePickerModal
        visible={showEndDateModal}
        title="Chọn thời gian kết thúc"
        value={formData.end_date}
        onConfirm={(date) => {
          setFormData({ end_date: date });
          setShowEndDateModal(false);
        }}
        onCancel={() => setShowEndDateModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#424242',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    color: '#212121',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  inputInner: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#212121',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sportChipActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  sportChipText: {
    marginLeft: 6,
    color: '#757575',
    fontWeight: '500',
  },
  sportChipTextActive: {
    color: '#FFF',
  },
  bannerContainer: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 12,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 24,
  },
  bannerIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bannerText: {
    color: '#E3F2FD',
    fontSize: 14,
    lineHeight: 20,
    width: '80%',
  },
  nextBtn: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
