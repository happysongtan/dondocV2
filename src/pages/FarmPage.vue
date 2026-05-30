<script setup>
import { computed, onMounted, ref } from "vue";
import {
  getFarms,
  createFarm as apiCreateFarm,
  getFarmDetail,
  joinFarm as apiJoinFarm,
  leaveFarm as apiLeaveFarm,
} from "../api/farms.js";
import { usePigSystem } from "../composables/usePigSystem.js";
import PigPixelArt from "../components/PigPixelArt.vue";
import PigBackground from "../components/PigBackground.vue";
import PixelIcon from "../components/PixelIcon.vue";
import farmImage from "../assets/farm.jpeg";
import farmThumb1 from "../assets/farms/farm-thumb-1.svg";
import farmThumb2 from "../assets/farms/farm-thumb-2.svg";
import farmThumb3 from "../assets/farms/farm-thumb-3.svg";
import farmThumb4 from "../assets/farms/farm-thumb-4.svg";
import farmThumb5 from "../assets/farms/farm-thumb-5.svg";

const { getPigStateByLevel, getHouseInfo } = usePigSystem();

const selectedFarmId = ref(null);
const farms = ref([]);
const farmDetail = ref(null);
const isLoading = ref(true);
const isMemberLoading = ref(false);
const isMutatingMembership = ref(false);
const isCreatingFarm = ref(false);
const errorMessage = ref("");
const showCreateModal = ref(false);
const newFarmName = ref("");

const farmList = computed(() => (Array.isArray(farms.value) ? farms.value : []));
const farmsMine = computed(() => farmList.value.filter((f) => f.joined));
const farmsNotMine = computed(() => farmList.value.filter((f) => !f.joined));
const farmMembers = computed(() => farmDetail.value?.members ?? []);
const isMyFarm = computed(() => farmDetail.value?.joined ?? false);

const FARM_THUMBS = [farmThumb1, farmThumb2, farmThumb3, farmThumb4, farmThumb5];

function getFarmCardImage(farmId) {
  const numberPart = Number(String(farmId).replace(/\D/g, ""));
  const fallbackSeed = String(farmId)
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const seed =
    Number.isFinite(numberPart) && numberPart > 0 ? numberPart : fallbackSeed;
  return FARM_THUMBS[seed % FARM_THUMBS.length];
}

function getHouseIconByLevel(level) {
  const houseLevel = Number(level) || 3;
  if (houseLevel <= 1) return "house_rock";
  if (houseLevel === 2) return "house_hut";
  if (houseLevel === 3) return "house_home";
  if (houseLevel === 4) return "house_villa";
  return "house_castle";
}

async function fetchFarms() {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const res = await getFarms();
    farms.value = Array.isArray(res.data?.data)
      ? res.data.data
      : Array.isArray(res.data)
        ? res.data
        : [];
  } catch {
    errorMessage.value = "농장 목록을 불러오지 못했어요.";
  } finally {
    isLoading.value = false;
  }
}

async function openFarm(farmId) {
  selectedFarmId.value = String(farmId);
  isMemberLoading.value = true;
  farmDetail.value = null;
  try {
    const res = await getFarmDetail(farmId);
    farmDetail.value = res.data?.data ?? res.data ?? null;
  } finally {
    isMemberLoading.value = false;
  }
}

async function closeFarm() {
  selectedFarmId.value = null;
  farmDetail.value = null;
  await fetchFarms();
}

function openCreateModal() {
  newFarmName.value = "";
  showCreateModal.value = true;
}

async function closeCreateModal() {
  showCreateModal.value = false;
  errorMessage.value = "";
}

