<script setup lang="ts">

import type { VComment } from '../types.ts';

const SUPABASE_STORAGE_BASE_URL = (import.meta.env as any).VITE_SUPABASE_PROJECT_ID ? `https://${(import.meta.env as any).VITE_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public` : '';

defineProps<{ msg: VComment, adminAvatarUrl: string, formatTime: (t: any) => string }>();
defineEmits(['reply']);

</script>

<template>
  <div class="message-row">
    <div class="avatar-circle">
      <template v-if="msg.role === 'admin'"><img :src="adminAvatarUrl" alt=""/></template>
      <template v-else>{{ msg.user_id.charAt(0).toUpperCase() }}</template>
    </div>

    <div class="message-content-area">
      <div class="message-info">
        <span v-if="msg.role === 'admin'" class="admin-label">Administrator</span>
        <span :class="['user-name']">{{ msg.user_id }}</span>
        <span class="timestamp">{{ formatTime(msg.created_at) }}</span>
      </div>

      <div class="bubble-and-actions">
        <div :class="['bubble']" @click="$emit('reply', msg)">
          <div v-if="msg.quote_id" class="quote-preview">
            <small>Reply 
              <span v-if="msg.quoted_role === 'admin'" class="admin-label">Administrator</span>
              {{ msg.quoted_user_id }}:
            </small>
            
            <p>{{ msg.quoted_content }}</p>

            <img v-if="msg.quoted_image_url" :src="SUPABASE_STORAGE_BASE_URL + msg.quoted_image_url" alt="quoted image" />
          </div>
          <p class="text">{{ msg.content }}</p>

          <img v-if="msg.image_url" :src="SUPABASE_STORAGE_BASE_URL + msg.image_url" alt="uploaded image" />
        </div>

        <button class="action-reply-btn" @click="$emit('reply', msg)">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
          </svg>
          Reply
        </button>
      </div>
    </div>
  </div>
</template>

<style>
/* styles in App.vue */
</style>
