<script setup lang="ts">

import type { Comment } from '../types';

defineProps<{
  currentUser: string,
  selectedFile: File | null,
  filePreviewUrl: string | null,
  quotingMsg: Comment | null,
  newMessage: string,
  isSending: boolean
}>();

defineEmits(['update:currentUser','remove-file','cancel-reply','update:newMessage','file-change','send']);

</script>

<template>
  <footer class="chat-footer">
    <div class="user-settings">
      <span class="label">Name:</span>
      <input :value="currentUser" @input="$emit('update:currentUser', ($event.target as HTMLInputElement).value)" type="text" class="text-input" />
    </div>
    <div class="input-container">
        <div class="file-upload-row">
          <div v-if="selectedFile" class="file-preview">
            <template v-if="filePreviewUrl">
              <img :src="filePreviewUrl" alt="preview" />
            </template>
            <template v-else>
              <span class="file-name">{{ selectedFile.name }}</span>
            </template>
            <button class="remove-file" @click="$emit('remove-file')">✕</button>
          </div>
        </div>
      <div v-if="quotingMsg" class="reply-bar">
        <div class="reply-bar-content">
          <span class="reply-user">Reply @{{ quotingMsg.user_id }}</span>
          <span class="reply-preview">{{ quotingMsg.content }}</span>
        </div>
        <button class="cancel-reply" @click="$emit('cancel-reply')">✕</button>
      </div>

      <div :class="['input-box', { 'has-reply': quotingMsg }]">
        <textarea :value="newMessage" @input="$emit('update:newMessage', ($event.target as HTMLTextAreaElement).value)" placeholder="Write your comment here..." @keydown.enter.exact.prevent="$emit('send')" :disabled="isSending"></textarea>
        <label class="file-label" for="file-input">
          <i class="fa-solid fa-arrow-up-from-bracket file-label-text"></i>
          <input id="file-input" type="file" @change="$emit('file-change', $event)" />
        </label>
        <button class="send-btn" :disabled="(!newMessage.trim() && !selectedFile) || isSending" @click="$emit('send')">
          <svg v-if="!isSending" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
          </svg>
          <span v-else class="sending-dots">...</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<style>
/* styles in App.vue */
</style>