async function submitCreateModal() {
  const farmName = newFarmName.value.trim();
  if (!farmName || isCreatingFarm.value) return;

  isCreatingFarm.value = true;
  errorMessage.value = "";
  try {
    const res = await apiCreateFarm(farmName);
    const created = res.data?.data ?? res.data;
    const createdFarmId = created?.farmId ?? created?.id;
    if (!createdFarmId) throw new Error("생성된 농장 ID를 받지 못했어요.");
    showCreateModal.value = false;
    await fetchFarms();
    await openFarm(createdFarmId);
  } catch (error) {
    const status = error?.response?.status;
    const message = String(
      error?.response?.data?.message ?? error?.message ?? "",
    ).trim();
    errorMessage.value = message
      ? message
      : status != null
        ? `농장 만들기에 실패했어요. (HTTP ${status})`
        : "농장 만들기에 실패했어요. 잠시 후 다시 시도해주세요.";
  } finally {
    isCreatingFarm.value = false;
  }
}

async function enterFarm() {
  if (!selectedFarmId.value || isMyFarm.value || isMutatingMembership.value)
    return;
  isMutatingMembership.value = true;
  try {
    await apiJoinFarm(selectedFarmId.value);
    await openFarm(selectedFarmId.value);
  } finally {
    isMutatingMembership.value = false;
  }
}

async function exitFarm() {
  if (!selectedFarmId.value || !isMyFarm.value || isMutatingMembership.value)
    return;
  isMutatingMembership.value = true;
  try {
    await apiLeaveFarm(selectedFarmId.value);
    await closeFarm();
  } finally {
    isMutatingMembership.value = false;
  }
}

onMounted(fetchFarms);
</script>

