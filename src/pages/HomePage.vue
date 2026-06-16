<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBudgetStore } from '../stores/useBudgetStore.js';
import { useAuthStore } from '../stores/useAuthStore.js';
import { usePigSystem } from '../composables/usePigSystem.js';
import PigPixelArt from '../components/PigPixelArt.vue';
import PigBackground from '../components/PigBackground.vue';
import PixelIcon from '../components/PixelIcon.vue';
import PixelSpeechBubble from '../components/PixelSpeechBubble.vue';

const store = useBudgetStore();
const authStore = useAuthStore();
const router = useRouter();
const { getPigStateByLevel, getHouseInfo, formatCurrency, getCharacterByLevel, getPigMessage, getCharacterGuideMessage } = usePigSystem();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

onMounted(async () => {
  await Promise.all([
    store.fetchRecords(store.currentMonth),
    store.fetchSummary(store.currentMonth),
  ]);
});

// 월별 요약 — GET /records/summary 응답
const monthlyTotalExpense = computed(() => store.summary?.totalExpense ?? 0);
const monthlyTotalIncome = computed(() => store.summary?.totalIncome ?? 0);
const monthlyNetIncome = computed(() => store.summary?.netIncome ?? 0);
const monthlyBudget = computed(() => store.summary?.monthlyBudget ?? 0);
const monthlyProgress = computed(() => store.summary?.budgetUsedPercent ?? 0);

// 말풍선 상태
const activeBubble = ref(null) // 'pig' | 'character' | null

const pigBubbleText = computed(() => getPigMessage(pigState.value.level))

const characterBubbleText = computed(() =>
  getCharacterGuideMessage(
    character.value,
    store.summary?.recommendDailyBudget ?? 0,
    store.summary?.monthlyBudget ?? 0,
  )
)

function togglePigBubble() {
  activeBubble.value = activeBubble.value === 'pig' ? null : 'pig'
}

function toggleCharacterBubble() {
  activeBubble.value = activeBubble.value === 'character' ? null : 'character'
}

function handleOutsideClick(e) {
  if (!activeBubble.value) return
  const bubble = document.querySelector('.pig-bubble, .character-bubble')
  const pigEl = document.querySelector('.pig-pixel')
  const charEl = document.querySelector('.character-overlay')
  if (
    bubble && !bubble.contains(e.target) &&
    pigEl && !pigEl.contains(e.target) &&
    charEl && !charEl.contains(e.target)
  ) {
    activeBubble.value = null
  }
}

onMounted(() => document.addEventListener('click', handleOutsideClick))
onUnmounted(() => document.removeEventListener('click', handleOutsideClick))

// UI 레벨→스타일 매핑 — API에서 받은 레벨 값으로 UI 상수만 조회
const pigState = computed(() => getPigStateByLevel(authStore.currentUser?.currentPigLevel ?? 5));

const character = computed(() => {
  const level = authStore.currentUser?.currentCharacterLevel;
  if (!level) return null;
  return getCharacterByLevel(level);
});

const pigVisualScale = computed(() => {
  const level = pigState.value.level ?? 1;
  return 0.82 + (Math.min(Math.max(level, 1), 10) - 1) * 0.04;
});

const currentHouseLevel = computed(() => authStore.currentUser?.currentHouseLevel ?? 3);
const houseInfo = computed(() => getHouseInfo(currentHouseLevel.value));

// 일별 예산 — GET /users/me 응답
const dailyBudget = computed(() => authStore.currentUser?.dailyBudget ?? 0);

const todayProgressPercent = computed(() => {
  if (!dailyBudget.value) return 0;
  return Math.round((store.todayExpense / dailyBudget.value) * 100);
});

// 오늘 거래 목록 — 표시용 정렬만 수행
const todayRecordsSorted = computed(() =>
  [...store.todayRecords].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);
</script>

