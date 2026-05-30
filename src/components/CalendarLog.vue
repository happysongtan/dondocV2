<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { getDetail } from '../api/records.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { usePigSystem } from '../composables/usePigSystem.js';
import PixelIcon from './PixelIcon.vue';

const props = defineProps({
  selectedMonth: { type: String, required: true },
});

const emit = defineEmits(['update:selectedMonth']);

const authStore = useAuthStore();
const { getPigState } = usePigSystem();

const records = ref([]);

async function loadRecords() {
  try {
    const res = await getDetail(props.selectedMonth);
    const detail = res.data?.data;
    records.value = Array.isArray(detail?.records) ? detail.records : (Array.isArray(detail) ? detail : (Array.isArray(res.data) ? res.data : []));
  } catch (e) {
    console.error('CalendarLog 레코드 조회 실패', e);
    records.value = [];
  }
}

onMounted(loadRecords);
watch(() => props.selectedMonth, loadRecords);

const dailyBudget = computed(() => {
  const user = authStore.currentUser;
  if (!user) return 0;
  return Math.round((user.monthlyIncome * user.targetExpenseRatio) / 100 / 30);
});

const tooltip = ref(null); // 현재 호버된 day 데이터
const tooltipPos = ref({}); // 툴팁 위치 (fixed 기준)

function showTooltip(event, day) {
  if (!day || (!day.pigState && day.income === 0 && day.expense === 0)) return;
  const rect = event.currentTarget.getBoundingClientRect();
  tooltip.value = day;
  tooltipPos.value = {
    top: rect.top - 8 + window.scrollY + 'px',
    left: rect.left + rect.width / 2 + 'px',
  };
}

