<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/useAuthStore.js';
import { usePigSystem } from '../composables/usePigSystem.js';
import PigPixelArt from '../components/PigPixelArt.vue';
import PigBackground from '../components/PigBackground.vue';
import PixelIcon from '../components/PixelIcon.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { PIG_LEVELS, HOUSE_LEVELS, CHARACTER_STAGES } = usePigSystem();

const activeTab = ref('pig');
const topAnchor = ref(null);
const bottomAnchor = ref(null);

const pigLevels = computed(() =>
  [...PIG_LEVELS].sort((a, b) => b.level - a.level),
);
const houseLevels = computed(() =>
  [...HOUSE_LEVELS].sort((a, b) => a.level - b.level),
);
const characterStages = computed(() =>
  [...CHARACTER_STAGES].sort((a, b) => a.stage - b.stage),
);
const isFromLogin = computed(() => route.query.source === 'login');

const PIG_RANGE_LABELS = {
  10: '0~70%',
  9: '70~80%',
  8: '80~90%',
  7: '90~100%',
  6: '100~110%',
  5: '110~120%',
  4: '120~130%',
  3: '130~140%',
  2: '140~150%',
  1: '150%+',
};

const CHARACTER_RANGE_LABELS = {
  5: '0.7x 이하',
  4: '0.7x~0.9x',
  3: '0.9x~1.1x',
  2: '1.1x~1.4x',
  1: '1.4x 초과',
};

function getPigRangeLabel(index) {
  const current = pigLevels.value[index];
  const previous = pigLevels.value[index - 1];

  if (!current) return '';
  return PIG_RANGE_LABELS[current.level] ?? '';
  if (current.maxRatio === Infinity) {
    return previous ? `${previous.maxRatio}%+` : '전체 구간';
  }
  if (!previous) {
    return `0~${current.maxRatio}%`;
  }
  return `${previous.maxRatio}~${current.maxRatio}%`;
}

function getCharacterRangeLabel(index) {
  const current = characterStages.value[index];
  const next = characterStages.value[index + 1];
  const previous = characterStages.value[index - 1];

  if (!current) return '';
  return CHARACTER_RANGE_LABELS[current.stage] ?? '';
  if (current.maxPace === Infinity) {
    return previous ? `${previous.maxPace}x+` : '1.4x 초과';
  }
  if (current.stage === 5) {
    return `${current.maxPace}x 이하`;
  }
  if (!previous) {
    return `0~${current.maxPace}x`;
  }
  return `${next.maxPace}x~${current.maxPace}x`;
}

function goNext() {
  if (window.history.length > 1 && !isFromLogin.value) {
    router.back();
    return;
  }

  // 온보딩(Setup -> Guide) 완료 후 홈으로 이동
  router.push('/');
}

function scrollToTop() {
  topAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

function scrollToBottom() {
  bottomAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'end',
  });
}
</script>