<template>
  <div class="home-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">
          <PixelIcon icon="pig" size="1.4rem" />
          <span>돈독</span>
        </h1>
        <p class="page-subtitle">
          {{ authStore.currentUser?.name ?? '...' }}님의 가계부
        </p>
      </div>

      <div class="header-actions">
        <div class="house-badge" :title="houseInfo.description">
          <PixelIcon class="house-emoji" :icon="houseInfo.emoji" size="1.5rem" />
          <span class="house-name">{{ houseInfo.name }}</span>
        </div>
      </div>
    </header>

    <div v-if="store.loading" class="loading-state">
      <div class="loading-pig"><PixelIcon icon="pig" size="3.2rem" /></div>
      <p>데이터를 불러오는 중...</p>
    </div>

    <div v-else-if="store.error" class="error-card">
      <p class="title-with-icon">
        <PixelIcon icon="alert" size="1rem" />
        <span>{{ store.error }}</span>
      </p>
      <p class="error-hint">서버가 실행 중인지 확인해주세요.</p>
      <code>{{ apiBaseUrl }}</code>
    </div>

    <template v-else>
      <div
        class="pig-hero-card"
        :style="{
          '--pig-color': pigState.color,
          '--pig-bg': pigState.bgColor,
          '--pig-border': pigState.borderColor,
          '--pig-scale': pigVisualScale,
        }"
      >
        <div class="pig-meta-row">
          <span class="pig-level-chip" :style="{ background: pigState.color }">
            Lv.{{ pigState.level }}
          </span>
          <span class="pig-label" :style="{ color: pigState.color }">
            {{ pigState.label }}
          </span>
          <span class="pig-ratio-chip">
            오늘 {{ todayProgressPercent }}% 사용
          </span>
          <button
            class="guide-btn guide-btn-inline"
            type="button"
            aria-label="가이드 보기"
            @click="router.push({ name: 'Guide' })"
          >
            ?
          </button>
        </div>

        <div class="pig-display-wrap">
          <PigBackground
            :house-level="currentHouseLevel"
            :scale="pigVisualScale"
            class="pig-bg-layer"
          />

          <!-- 돼지 말풍선 -->
          <PixelSpeechBubble
            v-if="activeBubble === 'pig'"
            :text="pigBubbleText"
            tail="left"
            class="pig-bubble"
            @close="activeBubble = null"
          />

          <!-- 돼지 (클릭 가능) -->
          <PigPixelArt
            :level="pigState.level"
            class="pig-pixel"
            @click="togglePigBubble"
          />

          <!-- 캐릭터 말풍선 -->
          <PixelSpeechBubble
            v-if="activeBubble === 'character'"
            :text="characterBubbleText"
            tail="right"
            class="character-bubble"
            @close="activeBubble = null"
          />

          <!-- 캐릭터 이미지 (클릭 가능) -->
          <img
            v-if="character"
            :src="character.image"
            :alt="character.name"
            class="character-overlay"
            :class="{ active: activeBubble === 'character' }"
            @click="toggleCharacterBubble"
          />
        </div>

        <p class="pig-message">{{ pigState.message }}</p>

        <div class="progress-section">
          <div class="progress-row">
            <span class="progress-label">오늘 지출</span>
            <span class="progress-values">
              <strong :style="{ color: pigState.color }">{{
                formatCurrency(store.todayExpense)
              }}</strong>
              <span class="progress-slash">/</span>
              {{ formatCurrency(dailyBudget) }}
            </span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{
                width: todayProgressPercent + '%',
                background: pigState.color,
              }"
            />
          </div>
        </div>
      </div>

      <div class="summary-row">
        <div class="summary-card income-card">
          <p class="s-label">이번 달 수입</p>
          <p class="s-value">+{{ formatCurrency(monthlyTotalIncome) }}</p>
        </div>
        <div class="summary-card expense-card">
          <p class="s-label">이번 달 지출</p>
          <p class="s-value">-{{ formatCurrency(monthlyTotalExpense) }}</p>
        </div>
      </div>


      <div class="card">
        <div class="card-header">
          <span class="title-with-icon">
            <PixelIcon icon="calendar" size="1rem" />
            <span>{{ store.currentMonth }} 예산 현황</span>
          </span>
          <span
            class="budget-pct"
            :style="{ color: monthlyProgress > 100 ? '#EF5350' : '#66BB6A' }"
          >
            {{ monthlyProgress }}%
          </span>
        </div>
        <div class="progress-row budget-row">
          <span class="text-sm">{{ formatCurrency(monthlyTotalExpense) }}</span>
          <span class="text-sm text-muted">/ {{ formatCurrency(monthlyBudget) }}</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{
              width: monthlyProgress + '%',
              background:
                monthlyProgress > 100
                  ? '#EF5350'
                  : monthlyProgress > 80
                    ? '#FFA726'
                    : '#66BB6A',
            }"
          />
        </div>
        <p class="net-label" :class="monthlyNetIncome >= 0 ? 'positive' : 'negative'">
          순수입 {{ monthlyNetIncome >= 0 ? '+' : '' }}{{ formatCurrency(monthlyNetIncome) }}
        </p>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="title-with-icon">
            <PixelIcon icon="clipboard" size="1rem" />
            <span>오늘의 거래</span>
          </span>
          <button class="link-btn" @click="router.push('/account')">
            전체보기 →
          </button>
        </div>

        <div v-if="todayRecordsSorted.length === 0" class="empty-state">
          <p>오늘 거래 내역이 없어요.</p>
          <button class="btn-add" @click="router.push('/account')">
            + 추가하러 가기
          </button>
        </div>

        <ul v-else class="record-list">
          <li
            v-for="rec in todayRecordsSorted.slice(0, 5)"
            :key="rec.id"
            class="record-item"
          >
            <div class="record-left">
              <span class="record-dot" :class="rec.type?.toLowerCase()" />
              <div>
                <p class="record-cat">{{ rec.category?.name ?? rec.category }}</p>
                <p class="record-memo">{{ rec.description || '-' }}</p>
              </div>
            </div>
            <span class="record-amount" :class="rec.type?.toLowerCase()">
              {{ rec.type === 'INCOME' ? '+' : '-' }}{{ formatCurrency(rec.amount) }}
            </span>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.page-subtitle {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.guide-btn {
  width: 36px;
  height: 36px;
  border: 1.5px solid var(--border);
  border-radius: 50%;
  background: #fff;
  color: var(--primary);
  font-size: 1rem;
  font-weight: 900;
  cursor: pointer;
  flex-shrink: 0;
}

.guide-btn-inline {
  margin-left: auto;
  width: 28px;
  height: 28px;
  font-size: 0.82rem;
  line-height: 1;
  border-width: 1px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(255, 107, 157, 0.12);
}

.house-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0.4rem 0.8rem;
  cursor: default;
}

