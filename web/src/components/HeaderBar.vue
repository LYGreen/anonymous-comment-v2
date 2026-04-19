<template>
  <header class="chat-header">
    <div class="header-left">
      <h1 class="brand-title">Anonymous Comment</h1>
      <div class="admin-settings">
        <span class="label">Admin key:</span>
        <input :value="adminKey" @input="$emit('update:adminKey', ($event.target as HTMLInputElement).value)" @change="$emit('check')" type="text" class="text-input" />
        <i :class="['fas', authStatusIcons[authStatus], { 'fa-spin': authStatus === 'loading' }]" ></i>
      </div>
    </div>

    <div class="header-right">
      <button @click="$emit('toggleTheme')" class="theme-btn">{{ isDark ? '🌙' : '☀️' }}</button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  adminKey: string,
  authStatus: 'empty' | 'success' | 'fail' | 'loading',
  authStatusIcons: Record<string, string>,
  isDark: boolean
}>();

defineEmits(['update:adminKey', 'check', 'toggleTheme']);
</script>

<style>
/* header styles are in App.vue global style */
</style>
