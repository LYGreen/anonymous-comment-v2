<script setup lang="ts">

import { ref } from 'vue';
import MessageItem from './MessageItem.vue';
import type { VComment } from '../types';

const props = defineProps<{ msgs: VComment[], adminAvatarUrl: string, formatTime: (t:any)=>string }>();
const emit = defineEmits(['reply']);
const box = ref<HTMLElement | null>(null);
const topTrigger = ref<HTMLElement | null>(null);

// expose refs to parent via template ref
defineExpose({ box, topTrigger });

</script>

<template>
  <main class="chat-main" ref="box">
    <div class="top-trigger" ref="topTrigger">
      <slot name="top-trigger"></slot>
    </div>

    <MessageItem v-for="msg in msgs" :key="msg.id" :msg="msg" :adminAvatarUrl="adminAvatarUrl" :formatTime="formatTime" @reply="$emit('reply', $event)" />
  </main>
</template>

<style>
/* styles in App.vue */
</style>