.house-emoji {
  line-height: 1;
}

.house-name {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
}

.pig-hero-card {
  background: var(--pig-bg, #fff0f5);
  border: 2px solid var(--pig-border, #ff6b9d);
  border-radius: 24px;
  padding: 1rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.7rem;
  transition: background 0.4s, border-color 0.4s;
}

.pig-meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: nowrap;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
}

.pig-level-chip {
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.pig-label {
  font-size: 1rem;
  font-weight: 700;
}

.pig-ratio-chip {
  background: rgba(0, 0, 0, 0.07);
  font-size: 0.72rem;
  color: var(--text-muted);
  padding: 3px 8px;
  border-radius: 20px;
  font-weight: 600;
  white-space: nowrap;
}

.pig-display-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  min-height: 230px;
  overflow: hidden;
  border-radius: 16px;
}

.pig-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.pig-pixel {
  position: relative;
  z-index: 2;
  width: min(110px, 45%);
  height: auto;
  transform-origin: center bottom;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.15));
  animation: pigFloatScale 3s ease-in-out infinite;
}

.character-overlay {
  position: absolute;
  bottom: 0;
  left: 12px;
  z-index: 3;
  width: min(80px, 30%);
  height: auto;
  object-fit: contain;
  image-rendering: pixelated;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  animation: characterFloat 3.4s ease-in-out infinite;
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
  border-radius: 4px;
}

