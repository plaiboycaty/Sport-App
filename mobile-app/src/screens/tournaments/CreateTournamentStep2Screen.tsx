import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types';
import { useTournamentStore } from '@/store/useTournamentStore';
import { supabase } from '@/services/supabase';
import TournamentStepIndicator from '@/components/tournaments/TournamentStepIndicator';
import { MOCK_FORMATS } from '@/utils/tournamentMockData';
import Header from '@/components/common/Header';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const PRIMARY_COLOR = '#0061AF';

export default function CreateTournamentStep2Screen() {
  const navigation = useNavigation<NavigationProp>();
  const { formData, setFormData, resetForm } = useTournamentStore();

  const handleCreate = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để tạo giải đấu');
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        sport_id: formData.sport_id || null,
        location: formData.location,
        start_date: formData.start_date,
        end_date: formData.end_date,
        prize_first: formData.prize_first,
        prize_second: formData.prize_second,
        prize_third: formData.prize_third,
        format: formData.format,
        max_teams: formData.max_teams,
        points_win: formData.points_win,
        points_draw: formData.points_draw,
        points_loss: formData.points_loss,
        visibility: formData.visibility,
        created_by: userData.user.id,
      };

      if (!payload.sport_id) {
        Alert.alert('Lỗi', 'Vui lòng chọn môn thể thao ở bước 1');
        navigation.goBack();
        return;
      }

      const { error } = await supabase
        .from('tournaments')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Thành công', 'Giải đấu đã được tạo thành công!', [
        {
          text: 'Đóng',
          onPress: () => {
            resetForm();
            navigation.navigate('Main', { screen: 'Tournament' });
          },
        },
      ]);
    } catch (error: any) {
      console.error(error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi tạo giải đấu: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header dùng component dùng chung Header.tsx */}
      <Header title="Tạo giải đấu mới" showBack={true} />

      {/* Step Indicator Component */}
      <TournamentStepIndicator currentStep={2} />

      <ScrollView contentContainerStyle={styles.formContainer} showsVerticalScrollIndicator={false}>
        {/* Thể thức */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>THỂ THỨC</Text>
          <View style={styles.formatContainer}>
            {MOCK_FORMATS.map((fmt) => {
              const isActive = formData.format === fmt.id;
              return (
                <TouchableOpacity
                  key={fmt.id}
                  style={[styles.formatCard, isActive && styles.formatCardActive]}
                  onPress={() => setFormData({ format: fmt.id as any })}
                >
                  {isActive && (
                    <View style={styles.checkIcon}>
                      <Ionicons name="checkmark-circle" size={16} color={PRIMARY_COLOR} />
                    </View>
                  )}
                  <Ionicons
                    name={fmt.icon as any}
                    size={28}
                    color={isActive ? PRIMARY_COLOR : '#757575'}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={[styles.formatText, isActive && styles.formatTextActive]}>
                    {fmt.name}
                  </Text>
                  <Ionicons name="information-circle-outline" size={16} color="#BDBDBD" style={{ marginTop: 8 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Số lượng đội */}
        <View style={styles.cardSection}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>SỐ LƯỢNG ĐỘI</Text>
            <Text style={styles.teamCountText}>{`${formData.max_teams} đội`}</Text>
          </View>
          <View style={styles.sliderContainer}>
            <View style={styles.sliderTrack}>
              <View style={[styles.sliderFill, { width: `${(formData.max_teams / 32) * 100}%` as any }]} />
              <View style={[styles.sliderThumb, { left: `${(formData.max_teams / 32) * 100}%` as any }]} />
            </View>
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>2</Text>
              <Text style={styles.sliderLabelText}>16</Text>
              <Text style={styles.sliderLabelText}>32</Text>
            </View>
          </View>
          
          <View style={styles.teamAdjustRow}>
            <TouchableOpacity 
              style={styles.adjustBtn} 
              onPress={() => setFormData({ max_teams: Math.max(2, formData.max_teams - 1) })}
            >
              <Ionicons name="remove" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.adjustBtn} 
              onPress={() => setFormData({ max_teams: Math.min(32, formData.max_teams + 1) })}
            >
              <Ionicons name="add" size={20} color={PRIMARY_COLOR} />
            </TouchableOpacity>
          </View>

          {/* Quy tắc tính điểm */}
          <View style={styles.pointsSection}>
            <Text style={styles.label}>QUY TẮC TÍNH ĐIỂM (THẮNG / HÒA / THUA)</Text>
            <View style={styles.pointsRow}>
              <View style={styles.pointInputBox}>
                <Text style={styles.pointLabel}>Thắng</Text>
                <TextInput
                  style={styles.pointInput}
                  keyboardType="numeric"
                  value={String(formData.points_win ?? 0)}
                  onChangeText={(text) => setFormData({ points_win: parseInt(text) || 0 })}
                />
              </View>
              <View style={styles.pointInputBox}>
                <Text style={styles.pointLabel}>Hòa</Text>
                <TextInput
                  style={styles.pointInput}
                  keyboardType="numeric"
                  value={String(formData.points_draw ?? 0)}
                  onChangeText={(text) => setFormData({ points_draw: parseInt(text) || 0 })}
                />
              </View>
              <View style={styles.pointInputBox}>
                <Text style={styles.pointLabel}>Thua</Text>
                <TextInput
                  style={styles.pointInput}
                  keyboardType="numeric"
                  value={String(formData.points_loss ?? 0)}
                  onChangeText={(text) => setFormData({ points_loss: parseInt(text) || 0 })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Quy trình duyệt */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>QUY TRÌNH DUYỆT</Text>
        </View>
        <View style={styles.switchCard}>
          <View style={styles.switchIcon}>
            <Ionicons name="shield-checkmark-outline" size={24} color={PRIMARY_COLOR} />
          </View>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Yêu cầu BTC phê duyệt</Text>
            <Text style={styles.switchDesc}>Xem xét hồ sơ trước khi vào giải</Text>
          </View>
          <Switch
            trackColor={{ false: '#E0E0E0', true: `${PRIMARY_COLOR}80` }}
            thumbColor={formData.requires_approval ? PRIMARY_COLOR : '#F5F5F5'}
            value={formData.requires_approval}
            onValueChange={(val) => setFormData({ requires_approval: val })}
          />
        </View>

        {/* Công bố */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>CÔNG BỐ</Text>
        </View>
        <View style={styles.switchCard}>
          <View style={styles.switchIcon}>
            <Ionicons name="lock-closed-outline" size={24} color={PRIMARY_COLOR} />
          </View>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>Giải đấu riêng tư</Text>
            <Text style={styles.switchDesc}>Chỉ người tham gia mới có thể theo dõi</Text>
          </View>
          <Switch
            trackColor={{ false: '#E0E0E0', true: `${PRIMARY_COLOR}80` }}
            thumbColor={formData.visibility === 'invite_only' ? PRIMARY_COLOR : '#F5F5F5'}
            value={formData.visibility === 'invite_only'}
            onValueChange={(val) => setFormData({ visibility: val ? 'invite_only' : 'public' })}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
          <Text style={styles.submitBtnText}>Hoàn tất & Tạo giải</Text>
          <Ionicons name="rocket-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>
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
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  formatContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  formatCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  formatCardActive: {
    borderColor: PRIMARY_COLOR,
    backgroundColor: '#E3F2FD',
  },
  checkIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#212121',
    textAlign: 'center',
  },
  formatTextActive: {
    color: PRIMARY_COLOR,
  },
  cardSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
    marginBottom: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#212121',
  },
  teamCountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: PRIMARY_COLOR,
  },
  sliderContainer: {
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    position: 'relative',
    marginBottom: 8,
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
    top: -5,
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabelText: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  teamAdjustRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 24,
  },
  adjustBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
  },
  pointsSection: {
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
    paddingTop: 16,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  pointInputBox: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 8,
  },
  pointInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#212121',
  },
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  switchIcon: {
    marginRight: 12,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 4,
  },
  switchDesc: {
    fontSize: 12,
    color: '#757575',
  },
  submitBtn: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