<template>
  <div class="farm-page">
    <header class="page-header">
      <h1 class="page-title">
        <PixelIcon icon="nav_farm" size="1.3rem" />
        <span>농장</span>
      </h1>
      <p class="page-subtitle">
        다른 유저 농장을 둘러보고 성장 상태를 확인해요
      </p>
    </header>

    <div class="farm-hero">
      <img :src="farmImage" alt="농장" class="farm-hero-image" />
    </div>

    <div v-if="isLoading" class="state-card">
      <PixelIcon icon="nav_farm" size="1.6rem" />
      <p>농장 목록을 불러오는 중...</p>
    </div>

    <div v-else-if="errorMessage && !selectedFarmId" class="state-card error">
      <PixelIcon icon="alert" size="1.3rem" />
      <p>{{ errorMessage }}</p>
    </div>

    <section v-else-if="!selectedFarmId" class="farm-list">
      <button class="create-farm-btn" type="button" @click="openCreateModal">
        + 농장 만들기
      </button>

      <div class="farm-section">
        <h2 class="farm-section-title">내 농장</h2>
        <button
          v-for="farm in farmsMine"
          :key="`mine-${farm.id}`"
          class="farm-card"
          type="button"
          @click="openFarm(farm.id)"
        >
          <div class="farm-illust">
            <img
              :src="getFarmCardImage(farm.id)"
              alt=""
              class="farm-thumb"
            />
          </div>
          <div class="farm-card-main">
            <p class="farm-name">{{ farm.farmName }}</p>
            <p class="farm-meta">
              <PixelIcon icon="pig" size="0.9rem" />
              <span>멤버 {{ farm.memberCount }}명</span>
            </p>
          </div>
          <span class="enter-chip">
            입장
            <PixelIcon icon="arrow_right" size="0.8rem" />
          </span>
        </button>
        <div v-if="farmsMine.length === 0" class="state-card">
          <PixelIcon icon="clipboard" size="1.4rem" />
          <p>참여 중인 농장이 없어요.</p>
        </div>
      </div>

      <div class="farm-section">
        <h2 class="farm-section-title">모든 농장</h2>
        <button
          v-for="farm in farmsNotMine"
          :key="`public-${farm.id}`"
          class="farm-card"
          type="button"
          @click="openFarm(farm.id)"
        >
          <div class="farm-illust">
            <img
              :src="getFarmCardImage(farm.id)"
              alt=""
              class="farm-thumb"
            />
          </div>
          <div class="farm-card-main">
            <p class="farm-name">{{ farm.farmName }}</p>
            <p class="farm-meta">
              <PixelIcon icon="pig" size="0.9rem" />
              <span>멤버 {{ farm.memberCount }}명</span>
            </p>
          </div>
          <span class="enter-chip">
            입장
            <PixelIcon icon="arrow_right" size="0.8rem" />
          </span>
        </button>
        <div v-if="farmsNotMine.length === 0 && farmsMine.length === 0" class="state-card">
          <PixelIcon icon="clipboard" size="1.4rem" />
          <p>등록된 농장이 없어요.</p>
        </div>
      </div>
    </section>

    <section v-else class="farm-detail">
      <div class="detail-top">
        <button class="back-btn" type="button" @click="closeFarm">
          <PixelIcon icon="arrow_right" size="0.8rem" class="back-arrow" />
          <span>목록으로</span>
        </button>
        <div class="detail-actions">
          <button
            v-if="!isMyFarm"
            class="farm-action-btn join"
            type="button"
            :disabled="isMutatingMembership"
            @click="enterFarm"
          >
            농장 가입하기
          </button>
          <button
            v-else
            class="farm-action-btn leave"
            type="button"
            :disabled="isMutatingMembership"
            @click="exitFarm"
          >
            농장 탈퇴하기
          </button>
          <div class="farm-badge">
            <PixelIcon icon="nav_farm" size="1rem" />
            <span>{{ farmDetail?.farmName }}</span>
          </div>
        </div>
      </div>

      <div v-if="isMemberLoading" class="state-card">
        <PixelIcon icon="pig" size="1.6rem" />
        <p>농장 멤버를 불러오는 중...</p>
      </div>

      <div v-else class="member-grid">
        <article
          v-for="member in farmMembers"
          :key="member.userId"
          class="member-card"
        >
          <div class="member-visual">
            <PigBackground :house-level="member.currentHouseLevel ?? 3" :scale="1.1" />
            <PigPixelArt
              :level="member.currentPigLevel ?? 5"
              class="member-pig"
            />
          </div>

          <div class="member-info">
            <p class="member-name">{{ member.name }}</p>
            <div class="member-badges">
              <span class="badge">
                <PixelIcon icon="pig" size="0.85rem" />
                <span>돼지 Lv.{{ member.currentPigLevel ?? 5 }}</span>
              </span>
              <span class="badge">
                <PixelIcon
                  :icon="getHouseIconByLevel(member.currentHouseLevel)"
                  size="0.85rem"
                />
                <span>{{ getHouseInfo(member.currentHouseLevel ?? 3).name }}</span>
              </span>
            </div>
          </div>
        </article>

        <div v-if="farmMembers.length === 0" class="state-card">
          <PixelIcon icon="clipboard" size="1.4rem" />
          <p>아직 등록된 농장 멤버가 없어요.</p>
        </div>
      </div>
    </section>

    <div
      v-if="showCreateModal && !selectedFarmId"
      class="farm-modal-overlay"
      @click.self="closeCreateModal"
    >
      <div class="farm-modal">
        <h3 class="farm-modal-title">농장 만들기</h3>
        <input
          v-model="newFarmName"
          class="farm-modal-input"
          type="text"
          maxlength="20"
          placeholder="농장 이름을 입력하세요"
        />
        <p v-if="errorMessage" class="farm-modal-error">{{ errorMessage }}</p>
        <div class="farm-modal-actions">
          <button
            class="farm-modal-btn cancel"
            type="button"
            @click="closeCreateModal"
          >
            취소
          </button>
          <button
            class="farm-modal-btn create"
            type="button"
            :disabled="!newFarmName.trim() || isCreatingFarm"
            @click="submitCreateModal"
          >
            {{ isCreatingFarm ? "생성 중..." : "만들기" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.farm-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.page-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.page-subtitle {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.farm-list,
.farm-detail {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.create-farm-btn {
  border: 1.5px dashed #ffb4cf;
  background: #fff2f8;
  color: var(--primary);
  border-radius: 14px;
  padding: 0.7rem 0.9rem;
  font-size: 0.84rem;
  font-weight: 800;
}

.farm-section {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.farm-section-title {
  font-size: 0.84rem;
  color: var(--text-muted);
  font-weight: 700;
  margin: 0 0.1rem;
}

.farm-hero {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
}

.farm-hero-image {
  display: block;
  width: 100%;
  height: 130px;
  object-fit: cover;
}

.state-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1.15rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  text-align: center;
}

.state-card.error {
  border-color: #ffd5d5;
  background: #fff7f7;
  color: #dc5b5b;
}

.farm-card {
  width: 100%;
  border: 1.5px solid var(--border);
  background: linear-gradient(145deg, #ffffff 0%, #fff8ea 100%);
  border-radius: 18px;
  padding: 0.8rem 0.9rem;
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.65rem;
  text-align: left;
  transition:
    transform 0.16s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.farm-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 14px rgba(255, 179, 71, 0.15);
  border-color: #ffd7a5;
}

.farm-illust {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  border: 1px solid #ffe0bb;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.farm-thumb {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.farm-card-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.farm-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.farm-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.enter-chip {
  border: 1px solid #ffd6e5;
  background: #fff4f9;
  color: var(--primary);
  border-radius: 999px;
  padding: 0.22rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.detail-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.farm-action-btn {
  border-radius: 10px;
  border: 1.5px solid transparent;
  padding: 0.35rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
}

.farm-action-btn.join {
  background: #ecfff0;
  border-color: #bce8c5;
  color: #2e7d32;
}

.farm-action-btn.leave {
  background: #fff3f3;
  border-color: #ffd2d2;
  color: #c62828;
}

.farm-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.back-btn {
  border: 1.5px solid var(--border);
  background: #fff;
  border-radius: 10px;
  height: 32px;
  padding: 0 0.65rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
}

.back-arrow {
  transform: rotate(180deg);
}

.farm-badge {
  border: 1.5px solid #ffd7a5;
  background: #fff3df;
  border-radius: 10px;
  padding: 0.38rem 0.65rem;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: #b96915;
}

.member-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.member-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.member-visual {
  position: relative;
  height: 152px;
  background: #fff8ed;
}

.member-visual :deep(.pig-background) {
  position: absolute;
  inset: 0;
}

.member-pig {
  position: absolute;
  left: 50%;
  bottom: 12px;
  width: 62px;
  transform: translateX(-50%) translateY(0);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.16));
  animation: farmPigFloat 3s ease-in-out infinite;
}

.member-card:nth-child(2n) .member-pig {
  animation-delay: 0.35s;
}

.member-card:nth-child(3n) .member-pig {
  animation-delay: 0.7s;
}

@keyframes farmPigFloat {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  50% {
    transform: translateX(-50%) translateY(-8px) scale(1.03);
  }
}

.member-info {
  padding: 0.8rem 0.85rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.48rem;
}

.member-name {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text);
}

.member-badges {
  display: flex;
  align-items: center;
  gap: 0.38rem;
  flex-wrap: wrap;
}

.badge {
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-main);
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.44rem;
  display: inline-flex;
  align-items: center;
  gap: 0.23rem;
}

.farm-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 220;
  padding: 1rem;
}

.farm-modal {
  width: min(100%, 340px);
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.farm-modal-title {
  font-size: 0.95rem;
  font-weight: 800;
}

.farm-modal-input {
  width: 100%;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  height: 38px;
  padding: 0 0.75rem;
  font-size: 0.82rem;
}

.farm-modal-error {
  font-size: 0.78rem;
  color: #e53935;
  margin: 0;
}

.farm-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
}

.farm-modal-btn {
  border-radius: 10px;
  border: 1.5px solid var(--border);
  height: 34px;
  padding: 0 0.8rem;
  font-size: 0.78rem;
  font-weight: 700;
  background: #fff;
}

.farm-modal-btn.create {
  border-color: #ffbed7;
  background: #fff1f7;
  color: var(--primary);
}

.farm-modal-btn.create:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
</style>
