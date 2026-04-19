<template>
  <div :class="['toast-notification', { 'show': show }]">
    <svg viewBox="0 0 24 24" width="20" height="20" class="error-icon">
      <path fill="currentColor"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
    {{ message }}
  </div>
</template>

<script setup lang="ts">
defineProps<{ show: boolean, message: string }>();
</script>

<style>
/* styles live in App.vue */
</style>
