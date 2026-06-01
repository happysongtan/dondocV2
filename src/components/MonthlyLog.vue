<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { getClosing } from '../api/records.js'
import { getCategoryIconByName } from '../api/categories.js'
import { usePigSystem } from '../composables/usePigSystem.js'
import PixelIcon from './PixelIcon.vue'

const props = defineProps({
  selectedMonth: { type: String, required: true },
})

const { getPigStateByLevel, getHouseInfo, formatCurrency } = usePigSystem()

const closingData = ref(null)

async function loadClosing() {
  try {
    const res = await getClosing(props.selectedMonth)
    const raw = res.data?.data ?? res.data ?? null
    closingData.value = Array.isArray(raw) ? (raw[0] ?? null) : raw
  } catch (e) {
    console.error('MonthlyLog 결산 조회 실패', e)
    closingData.value = null
  }
}

onMounted(loadClosing)
watch(() => props.selectedMonth, loadClosing)

const monthIncome = computed(() => closingData.value?.monthIncome ?? 0)
const monthExpense = computed(() => closingData.value?.monthExpense ?? 0)
const netIncome = computed(() => closingData.value?.netIncome ?? (monthIncome.value - monthExpense.value))
const avgExpenseRatio = computed(() => closingData.value?.avgExpenseRatio ?? 0)
const avgPigState = computed(() => getPigStateByLevel(closingData.value?.avgPigLevel ?? 7))

const currentHouseLevel = computed(() => closingData.value?.currentHouseLevel ?? 3)
const nextHouseLevel = computed(() => closingData.value?.nextHouseLevel ?? currentHouseLevel.value)
const currentHouse = computed(() => getHouseInfo(currentHouseLevel.value))
const nextHouse = computed(() => getHouseInfo(nextHouseLevel.value))

const willUpgrade = computed(() => nextHouseLevel.value > currentHouseLevel.value)
const willDowngrade = computed(() => nextHouseLevel.value < currentHouseLevel.value)

const categoryExpenses = computed(() => {
  const items = closingData.value?.categoryExpenses
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    const name = item.category?.name ?? item.category ?? ''
    return { category: name, amount: item.amount, ratio: item.ratio, icon: getCategoryIconByName(name) }
  })
})

const isCurrentMonth = computed(() => {
  const now = new Date().toISOString().slice(0, 7)
  return props.selectedMonth === now
})
</script>

