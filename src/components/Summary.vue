<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getSummary } from '../api/records.js';
import { getCategoryIconByName } from '../api/categories.js';
import { usePigSystem } from '../composables/usePigSystem.js';
import PixelIcon from './PixelIcon.vue';

// Chart.js 관련 임포트
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  selectedMonth: { type: String, required: true },
});

const { formatCurrency } = usePigSystem();

const activeTab = ref('total');
const summaryData = ref(null);

async function loadSummary() {
  try {
    const res = await getSummary(props.selectedMonth);
    const raw = res.data?.data ?? res.data ?? null;
    summaryData.value = Array.isArray(raw) ? (raw[0] ?? null) : raw;
  } catch (e) {
    console.error('Summary 조회 실패', e);
    summaryData.value = null;
  }
}

onMounted(loadSummary);
watch(() => props.selectedMonth, loadSummary);

const totalIncome = computed(() => summaryData.value?.totalIncome ?? 0);
const totalExpense = computed(() => summaryData.value?.totalExpense ?? 0);
const netIncome = computed(() => summaryData.value?.netIncome ?? 0);
const savingRate = computed(() => summaryData.value?.savingRate ?? 0);
const transactionCount = computed(() => summaryData.value?.transactionCount ?? 0);
const avgDailyExpense = computed(() => summaryData.value?.avgDailyExpense ?? 0);
const monthRecords = computed(() => ({ length: transactionCount.value }));

function addIcon(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const name = item.category?.name ?? item.category ?? '';
    return { ...item, category: name, icon: getCategoryIconByName(name) };
  });
}

const incomeByCat = computed(() => addIcon(summaryData.value?.incomeDetail));
const expenseByCat = computed(() => addIcon(summaryData.value?.expenseDetail));