function hideTooltip() {
  tooltip.value = null;
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 달력 그리드 생성
const calendarDays = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // 날짜별 지출 맵
  const expenseMap = {};
  records.value
    .filter((r) => r.type === 'EXPENSE')
    .forEach((r) => {
      expenseMap[r.date] = (expenseMap[r.date] || 0) + r.amount;
    });

  const incomeMap = {};
  records.value
    .filter((r) => r.type === 'INCOME')
    .forEach((r) => {
      incomeMap[r.date] = (incomeMap[r.date] || 0) + r.amount;
    });

  const days = [];

  // 앞 빈 칸
  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  // 실제 날짜
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${props.selectedMonth}-${String(d).padStart(2, '0')}`;
    const expense = expenseMap[dateStr] || 0;
    const income = incomeMap[dateStr] || 0;
    const pigState =
      expense > 0 ? getPigState(expense, dailyBudget.value) : null;

    const today = new Date().toISOString().slice(0, 10);
    days.push({
      day: d,
      dateStr,
      expense,
      income,
      pigState,
      isToday: dateStr === today,
    });
  }

  return days;
});

const prevMonth = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number);
  const d = new Date(year, month - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const nextMonth = computed(() => {
  const [year, month] = props.selectedMonth.split('-').map(Number);
  const d = new Date(year, month, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
});

const isCurrentMonth = computed(() => {
  return props.selectedMonth === new Date().toISOString().slice(0, 7);
});

const selectedMonthLabel = computed(() => {
  const [year, month] = props.selectedMonth.split('-');
  return `${year}년 ${parseInt(month)}월`;
});
</script>

<template>
  <div class="calendar-log">
    <div class="calendar-title">
      <button
        class="month-arrow"
        @click="emit('update:selectedMonth', prevMonth)"
      >
        이전
      </button>
      <span>{{ selectedMonthLabel }}</span>
      <button
        class="month-arrow"
        @click="emit('update:selectedMonth', nextMonth)"
        :disabled="isCurrentMonth"
      >
        다음
      </button>
    </div>

    <!-- 요일 헤더 -->
    <div class="week-header">
      <span
        v-for="d in WEEK_DAYS"
        :key="d"
        class="week-day"
        :class="{ sun: d === '일', sat: d === '토' }"
      >
        {{ d }}
      </span>
    </div>

    <!-- 날짜 그리드 -->
    <div class="day-grid">
      <div
        v-for="(day, idx) in calendarDays"
        :key="idx"
        class="day-cell"
        :class="{ empty: !day, today: day?.isToday }"
        @mouseenter="showTooltip($event, day)"
        @mouseleave="hideTooltip"
      >
        <template v-if="day">
          <span
            class="day-num"
            :class="{ sun: idx % 7 === 0, sat: idx % 7 === 6 }"
          >
            {{ day.day }}
          </span>
          <span
            class="day-pig"
            :style="{ visibility: day.pigState ? 'visible' : 'hidden' }"
          >
            <PixelIcon :icon="day.pigState?.face ?? 'pig'" size="0.85rem" />
          </span>
          <span
            class="day-income"
            :style="{ visibility: day.income > 0 ? 'visible' : 'hidden' }"
          >
            +{{ day.income.toLocaleString('ko-KR') }}
          </span>
          <span
            class="day-expense"
            :style="{ visibility: day.expense > 0 ? 'visible' : 'hidden' }"
          >
            -{{ day.expense.toLocaleString('ko-KR') }}
          </span>
        </template>
      </div>
    </div>

    <!-- 전역 툴팁 (position: fixed → overflow 영향 없음) -->
    <Teleport to="body">
      <div
        v-if="tooltip"
        class="day-tooltip-fixed"
        :style="{ top: tooltipPos.top, left: tooltipPos.left }"
      >
        <span v-if="tooltip.pigState" class="tip-pig">
          <PixelIcon :icon="tooltip.pigState.face" size="0.9rem" />
          <span>{{ tooltip.pigState.label }}</span>
        </span>
        <span v-if="tooltip.income > 0" class="tip-income"
          >수입 +{{ tooltip.income.toLocaleString('ko-KR') }}원</span
        >
        <span v-if="tooltip.expense > 0" class="tip-expense"
          >지출 -{{ tooltip.expense.toLocaleString('ko-KR') }}원</span
        >
      </div>
    </Teleport>

    <!-- 범례 -->
    <div class="legend">
      <p class="legend-title">돼지 상태 범례</p>
      <div class="legend-items">
        <span><PixelIcon icon="face_good" size="0.9rem" /> 완벽</span>
        <span><PixelIcon icon="face_good" size="0.9rem" /> 우수</span>
        <span><PixelIcon icon="face_good" size="0.9rem" /> 좋음</span>
        <span><PixelIcon icon="face_warn" size="0.9rem" /> 평범</span>
        <span><PixelIcon icon="face_warn" size="0.9rem" /> 주의</span>
        <span><PixelIcon icon="face_warn" size="0.9rem" /> 경고↑</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-log {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.calendar-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0;
}

.month-arrow {
  background: none;
  border: none;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  transition:
    background 0.15s,
    color 0.15s;
}

.month-arrow:hover:not(:disabled) {
  background: var(--primary-light);
  color: var(--primary);
}

.month-arrow:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.week-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.week-day {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  padding: 4px 0;
}
.week-day.sun {
  color: #ef5350;
}
.week-day.sat {
  color: #1e88e5;
}

.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: 64px;
  gap: 4px;
}

.day-cell {
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 2px;
  position: relative;
  overflow: hidden;
}

.day-cell:hover {
  z-index: 10;
}

.day-cell.today {
  background: var(--primary-light);
}
.day-cell.empty {
  background: transparent;
}

.day-num {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}
.day-num.sun {
  color: #ef5350;
}
.day-num.sat {
  color: #1e88e5;
}

.day-pig {
  font-size: 1.1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.day-income {
  font-size: 0.5rem;
  font-weight: 600;
  color: #1e88e5;
  text-align: center;
  line-height: 1.3;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.day-expense {
  font-size: 0.5rem;
  font-weight: 600;
  color: #e53935;
  text-align: center;
  line-height: 1.3;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 호버 툴팁 (body에 렌더링 → overflow 영향 없음) */
.day-tooltip-fixed {
  position: fixed;
  transform: translate(-50%, -100%);
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 6px 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 9999;
}

.tip-pig {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.tip-income {
  font-size: 0.75rem;
  font-weight: 600;
  color: #1e88e5;
}

.tip-expense {
  font-size: 0.75rem;
  font-weight: 600;
  color: #e53935;
}

/* Legend */
.legend {
  background: var(--bg-main);
  border-radius: 12px;
  padding: 0.8rem;
  margin-top: 0.3rem;
}

.legend-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  margin: 0 0 0.5rem;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.legend-items span {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
</style>