<template>
  <div class="guide-page">
    <div ref="topAnchor" class="scroll-anchor" aria-hidden="true"></div>

    <section class="guide-hero">
      <div>
        <p class="eyebrow">APP GUIDE</p>
        <h1 class="page-title">돼지와 집 변화 가이드</h1>
        <p class="page-desc">
          돼지 상태와 집 성장 단계를 탭으로 나눠서 볼 수 있어요.
        </p>
      </div>
      <button class="close-btn" @click="goNext">
        {{ isFromLogin ? '시작하기' : '닫기' }}
      </button>
    </section>

    <section class="guide-tabs">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'pig' }"
        @click="activeTab = 'pig'"
      >
        돼지 상태 가이드
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'character' }"
        @click="activeTab = 'character'"
      >
        감독관 가이드
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: activeTab === 'house' }"
        @click="activeTab = 'house'"
      >
        집 변화 가이드
      </button>
    </section>

    <section v-if="activeTab === 'pig'" class="guide-section">
      <div class="section-head">
        <h2>돼지 상태 10단계</h2>
        <p>하루 예산을 얼마나 잘 지켰는지에 따라 오늘의 돼지가 달라져요.</p>
      </div>

      <div class="pig-grid">
        <article
          v-for="(pig, index) in pigLevels"
          :key="pig.level"
          class="pig-card"
          :style="{
            '--card-bg': pig.bgColor,
            '--card-border': pig.borderColor,
            '--card-accent': pig.color,
          }"
        >
          <div class="pig-visual">
            <PigPixelArt :level="pig.level" class="pig-art" />
          </div>
          <div class="pig-copy">
            <div class="pig-topline">
              <span class="pig-level">Lv.{{ pig.level }}</span>
              <span class="pig-range">{{ getPigRangeLabel(index) }}</span>
            </div>
            <strong class="pig-label">{{ pig.label }}</strong>
            <p class="pig-message">{{ pig.message }}</p>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="activeTab === 'character'" class="guide-section">
      <div class="section-head">
        <h2>감독관 5단계</h2>
        <p>
          이번 달 소비 페이스가 예산 대비 어느 정도인지에 따라 감독관이
          달라져요.
        </p>
      </div>

      <div class="character-grid">
        <article
          v-for="(character, index) in characterStages"
          :key="character.stage"
          class="character-card"
          :class="character.effect"
        >
          <div class="character-visual">
            <img
              :src="character.image"
              :alt="character.name"
              class="character-art"
            />
          </div>
          <div class="character-copy">
            <div class="character-topline">
              <span class="character-stage">STEP {{ character.stage }}</span>
              <span class="character-range">{{
                getCharacterRangeLabel(index)
              }}</span>
            </div>
            <strong class="character-name">{{ character.name }}</strong>
            <p class="character-message">{{ character.message }}</p>
          </div>
        </article>
      </div>
    </section>

    <section v-else class="guide-section">
      <div class="section-head">
        <h2>집 성장 5단계</h2>
        <p>월 평균 소비를 안정적으로 관리하면 집도 점점 좋아져요.</p>
      </div>

      <div class="house-rule-card">
        <div class="house-rule-row upgrade">
          <span class="rule-label">업그레이드</span>
          <span class="rule-range">100% 이하</span>
          <span class="rule-desc"
            >이번 달 소비가 예산 안이면 다음 집 단계로 올라가요.</span
          >
        </div>
        <div class="house-rule-row maintain">
          <span class="rule-label">유지</span>
          <span class="rule-range">100% 초과 ~ 130% 이하</span>
          <span class="rule-desc"
            >예산을 조금 넘겨도 현재 집 단계는 유지돼요.</span
          >
        </div>
        <div class="house-rule-row downgrade">
          <span class="rule-label">다운그레이드</span>
          <span class="rule-range">130% 초과</span>
          <span class="rule-desc"
            >소비가 많이 커지면 집 단계가 한 단계 내려가요.</span
          >
        </div>
      </div>

      <div class="house-list">
        <article
          v-for="house in houseLevels"
          :key="house.level"
          class="house-card"
        >
          <div class="house-preview">
            <PigBackground :house-level="house.level" class="house-bg" />
            <div class="house-overlay">
              <span class="house-level">STEP {{ house.level }}</span>
              <PixelIcon :icon="house.emoji" size="1.8rem" class="house-icon" />
            </div>
          </div>
          <div class="house-copy">
            <strong>{{ house.name }}</strong>
          </div>
        </article>
      </div>
    </section>

    <div class="scroll-fab-group">
      <button
        class="scroll-fab"
        type="button"
        aria-label="맨 위로 이동"
        @click="scrollToTop"
      >
        UP
      </button>
      <button
        class="scroll-fab"
        type="button"
        aria-label="맨 아래로 이동"
        @click="scrollToBottom"
      >
        DN
      </button>
    </div>

    <div ref="bottomAnchor" class="scroll-anchor" aria-hidden="true"></div>
  </div>
</template>

<style scoped>
.guide-page {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.scroll-anchor {
  width: 100%;
  height: 1px;
}

.guide-hero,
.guide-section,
.guide-tabs {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 20px;
}

.guide-hero {
  padding: 1.25rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  color: var(--primary);
}

.page-title {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 900;
}

.page-desc {
  margin: 0.55rem 0 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--text-muted);
  max-width: 560px;
}

.close-btn {
  flex-shrink: 0;
  border: none;
  border-radius: 14px;
  padding: 0.8rem 1rem;
  background: var(--primary);
  color: #fff;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
}

