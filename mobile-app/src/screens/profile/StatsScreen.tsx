import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Polygon, Text as SvgText } from 'react-native-svg';
import Header from '../../components/common/Header';
import { mockPlayerStats } from '../../utils';

const screenWidth = Dimensions.get('window').width;

// Biểu đồ Line Chart với Gradient fill
function AreaChart({ data, labels }: { data: number[]; labels: string[] }) {
  const chartWidth = screenWidth - 64; // Padding 16*2 + inner padding 16*2
  const chartHeight = 160;
  const paddingTop = 10;
  const paddingBottom = 24;
  const paddingLeft = 10;
  const paddingRight = 10;

  const drawWidth = chartWidth - paddingLeft - paddingRight;
  const drawHeight = chartHeight - paddingTop - paddingBottom;

  const minVal = Math.min(...data) - 20;
  const maxVal = Math.max(...data) + 20;
  const range = maxVal - minVal;

  const points = data.map((val, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * drawWidth;
    const y = paddingTop + drawHeight - ((val - minVal) / range) * drawHeight;
    return { x, y, val };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  // Điểm nối thêm để tạo Polygon fill gradient (nối xuống đáy)
  const polygonPoints = `${points[0].x},${chartHeight - paddingBottom} ${polylinePoints} ${points[points.length - 1].x},${chartHeight - paddingBottom}`;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0066CC" stopOpacity="0.25" />
          <Stop offset="1" stopColor="#0066CC" stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* X-axis labels */}
      {labels.map((label, i) => {
        const x = paddingLeft + (i / (labels.length - 1)) * drawWidth;
        return (
          <SvgText key={`x-${i}`} x={x} y={chartHeight - 4} fill="#888" fontSize={11} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}>
            {label}
          </SvgText>
        );
      })}

      {/* Gradient Area */}
      <Polygon points={polygonPoints} fill="url(#chartGradient)" />

      {/* Line */}
      <Polyline points={polylinePoints} fill="none" stroke="#0066CC" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={4.5} fill="#0066CC" />
      ))}
    </Svg>
  );
}

export default function StatsScreen() {
  const stats = mockPlayerStats;
  const [activeTab, setActiveTab] = useState<'7days' | '30days'>('30days');

  // Fake data for chart based on image
  const chartData = [1350, 1380, 1400, 1390, 1420, 1450, 1445];
  const chartLabels = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Hiện tại'];

  return (
    <View style={styles.container}>
      <Header title="Thống kê" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header ELO */}
        <View style={styles.sectionHeaderLine}>
          <Text style={styles.mainTitle}>Thống kê phong độ</Text>
          <Text style={styles.eloText}>ELO: 1,450</Text>
        </View>

        {/* Elo Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionSubTitle}>XU HƯỚNG ELO</Text>
          <View style={styles.trendRow}>
            <View style={styles.trendValueContainer}>
              <Text style={styles.trendValue}>+120</Text>
              <Ionicons name="caret-up" size={14} color="#4CAF50" style={{ marginLeft: 4, marginRight: 2 }} />
              <Text style={styles.trendPercent}>8%</Text>
            </View>
            <View style={styles.timeFilter}>
              <TouchableOpacity 
                style={[styles.filterBtn, activeTab === '7days' && styles.filterBtnActive]}
                onPress={() => setActiveTab('7days')}
              >
                <Text style={[styles.filterBtnText, activeTab === '7days' && styles.filterBtnTextActive]}>7 NGÀY</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterBtn, activeTab === '30days' && styles.filterBtnActive]}
                onPress={() => setActiveTab('30days')}
              >
                <Text style={[styles.filterBtnText, activeTab === '30days' && styles.filterBtnTextActive]}>30 NGÀY</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.chartContainer}>
            <AreaChart data={chartData} labels={chartLabels} />
          </View>
        </View>

        {/* Sports Stats */}
        <Text style={[styles.sectionSubTitle, styles.sectionMargin]}>THỐNG KÊ MÔN THỂ THAO</Text>
        
        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="tennisball-outline" size={24} color="#0057B7" style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
          <View style={styles.statMiddle}>
            <Text style={styles.statName}>Cầu lông</Text>
            <Text style={styles.statDetail}>Thắng 20 — Thua 5</Text>
          </View>
          <View style={styles.statRight}>
            <Text style={[styles.statWinRate, { color: '#0057B7' }]}>80%</Text>
            <Text style={styles.statLabel}>TỶ LỆ THẮNG</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="football-outline" size={24} color="#0057B7" />
          </View>
          <View style={styles.statMiddle}>
            <Text style={styles.statName}>Bóng đá</Text>
            <Text style={styles.statDetail}>Thắng 10 — Thua 10</Text>
          </View>
          <View style={styles.statRight}>
            <Text style={[styles.statWinRate, { color: '#1A1A1A' }]}>50%</Text>
            <Text style={styles.statLabel}>TỶ LỆ THẮNG</Text>
          </View>
        </View>

        {/* Achievements */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionSubTitle}>THÀNH TÍCH NỔI BẬT</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>XEM TẤT CẢ</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="trophy" size={20} color="#0057B7" />
          </View>
          <View style={styles.statMiddle}>
            <Text style={styles.statName}>Huy chương vàng</Text>
            <Text style={styles.statDetail}>Tournament Bán chuyên • 12/2023</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.iconBox}>
            <Ionicons name="medal" size={22} color="#0057B7" />
          </View>
          <View style={styles.statMiddle}>
            <Text style={styles.statName}>Top 3 Cầu lông công ty</Text>
            <Text style={styles.statDetail}>Corporate League Season 4</Text>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F8F3', // Nền màu kem nhạt giống thiết kế
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  eloText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
  },
  sectionSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionMargin: {
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066CC',
    letterSpacing: 0.5,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  trendValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0057B7',
  },
  trendPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  timeFilter: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 2,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  filterBtnActive: {
    backgroundColor: '#0066CC',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  filterBtnTextActive: {
    color: '#FFF',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statMiddle: {
    flex: 1,
  },
  statName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statDetail: {
    fontSize: 13,
    color: '#777',
  },
  statRight: {
    alignItems: 'flex-end',
  },
  statWinRate: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
  },
});