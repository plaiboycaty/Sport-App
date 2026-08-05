import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const PRIMARY_COLOR = '#0061AF';

interface CustomDatePickerModalProps {
  visible: boolean;
  title: string;
  value: Date | null;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}

export default function CustomDatePickerModal({
  visible,
  title,
  value,
  onConfirm,
  onCancel,
}: CustomDatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(value || new Date());
  const [dateString, setDateString] = useState<string>('');
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const d = value || new Date();
    setSelectedDate(d);
    
    // YYYY-MM-DD
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateString(`${yyyy}-${mm}-${dd}`);

    // HH:mm
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setTimeString(`${hh}:${min}`);
  }, [value, visible]);

  const handleConfirm = () => {
    if (Platform.OS === 'web') {
      try {
        const [year, month, day] = dateString.split('-').map(Number);
        const [hours, minutes] = timeString.split(':').map(Number);
        const newD = new Date(year, month - 1, day, hours || 0, minutes || 0);
        onConfirm(isNaN(newD.getTime()) ? new Date() : newD);
      } catch {
        onConfirm(selectedDate);
      }
    } else {
      onConfirm(selectedDate);
    }
  };

  const setQuickDate = (daysToAdd: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setSelectedDate(d);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateString(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calendar-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Quick Select Chips */}
            <Text style={styles.sectionLabel}>CHỌN NHANH</Text>
            <View style={styles.quickChipsRow}>
              <TouchableOpacity style={styles.chip} onPress={() => setQuickDate(0)}>
                <Text style={styles.chipText}>Hôm nay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setQuickDate(1)}>
                <Text style={styles.chipText}>Ngày mai</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => setQuickDate(7)}>
                <Text style={styles.chipText}>+1 Tuần</Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === 'web' ? (
              <View style={styles.webInputsContainer}>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Ngày (YYYY-MM-DD)</Text>
                  <TextInput
                    style={styles.webInput}
                    value={dateString}
                    onChangeText={setDateString}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={styles.inputBox}>
                  <Text style={styles.inputLabel}>Giờ (HH:mm)</Text>
                  <TextInput
                    style={styles.webInput}
                    value={timeString}
                    onChangeText={setTimeString}
                    placeholder="HH:mm"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.nativePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  textColor="#212121"
                  accentColor={PRIMARY_COLOR}
                  onChange={(event, date) => {
                    if (date) setSelectedDate(date);
                  }}
                />
              </View>
            )}

            {/* Selected preview */}
            <View style={styles.previewBox}>
              <Ionicons name="time-outline" size={18} color={PRIMARY_COLOR} />
              <Text style={styles.previewText}>
                {selectedDate.toLocaleString('vi-VN', {
                  weekday: 'short',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 8,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  chipText: {
    color: PRIMARY_COLOR,
    fontSize: 12,
    fontWeight: '600',
  },
  webInputsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#424242',
    marginBottom: 6,
    fontWeight: '500',
  },
  webInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212121',
    backgroundColor: '#FAFAFA',
  },
  nativePickerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F9FF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0E3FF',
    marginTop: 8,
  },
  previewText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY_COLOR,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  cancelBtnText: {
    color: '#616161',
    fontWeight: '600',
    fontSize: 14,
  },
  confirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: PRIMARY_COLOR,
  },
  confirmBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
