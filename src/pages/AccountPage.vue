<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useBudgetStore } from '../stores/useBudgetStore.js';
import { useCategoryStore } from '../stores/useCategoryStore.js';
import { usePigSystem } from '../composables/usePigSystem.js';
import { getCategoryIconByName } from '../api/categories.js';
import AccountHeaderBar from '../components/AccountHeaderBar.vue';
import AddLog from '../components/AddLog.vue';
import PixelIcon from '../components/PixelIcon.vue';

const store = useBudgetStore();
const categoryStore = useCategoryStore();
const { formatCurrency, formatDate } = usePigSystem();

const selectedMonth = ref(new Date().toISOString().slice(0, 7));
const filterType = ref('all');
const showAddLog = ref(false);
const editRecord = ref(null);

onMounted(() => {
  store.fetchRecords(selectedMonth.value);
  categoryStore.fetchCategories();
});
watch(selectedMonth, (month) => store.fetchRecords(month));

// 확인 삭제 모달
const deleteTarget = ref(null);

function openAdd() {
  editRecord.value = null;
  showAddLog.value = true;
}

function openEdit(record) {
  editRecord.value = record;
  showAddLog.value = true;
}

function handleSaved() {
  showAddLog.value = false;
  editRecord.value = null;
}

async function confirmDelete() {
  if (!deleteTarget.value) return;
  await store.deleteRecord(deleteTarget.value.id);
  deleteTarget.value = null;
}

// 필터된 레코드: 날짜 그룹화
const filteredRecords = computed(() => {
  return store.records.filter((r) => {
    const matchMonth = r.date.startsWith(selectedMonth.value);
    const matchType = filterType.value === 'all' || r.type === filterType.value.toUpperCase();
    return matchMonth && matchType;
  });
});

// 날짜별 그룹화
const groupedRecords = computed(() => {
  const groups = {};
  filteredRecords.value.forEach((r) => {
    if (!groups[r.date]) groups[r.date] = [];
    groups[r.date].push(r);
  });
  // 날짜 내림차순 정렬
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, records]) => ({
      date,
      records: records.sort((a, b) => (b.createdAt && a.createdAt) 
        ? new Date(b.createdAt) - new Date(a.createdAt)
        : (b.id - a.id)
      ),
      totalIncome: records
        .filter((r) => r.type === 'INCOME')
        .reduce((s, r) => s + r.amount, 0),
      totalExpense: records
        .filter((r) => r.type === 'EXPENSE')
        .reduce((s, r) => s + r.amount, 0),
    }));
});

function getCategoryName(record) {
  if (!record) return '';
  return record.category?.name ?? categoryStore.getCategoryById(record.categoryId)?.name ?? '기타';
}

function getCategoryIcon(record) {
  if (!record) return 'expense';
  return getCategoryIconByName(getCategoryName(record));
}
</script>

