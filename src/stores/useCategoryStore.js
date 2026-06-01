import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getCategories } from '../api/categories.js';

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([]);
  const loaded = ref(false);

  async function fetchCategories() {
    if (loaded.value) return;
    try {
      const res = await getCategories();
      categories.value = res.data?.data ?? res.data ?? [];
      loaded.value = true;
    } catch (e) {
      console.error('카테고리 조회 실패', e);
    }
  }

  const incomeCategories = computed(() =>
    categories.value.filter((c) => c.type === 'INCOME'),
  );
  const expenseCategories = computed(() =>
    categories.value.filter((c) => c.type === 'EXPENSE'),
  );

  function getCategoryById(id) {
    return categories.value.find((c) => c.id === Number(id)) ?? null;
  }

  return {
    categories,
    loaded,
    incomeCategories,
    expenseCategories,
    fetchCategories,
    getCategoryById,
  };
});
