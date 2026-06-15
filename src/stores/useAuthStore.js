import { defineStore } from 'pinia';
import { ref, computed, watchEffect } from 'vue';
import { login as apiLogin, signup as apiSignup, getMe, updateMe } from '../api/auth.js';
import { setUserId } from '../api/http.js';

export const useAuthStore = defineStore(
  'auth',
  () => {
    const currentUser = ref(null);
    const isLoggedIn = computed(() => !!currentUser.value);

    watchEffect(() => {
      setUserId(currentUser.value?.id ?? null);
    });

    async function login(userId, password) {
      try {
        const res = await apiLogin(userId, password);
        const loginData = res.data.data;
        currentUser.value = loginData;
        const meRes = await getMe();
        currentUser.value = { ...loginData, ...meRes.data.data };
      } catch (e) {
        currentUser.value = null;
        throw new Error(e.response?.data?.message || '로그인에 실패했어요');
      }
    }

    async function signup(userId, password, name) {
      try {
        await apiSignup(userId, password, name);
      } catch (e) {
        throw new Error(e.response?.data?.message || '회원가입에 실패했어요');
      }
    }

    function logout() {
      currentUser.value = null;
      setUserId(null);
    }

    async function updateProfile(updates) {
      if (!currentUser.value) throw new Error('로그인 정보가 없어요');
      const res = await updateMe(updates);
      const updated = res.data.data;
      currentUser.value = { ...currentUser.value, ...updated };
      return currentUser.value;
    }

    return {
      currentUser,
      isLoggedIn,
      login,
      signup,
      logout,
      updateProfile,
    };
  },
  {
    persist: {
      pick: ['currentUser'],
    },
  },
);