.guide-tabs {
  padding: 0.55rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
  background: linear-gradient(180deg, #fff8fb 0%, #fff 100%);
}

.tab-btn {
  border: 1.5px solid #f3dce5;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  background: linear-gradient(180deg, #fffdfd 0%, #fff4f8 100%);
  color: #9b7d89;
  font-size: 0.86rem;
  font-weight: 800;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.tab-btn.active {
  border-color: #ffb7cc;
  background: linear-gradient(135deg, #ff84ad 0%, #ff6b9d 100%);
  color: #fff;
  box-shadow: 0 10px 18px rgba(255, 107, 157, 0.22);
  transform: translateY(-1px);
}

.guide-section {
  padding: 1.1rem;
}

.section-head {
  margin-bottom: 0.9rem;
}

.section-head h2 {
  margin: 0;
  font-size: 1rem;
}

.section-head p {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  color: var(--text-muted);
}

.pig-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.pig-card {
  background: var(--card-bg);
  border: 1.5px solid var(--card-border);
  border-radius: 18px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 10px 24px rgba(255, 107, 157, 0.08);
}

.pig-visual {
  min-height: 110px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  border-radius: 14px;
}

.pig-art {
  width: 78px;
  height: auto;
}

.pig-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.pig-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.pig-level {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: var(--card-accent);
  color: #fff;
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.pig-range {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--card-accent);
}

.pig-label {
  font-size: 0.92rem;
}

.pig-message {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.house-list {
  display: grid;
  gap: 0.85rem;
}

.house-rule-card {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 0.95rem;
}

.house-rule-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  border-radius: 16px;
  padding: 0.85rem 0.95rem;
  border: 1.5px solid var(--border);
  background: #fff;
}

.house-rule-row.upgrade {
  background: linear-gradient(180deg, #f6fff7 0%, #ffffff 100%);
  border-color: #b9dfc2;
}

.house-rule-row.maintain {
  background: linear-gradient(180deg, #fffdf7 0%, #ffffff 100%);
  border-color: #ead8ac;
}

.house-rule-row.downgrade {
  background: linear-gradient(180deg, #fff7f5 0%, #ffffff 100%);
  border-color: #f0c1b8;
}

.rule-label {
  font-size: 0.82rem;
  font-weight: 800;
}

.rule-range {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.15rem 0.55rem;
  background: rgba(0, 0, 0, 0.06);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text);
}

.rule-desc {
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.character-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;
}

.character-card {
  border: 1.5px solid var(--border);
  border-radius: 18px;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #fff;
}

.character-card.good {
  background: linear-gradient(180deg, #f6fff7 0%, #ffffff 100%);
  border-color: #b9dfc2;
}

.character-card.neutral {
  background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
  border-color: #d9d9d9;
}

.character-card.bad {
  background: linear-gradient(180deg, #fff7f5 0%, #ffffff 100%);
  border-color: #f0c1b8;
}

.character-visual {
  min-height: 130px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 14px;
}

.character-art {
  width: min(110px, 52%);
  height: auto;
  image-rendering: pixelated;
}

.character-copy {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.character-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.character-stage {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #6d4c41;
  color: #fff;
  padding: 0.2rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.character-range {
  font-size: 0.72rem;
  font-weight: 700;
  color: #6d4c41;
}

.character-name {
  font-size: 0.92rem;
}

.character-message {
  margin: 0;
  font-size: 0.76rem;
  line-height: 1.5;
  color: var(--text-muted);
}

.house-card {
  border: 1.5px solid var(--border);
  border-radius: 18px;
  overflow: hidden;
  background: #fffaf6;
  box-shadow: 0 10px 24px rgba(255, 179, 71, 0.08);
}

.house-preview {
  position: relative;
  height: 140px;
  background: linear-gradient(180deg, #fff7ea 0%, #ffe1d4 100%);
}

.house-bg {
  position: absolute;
  inset: 0;
}

.house-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.9rem;
}

.house-level {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  padding: 0.25rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #795548;
}

.house-icon {
  align-self: flex-end;
}

.house-copy {
  padding: 0.9rem 1rem 1rem;
}

.house-copy strong {
  display: block;
  font-size: 0.95rem;
}

.scroll-fab-group {
  position: fixed;
  right: max(1rem, calc((100vw - 480px) / 2 + 1rem));
  bottom: 6.2rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  z-index: 20;
}

.scroll-fab {
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 14px;
  background: var(--primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 800;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.18);
  cursor: pointer;
}

@media (max-width: 640px) {
  .guide-hero {
    flex-direction: column;
  }

  .close-btn {
    width: 100%;
  }

  .guide-tabs {
    grid-template-columns: 1fr;
  }

  .house-rule-row {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .scroll-fab-group {
    right: 1rem;
    bottom: 5.5rem;
  }
}
</style>