<template>
  <div class="monthly-log">
    <!-- 월간 요약 -->
    <div class="month-summary-card">
      <div class="avg-pig">
        <PixelIcon class="avg-pig-face" :icon="avgPigState.face" size="2rem" />
        <div>
          <p class="avg-pig-label" :style="{ color: avgPigState.color }">
            월평균 {{ avgPigState.label }}
          </p>
          <p class="avg-pig-ratio">
            예산 대비 <strong :style="{ color: avgPigState.color }">{{ avgExpenseRatio }}%</strong> 사용
          </p>
        </div>
      </div>

      <div class="month-nums">
        <div class="month-num-row">
          <span class="mn-label">총 수입</span>
          <span class="mn-value income">+{{ formatCurrency(monthIncome) }}</span>
        </div>
        <div class="month-num-row">
          <span class="mn-label">총 지출</span>
          <span class="mn-value expense">-{{ formatCurrency(monthExpense) }}</span>
        </div>
        <div class="month-num-row total">
          <span class="mn-label">순수익</span>
          <span
            class="mn-value"
            :class="netIncome >= 0 ? 'income' : 'expense'"
          >
            {{ netIncome >= 0 ? '+' : '' }}{{ formatCurrency(netIncome) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 집 업그레이드 예상 -->
    <div class="house-card">
      <p class="house-card-title">
        <PixelIcon icon="house" size="0.95rem" />
        <span>집 업그레이드 현황</span>
      </p>
      <div class="house-status">
        <div class="house-current">
          <PixelIcon class="house-emoji" :icon="currentHouse.emoji" size="1.8rem" />
          <span class="house-name">{{ currentHouse.name }}</span>
          <span class="house-tag current">현재</span>
        </div>
        <div class="house-arrow">
          <span v-if="willUpgrade" class="arrow up">
            <PixelIcon icon="arrow_up" size="1rem" />
          </span>
          <span v-else-if="willDowngrade" class="arrow down">
            <PixelIcon icon="arrow_down" size="1rem" />
          </span>
          <span v-else class="arrow same">
            <PixelIcon icon="arrow_right" size="1rem" />
          </span>
        </div>
        <div class="house-next">
          <PixelIcon class="house-emoji" :icon="nextHouse.emoji" size="1.8rem" />
          <span class="house-name">{{ nextHouse.name }}</span>
          <span
            class="house-tag"
            :class="willUpgrade ? 'upgrade' : willDowngrade ? 'downgrade' : 'maintain'"
          >
            {{ willUpgrade ? '업그레이드' : willDowngrade ? '다운그레이드' : '유지' }}
          </span>
        </div>
      </div>
      <p class="house-hint">
        <span v-if="isCurrentMonth">
          {{ willUpgrade ? '이달 목표를 달성하면 집이 업그레이드돼요!' : willDowngrade ? '지출을 줄여 집을 유지하세요!' : '현재 집을 유지할 수 있어요!' }}
        </span>
        <span v-else>{{ selectedMonth }} 결산 기준</span>
      </p>
    </div>

    <!-- 카테고리별 지출 -->
    <div v-if="categoryExpenses.length > 0" class="category-card">
      <p class="cat-title">카테고리별 지출</p>
      <div class="cat-list">
        <div v-for="cat in categoryExpenses" :key="cat.category" class="cat-item">
          <div class="cat-left">
            <PixelIcon class="cat-icon" :icon="cat.icon" size="1rem" />
            <span class="cat-name">{{ cat.category }}</span>
          </div>
          <div class="cat-right">
            <div class="cat-bar-wrap">
              <div
                class="cat-bar"
                :style="{ width: cat.ratio + '%' }"
              ></div>
            </div>
            <span class="cat-amount">{{ formatCurrency(cat.amount) }}</span>
            <span class="cat-ratio">{{ cat.ratio }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.monthly-log { display: flex; flex-direction: column; gap: 1rem; }

/* Month Summary */
.month-summary-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.avg-pig {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.avg-pig-face { line-height: 1; }

.avg-pig-label { font-size: 0.95rem; font-weight: 700; margin: 0; }
.avg-pig-ratio { font-size: 0.82rem; color: var(--text-muted); margin: 0; }

.month-nums { display: flex; flex-direction: column; gap: 0.4rem; }

.month-num-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.88rem;
}

.month-num-row:last-child { border-bottom: none; }
.month-num-row.total { font-weight: 700; }

.mn-label { color: var(--text-muted); }
.mn-value { font-weight: 700; }
.mn-value.income { color: #43A047; }
.mn-value.expense { color: #E53935; }

/* House Card */
.house-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
}

.house-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.house-status {
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 0.8rem;
}

.house-current, .house-next {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.house-name { font-size: 0.82rem; font-weight: 700; }
.house-tag {
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 8px;
  font-weight: 700;
}
.house-tag.current { background: #E3F2FD; color: #1565C0; }
.house-tag.upgrade { background: #E8F5E9; color: #2E7D32; }
.house-tag.downgrade { background: #FFEBEE; color: #C62828; }
.house-tag.maintain { background: #F5F5F5; color: #616161; }

.house-arrow { font-size: 1.5rem; }

.house-hint {
  font-size: 0.8rem;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
}

/* Category Card */
.category-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
}

.cat-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin: 0 0 0.8rem;
}

.cat-list { display: flex; flex-direction: column; gap: 0.7rem; }

.cat-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.cat-left {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 90px;
  flex-shrink: 0;
}

.cat-icon { flex-shrink: 0; }
.cat-name { font-size: 0.8rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.cat-right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cat-bar-wrap {
  flex: 1;
  height: 8px;
  background: var(--bg-main);
  border-radius: 99px;
  overflow: hidden;
}

.cat-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 99px;
  transition: width 0.5s ease;
  min-width: 4px;
}

.cat-amount { font-size: 0.75rem; font-weight: 600; color: #E53935; white-space: nowrap; }
.cat-ratio { font-size: 0.72rem; color: var(--text-muted); width: 30px; text-align: right; }
</style>
