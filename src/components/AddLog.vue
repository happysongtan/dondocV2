<script setup>
import { ref, computed, watch } from 'vue';
import { useBudgetStore } from '../stores/useBudgetStore.js';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, getCategoryIconByName } from '../api/categories.js';
import PixelIcon from './PixelIcon.vue';

const props = defineProps({
  editRecord: { type: Object, default: null },
});

const emit = defineEmits(['saved', 'cancel']);
const store = useBudgetStore();

const form = ref({
  type: 'EXPENSE',
  date: new Date().toISOString().slice(0, 10),
  categoryId: null,
  amount: '',
  description: '',
});

watch(
  () => props.editRecord,
  (rec) => {
    if (rec) {
      form.value = {
        type: rec.type,
        date: rec.date,
        categoryId: rec.categoryId ?? rec.category?.id ?? null,
        amount: rec.amount,
        description: rec.description || '',
      };
    }
  },
  { immediate: true },
);

const categories = computed(() =>
  form.value.type === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
);

watch(
  () => form.value.type,
  () => { form.value.categoryId = null; },
);

const errorMsg = ref('');

async function handleSubmit() {
  errorMsg.value = '';
  if (!form.value.categoryId) {
    errorMsg.value = '카테고리를 선택해주세요';
    return;
  }
  if (!form.value.amount || Number(form.value.amount) <= 0) {
    errorMsg.value = '금액을 올바르게 입력해주세요';
    return;
  }
  if (form.value.amount > 100000000) {
    errorMsg.value = '1억을 초과하는 금액은 입력할 수 없습니다';
    return;
  }

  const payload = {
    type: form.value.type,
    date: form.value.date,
    yearMonth: form.value.date.slice(0, 7),
    categoryId: form.value.categoryId,
    amount: Number(form.value.amount),
    description: form.value.description,
  };

  try {
    if (props.editRecord) {
      await store.updateRecord(props.editRecord.id, payload);
    } else {
      await store.addRecord(payload);
    }
    emit('saved');
  } catch (e) {
    errorMsg.value = '저장에 실패했어요. 다시 시도해주세요.';
  }
}
</script>

<template>
  <div class="add-log-overlay" @click.self="emit('cancel')">
    <div class="add-log-sheet">
      <div class="sheet-header">
        <h2>{{ editRecord ? '거래 수정' : '거래 추가' }}</h2>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="log-form">
        <!-- 타입 선택 -->
        <div class="type-tabs">
          <button
            type="button"
            class="type-tab"
            :class="{ active: form.type === 'EXPENSE' }"
            @click="form.type = 'EXPENSE'"
          >
            지출
          </button>
          <button
            type="button"
            class="type-tab"
            :class="{ active: form.type === 'INCOME' }"
            @click="form.type = 'INCOME'"
          >
            수입
          </button>
        </div>

        <!-- 날짜 -->
        <div class="form-group">
          <label>날짜</label>
          <input type="date" v-model="form.date" class="form-input" required />
        </div>

        <!-- 카테고리 -->
        <div class="form-group">
          <label>카테고리</label>
          <div class="category-grid">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              class="cat-btn"
              :class="{ selected: form.categoryId === cat.id }"
              @click="form.categoryId = cat.id"
            >
              <PixelIcon
                :icon="getCategoryIconByName(cat.name, form.type)"
                size="1.4rem"
              />
              <span>{{ cat.name }}</span>
            </button>
          </div>
        </div>

        <!-- 금액 -->
        <div class="form-group">
          <label>금액</label>
          <div class="amount-wrap">
            <input
              type="number"
              v-model="form.amount"
              class="form-input"
              placeholder="0"
              min="1"
              required
            />
            <span class="currency">원</span>
          </div>
        </div>

        <!-- 내용 -->
        <div class="form-group">
          <label>내용 <span class="optional"></span></label>
          <input
            type="text"
            v-model="form.description"
            class="form-input"
            placeholder="내용을 입력하세요"
            maxlength="50"
          />
        </div>

        <p v-if="errorMsg" class="error-msg">
          <PixelIcon icon="alert" size="1.4rem" />
          <span>{{ errorMsg }}</span>
        </p>

        <!-- 버튼 -->
        <div class="form-actions">
          <button type="button" class="btn-cancel" @click="emit('cancel')">
            취소
          </button>
          <button type="submit" class="btn-save" :disabled="store.loading">
            {{ store.loading ? '저장 중...' : editRecord ? '수정' : '추가' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.add-log-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.add-log-sheet {
  background: #fff;
  width: 100%;
  max-width: 480px;
  border-radius: 24px 24px 0 0;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.2rem;
}

.sheet-header h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
}

.close-btn {
  background: var(--bg-main);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.log-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.type-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  background: var(--bg-main);
  border-radius: 12px;
  padding: 4px;
}

.type-tab {
  border: none;
  border-radius: 10px;
  padding: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: all 0.2s;
}

.type-tab.active {
  background: #fff;
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-muted);
}

.optional {
  font-weight: 400;
  font-size: 0.75rem;
}

.form-input {
  border: 1.5px solid var(--border);
  border-radius: 12px;
  padding: 0.65rem 0.9rem;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.form-input:focus {
  border-color: var(--primary);
}

.amount-wrap {
  position: relative;
}
.amount-wrap .form-input {
  padding-right: 2.5rem;
}
.currency {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: var(--text-muted);
  pointer-events: none;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0.5rem 0.3rem;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  font-size: 0.72rem;
  color: var(--text-muted);
  transition: all 0.2s;
}

.cat-btn span:first-child {
  font-size: 1.3rem;
}

.cat-btn.selected {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

.error-msg {
  color: #e53935;
  font-size: 0.82rem;
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.form-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-cancel {
  border: 1.5px solid var(--border);
  background: #fff;
  border-radius: 14px;
  padding: 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--text-muted);
}

.btn-save {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 14px;
  padding: 0.8rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