<template>
  <div class="account-page">
    <h1 class="page-title">
      <PixelIcon icon="nav_account" size="1.4rem" />
      <span>가계부</span>
    </h1>

    <AccountHeaderBar
      v-model:selectedMonth="selectedMonth"
      v-model:filterType="filterType"
      @addClick="openAdd"
    />

    <!-- 거래 목록 -->
    <div v-if="filteredRecords.length === 0" class="empty-state">
      <div class="empty-icon"><PixelIcon icon="clipboard" size="1.4rem" /></div>
      <p>거래 내역이 없어요</p>
      <button class="btn-primary" @click="openAdd">+ 거래 추가하기</button>
    </div>

    <div v-else class="record-groups">
      <div v-for="group in groupedRecords" :key="group.date" class="date-group">
        <div class="date-header">
          <span class="date-label">{{ formatDate(group.date) }}</span>
          <div class="date-summary">
            <span
              v-if="group.totalIncome > 0"
              class="ds-income"
              :title="'+' + formatCurrency(group.totalIncome)"
              >+{{ formatCurrency(group.totalIncome) }}</span
            >
            <span
              v-if="group.totalExpense > 0"
              class="ds-expense"
              :title="'-' + formatCurrency(group.totalExpense)"
              >-{{ formatCurrency(group.totalExpense) }}</span
            >
          </div>
        </div>

        <div class="record-card">
          <div
            v-for="record in group.records"
            :key="record.id"
            class="record-item"
          >
            <div class="record-left">
              <div class="record-icon" :class="record.type?.toLowerCase()">
                <PixelIcon
                  :icon="getCategoryIcon(record)"
                  size="1.4rem"
                />
              </div>
              <div class="record-info">
                <p class="record-category">{{ getCategoryName(record) }}</p>
                <p class="record-content">
                  {{ record.description || '내용 없음' }}
                </p>
              </div>
            </div>
            <div class="record-right">
              <span
                class="record-amount"
                :class="record.type?.toLowerCase()"
                :title="(record.type === 'INCOME' ? '+' : '-') + formatCurrency(record.amount)"
              >
                {{ record.type === 'INCOME' ? '+' : '-'
                }}{{ formatCurrency(record.amount) }}
              </span>
              <div class="record-actions">
                <button
                  class="action-btn edit"
                  @click="openEdit(record)"
                  title="수정"
                >
                  <PixelIcon icon="edit" size="1.4rem" />
                </button>
                <button
                  class="action-btn delete"
                  @click="deleteTarget = record"
                  title="삭제"
                >
                  <PixelIcon icon="trash" size="1.4rem" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- AddLog 모달 -->
    <AddLog
      v-if="showAddLog"
      :editRecord="editRecord"
      @saved="handleSaved"
      @cancel="showAddLog = false"
    />

    <!-- 삭제 확인 모달 -->
    <div
      v-if="deleteTarget"
      class="confirm-overlay"
      @click.self="deleteTarget = null"
    >
      <div class="confirm-modal">
        <p class="confirm-icon"><PixelIcon icon="trash" size="1.4rem" /></p>
        <p class="confirm-title">삭제할까요?</p>
        <p class="confirm-desc">
          <strong>{{ getCategoryName(deleteTarget) }}</strong> -
          {{ formatCurrency(deleteTarget.amount) }}<br />
          삭제하면 되돌릴 수 없어요.
        </p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deleteTarget = null">취소</button>
          <button class="btn-delete" @click="confirmDelete">삭제</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.account-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.page-title {
  font-size: 1.4rem;
  font-weight: 800;
  margin: 0 0 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

/* Record Groups */
.record-groups {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.2rem;
  gap: 1rem;
}

.date-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-muted);
  flex-shrink: 0;
}

.date-summary {
  display: flex;
  gap: 0.5rem;
  min-width: 0;
  justify-content: flex-end;
}
.ds-income,
.ds-expense {
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}
.ds-income {
  color: #43a047;
}
.ds-expense {
  color: #e53935;
}

.record-card {
  background: #fff;
  border: 1.5px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}

.record-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s;
}

.record-item:last-child {
  border-bottom: none;
}
.record-item:hover {
  background: var(--bg-main);
}

.record-left {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  flex: 1;
  min-width: 0;
}

.record-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  flex-shrink: 0;
}

.record-icon.income {
  background: #e8f5e9;
}
.record-icon.expense {
  background: #ffebee;
}

.record-info {
  flex: 1;
  min-width: 0;
}
.record-category {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.record-content {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 1rem;
  max-width: 40%;
}

.record-amount {
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: right;
}
.record-amount.income {
  color: #43a047;
}
.record-amount.expense {
  color: #e53935;
}

.record-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 4px;
  border-radius: 6px;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.action-btn:hover {
  opacity: 1;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 0;
  color: var(--text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
}

.empty-icon {
  font-size: 3rem;
}

.btn-primary {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

/* Delete Confirm Modal */
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.confirm-modal {
  background: #fff;
  border-radius: 20px;
  padding: 2rem 1.5rem;
  width: 100%;
  max-width: 300px;
  text-align: center;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.confirm-icon {
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
}
.confirm-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}
.confirm-desc {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.confirm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.btn-cancel {
  border: 1.5px solid var(--border);
  background: #fff;
  border-radius: 12px;
  padding: 0.7rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted);
}

.btn-delete {
  background: #ef5350;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 0.7rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}
</style>