// 차트 옵션 설정
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false, // 커스텀 레전드를 사용하므로 기본 레전드는 끔
    },
    tooltip: {
      backgroundColor: '#000000',
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${formatCurrency(value)} (${percentage}%)`;
        },
      },
    },
  },
  cutout: '70%', // 도넛 중앙의 구멍 크기
};

// 통합 차트 데이터 (수입 vs 지출)
const totalChartData = computed(() => ({
  labels: ['총 수입', '총 지출'],
  datasets: [
    {
      data: [totalIncome.value, totalExpense.value],
      backgroundColor: ['#43a047', '#e53935'],
      borderWidth: 0,
    },
  ],
}));

// 수입 차트 데이터
const incomeChartData = computed(() => ({
  labels: incomeByCat.value.map((c) => c.category),
  datasets: [
    {
      data: incomeByCat.value.map((c) => c.amount),
      backgroundColor: [
        '#1B5E20', // Deep Green
        '#388E3C', // Forest Green
        '#4CAF50', // Material Green
        '#81C784', // Light Green
        '#C8E6C9', // Pale Green
        '#004D40', // Teal Green (Dark)
        '#00796B', // Teal
        '#4DB6AC', // Light Teal
        '#A5D6A7', // Mint
        '#E8F5E9', // Off White Green
      ],
      borderWidth: 0,
    },
  ],
}));

// 지출 차트 데이터
const expenseChartData = computed(() => ({
  labels: expenseByCat.value.map((c) => c.category),
  datasets: [
    {
      data: expenseByCat.value.map((c) => c.amount),
      backgroundColor: [
        '#B71C1C', // Dark Red
        '#D32F2F', // Crimson
        '#F44336', // Bright Red
        '#E57373', // Coral
        '#FFCDD2', // Pale Red
        '#880E4F', // Wine Red
        '#C2185B', // Pink Red
        '#E91E63', // Pink
        '#F48FB1', // Light Pink
        '#FFEBEE', // Off White Red
      ],
      borderWidth: 0,
    },
  ],
}));

</script>

<template>
  <div class="summary-view">
    <!-- 탭 메뉴 -->
    <div class="tabs">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'total' }"
        @click="activeTab = 'total'"
      >
        전체 요약
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'income' }"
        @click="activeTab = 'income'"
      >
        수입 상세
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'expense' }"
        @click="activeTab = 'expense'"
      >
        지출 상세
      </button>
    </div>

    <!-- 핵심 지표 (모든 탭에서 공통 노출) -->
    <div v-if="activeTab === 'total'" class="kpi-grid">
      <div class="kpi-card">
        <p class="kpi-label" title="총 수입">총 수입</p>
        <p class="kpi-value income" :title="`+${formatCurrency(totalIncome)}`">
          +{{ formatCurrency(totalIncome) }}
        </p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label" title="총 지출">총 지출</p>
        <p
          class="kpi-value expense"
          :title="`-${formatCurrency(totalExpense)}`"
        >
          -{{ formatCurrency(totalExpense) }}
        </p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label" title="순수익">순수익</p>
        <p
          class="kpi-value"
          :class="netIncome >= 0 ? 'income' : 'expense'"
          :title="`${netIncome >= 0 ? '+' : ''}${formatCurrency(netIncome)}`"
        >
          {{ netIncome >= 0 ? '+' : '' }}{{ formatCurrency(netIncome) }}
        </p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label" title="저축률">저축률</p>
        <p
          class="kpi-value"
          :class="savingRate >= 20 ? 'income' : 'expense'"
          :title="`${savingRate}%`"
        >
          {{ savingRate }}%
        </p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label" title="거래 건수">거래 건수</p>
        <p class="kpi-value neutral" :title="`${transactionCount}건`">
          {{ transactionCount }}건
        </p>
      </div>
      <div class="kpi-card">
        <p class="kpi-label" title="일평균 지출">일평균 지출</p>
        <p class="kpi-value expense" :title="formatCurrency(avgDailyExpense)">
          {{ formatCurrency(avgDailyExpense) }}
        </p>
      </div>
    </div>

    <!-- 1. 전체 요약 탭: 통합 그래프 -->
    <div
      v-if="activeTab === 'total' && monthRecords.length > 0"
      class="chart-card"
    >
      <p class="chart-title">수지 균형</p>
      <div class="chart-container">
        <div class="chart-wrapper">
          <Doughnut
            :data="totalChartData"
            :options="chartOptions"
            style="position: relative; z-index: 2; background: transparent"
          />
          <div class="chart-center" style="position: absolute; z-index: 1">
            <span class="center-label">순수익</span>
            <span
              class="center-value"
              :class="netIncome >= 0 ? 'income' : 'expense'"
            >
              {{ netIncome >= 0 ? '+' : '' }}{{ formatCurrency(netIncome) }}
            </span>
          </div>
        </div>
        <div class="custom-legend">
          <div class="legend-row">
            <span class="legend-label">
              <PixelIcon icon="money" size="0.9rem" />
              <span>총 수입</span>
            </span>
            <span class="legend-amount income"
              >+{{ formatCurrency(totalIncome) }}</span
            >
          </div>
          <div class="legend-row">
            <span class="legend-label">
              <PixelIcon icon="expense" size="0.9rem" />
              <span>총 지출</span>
            </span>
            <span class="legend-amount expense"
              >-{{ formatCurrency(totalExpense) }}</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 수입 상세 탭 -->
    <div
      v-if="activeTab === 'income' && incomeByCat.length > 0"
      class="chart-card"
    >
      <p class="chart-title">수입 구성</p>
      <div class="chart-container">
        <div class="chart-wrapper">
          <Doughnut
            :data="incomeChartData"
            :options="chartOptions"
            style="position: relative; z-index: 2; background: transparent"
          />
          <div class="chart-center" style="position: absolute; z-index: 1">
            <span class="center-label">총 수입</span>
            <span class="center-value income"
              >+{{ formatCurrency(totalIncome) }}</span
            >
          </div>
        </div>
        <div class="custom-legend">
          <div
            v-for="cat in incomeByCat"
            :key="cat.category"
            class="legend-row"
          >
            <span class="legend-label" :title="cat.category">
              <PixelIcon :icon="cat.icon" size="0.9rem" />
              <span>{{ cat.category }}</span>
            </span>
            <span class="legend-pct">{{ cat.ratio }}%</span>
            <span class="legend-amount" :title="formatCurrency(cat.amount)">{{
              formatCurrency(cat.amount)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 지출 상세 탭 -->
    <div
      v-if="activeTab === 'expense' && expenseByCat.length > 0"
      class="chart-card"
    >
      <p class="chart-title">지출 구성</p>
      <div class="chart-container">
        <div class="chart-wrapper">
          <Doughnut
            :data="expenseChartData"
            :options="chartOptions"
            style="position: relative; z-index: 2; background: transparent"
          />
          <div class="chart-center" style="position: absolute; z-index: 1">
            <span class="center-label">총 지출</span>
            <span class="center-value expense"
              >-{{ formatCurrency(totalExpense) }}</span
            >
          </div>
        </div>
        <div class="custom-legend">
          <div
            v-for="cat in expenseByCat"
            :key="cat.category"
            class="legend-row"
          >
            <span class="legend-label" :title="cat.category">
              <PixelIcon :icon="cat.icon" size="0.9rem" />
              <span>{{ cat.category }}</span>
            </span>
            <span class="legend-pct">{{ cat.ratio }}%</span>
            <span class="legend-amount" :title="formatCurrency(cat.amount)">{{
              formatCurrency(cat.amount)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="monthRecords.length === 0" class="empty">
      <p class="empty-title">
        <PixelIcon icon="nav_stats" size="0.95rem" />
        <span>이달 데이터가 없어요</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
.summary-view {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0.5rem;
  background: #eee;
  padding: 0.3rem;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  border: none;
  background: none;
  padding: 0.6rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 9px;
  transition: all 0.2s;
}

.tab-btn.active {
  background: #fff;
  color: var(--text);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.kpi-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 14px;
  padding: 0.7rem 0.4rem;
  text-align: center;
  min-width: 0;
}

.kpi-label {
  font-size: 0.7rem;
  color: var(--text-muted);
  margin: 0 0 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-value {
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.kpi-value.income {
  color: #43a047;
}
.kpi-value.expense {
  color: #e53935;
}
.kpi-value.neutral {
  color: var(--text);
}

/* Chart Cards */
.chart-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1.2rem;
}

.chart-title {
  font-size: 1rem;
  font-weight: 800;
  margin: 0 0 1.2rem;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-wrapper {
  position: relative;
  height: 180px;
  width: 100%;
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  width: 120px;
  pointer-events: none;
}

.center-label {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.center-value {
  font-size: 0.85rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.center-value.income {
  color: #43a047;
}
.center-value.expense {
  color: #e53935;
}

/* Custom Legend */
.custom-legend {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border);
}

.legend-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.legend-label {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-pct {
  font-weight: 700;
  color: var(--text-muted);
  margin: 0 10px;
  width: 35px;
  text-align: right;
}

.legend-amount {
  font-weight: 700;
  color: var(--text);
  min-width: 80px;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend-amount.income {
  color: #43a047;
}
.legend-amount.expense {
  color: #e53935;
}

.empty {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.empty-title {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
</style>