.character-overlay.active {
  animation: characterFloatActive 3.4s ease-in-out infinite;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 6px rgba(255, 215, 0, 0.8));
}

.pig-pixel {
  cursor: pointer;
}

/* 돼지 말풍선 — 돼지 위 중앙 */
.pig-bubble {
  position: absolute;
  bottom: 110px;
  left: 50%;
  transform: translateX(-30%);
  z-index: 10;
}

/* 캐릭터 말풍선 — 캐릭터 머리 위 */
.character-bubble {
  position: absolute;
  bottom: 95px;
  left: 4px;
  z-index: 10;
}

@keyframes characterFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
}

@keyframes characterFloatActive {
  0%, 100% { transform: translateY(0px) scale(1.12); }
  50%       { transform: translateY(-10px) scale(1.12); }
}

@keyframes pigFloatScale {
  0%,
  100% {
    transform: scale(var(--pig-scale, 1)) translateY(0px);
  }
  50% {
    transform: scale(var(--pig-scale, 1)) translateY(-10px);
  }
}

.pig-message {
  font-size: 0.85rem;
  color: var(--text-muted);
  text-align: center;
  margin: 0;
  line-height: 1.5;
  max-width: 280px;
}

.progress-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.budget-row {
  margin-bottom: 6px;
}

.progress-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.progress-values {
  font-size: 0.82rem;
  color: var(--text-muted);
}

.progress-values strong {
  font-size: 0.95rem;
}

.progress-slash {
  margin: 0 4px;
}

.progress-track {
  height: 10px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.6s ease;
  min-width: 4px;
}

.summary-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.summary-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 0.9rem;
  text-align: center;
}

.income-card {
  border-left: 4px solid #66bb6a;
}

.expense-card {
  border-left: 4px solid #ef5350;
}

.s-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin: 0 0 4px;
}

.s-value {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0;
}

.income-card .s-value {
  color: #43a047;
}

.expense-card .s-value {
  color: #e53935;
}

.card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.title-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.budget-pct {
  font-weight: 700;
  font-size: 0.88rem;
}

.text-sm {
  font-size: 0.82rem;
  color: var(--text);
}

.text-muted {
  color: var(--text-muted);
}

.net-label {
  margin: 0.5rem 0 0;
  font-weight: 700;
  font-size: 0.88rem;
  text-align: right;
}

.net-label.positive {
  color: #43a047;
}

.net-label.negative {
  color: #e53935;
}

.link-btn {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.8rem;
  cursor: pointer;
  font-weight: 600;
}

.record-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0;
  border-bottom: 1px solid var(--border);
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.record-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.record-dot.income {
  background: #66bb6a;
}

.record-dot.expense {
  background: #ef5350;
}

.record-cat {
  font-size: 0.88rem;
  font-weight: 600;
  margin: 0;
}

.record-memo {
  font-size: 0.74rem;
  color: var(--text-muted);
  margin: 0;
}

.record-amount {
  font-size: 0.9rem;
  font-weight: 700;
}

.record-amount.income {
  color: #43a047;
}

.record-amount.expense {
  color: #e53935;
}

.empty-state {
  text-align: center;
  padding: 1.5rem 0;
  color: var(--text-muted);
  font-size: 0.88rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}

.btn-add {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.4rem 1.2rem;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.loading-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted);
}

.loading-pig {
  font-size: 3.5rem;
  animation: pigFloat 0.8s ease-in-out infinite;
}

.error-card {
  background: #ffebee;
  border: 1.5px solid #ef9a9a;
  border-radius: 16px;
  padding: 1.2rem;
  text-align: center;
  color: #c62828;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error-card code {
  background: #fff;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 0.8rem;
  color: #e53935;
}

.error-hint {
  font-size: 0.82rem;
  color: #e57373;
}

@media (max-width: 640px) {
  .pig-meta-row {
    flex-wrap: wrap;
    justify-content: flex-start;
  }

  .guide-btn-inline {
    margin-left: 0;
    width: 30px;
    height: 30px;
  }
}
</style>
