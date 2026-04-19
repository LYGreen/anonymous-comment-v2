<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue';
import HeaderBar from './components/HeaderBar.vue';
import ToastNotification from './components/ToastNotification.vue';
import MessageList from './components/MessageList.vue';
import FooterBar from './components/FooterBar.vue';

// 1. 定义评论的数据结构 (Interface)
interface Comment {
  id: number;
  user_id: string;
  content?: string;
  image_url?: string;
  quote_id: number | null;
  created_at: string;
  role: 'admin' | 'user';
}

interface VComment extends Comment { 
    quoted_user_id?: string; 
    quoted_content?: string;
    quoted_image_url?: string;
    quoted_created_at?: string;
    quoted_quoted_id?: number;
    quoted_role?: 'user' | 'admin';
}

interface AMResponse {
  status: number,
  message: string,
  data: object,
}

const CLOUDFLARE_WORKERS_URL =  (import.meta.env as any).VITE_CLOUDFLARE_WORKERS_URL;
const SUPABASE_PROJECT_ID = (import.meta.env as any).VITE_SUPABASE_PROJECT_ID;
const SUPABASE_STORAGE_BASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public`

const authStatusIcons = {
  "empty": "fa-question-circle",
  "loading": "fa-cog",
  "success": "fa-check",
  "fail": "fa-xmark"
}

let observer = new IntersectionObserver(async (entries) => {
  if (entries[0]?.isIntersecting) {
    await loadHistory();
  }
});

const authStatus = ref<'empty' | 'success' | 'fail' | 'loading'>("empty");
const authTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const adminKey = ref<string>('');
const isDark = ref<boolean>(localStorage.getItem('theme') === 'dark');
const currentUser = ref<string>(localStorage.getItem('custom_name') || '匿名用户');
const chatBox = ref<HTMLElement | null>(null);
const newMessage = ref<string>('');
const quotingMsg = ref<Comment | null>(null);
const isSending = ref<boolean>(false);
const showError = ref<boolean>(false);
const errorMessage = ref<string>('');
const vcomments = ref<VComment[]>([]);
const isLoadingHistory = ref<boolean>(false);
const hasMoreHistory = ref<boolean>(true); // 标记是否还有更多历史记录
const topTriggerRef = ref<HTMLElement | null>(null); // 获取触发器的 DOM 引用
const messageListRef = ref<any>(null);
const adminAvatarUrl = ref<string>((import.meta.env as any).VITE_ADMIN_AVATAR_URL);
// 文件上传相关
const selectedFile = ref<File | null>(null);
const filePreviewUrl = ref<string | null>(null);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 限制

const checkAuthenKey = async (): Promise<void> => {
  if (authTimeout.value) {
    clearTimeout(authTimeout.value);
  }
  if (adminKey.value.length === 0) {
    authStatus.value = 'empty';
    return;
  }
  
  authStatus.value = 'loading';

  const url = new URL('/api/token', CLOUDFLARE_WORKERS_URL);

  const controller = new AbortController();
  authTimeout.value = setTimeout(() => {
    controller.abort();
  }, 1000 * 30);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${adminKey.value}`,
    },
    signal: controller.signal
  });
  
  const json = await res.json() as AMResponse;
  
  if (json?.status === 200) {
    authStatus.value = 'success';
  } else {
    authStatus.value = 'fail';
  }

}

const toggleTheme = (): void => {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
};

watch(currentUser, (nv: string) => localStorage.setItem('custom_name', nv));

const setReply = (msg: Comment): void => {
  quotingMsg.value = msg;
};

// 新增：触发错误提示的函数
const triggerError = (msg: string) => {
  errorMessage.value = msg;
  showError.value = true;
  // 3秒后自动隐藏提示
  setTimeout(() => {
    showError.value = false;
  }, 3000);
};

// 修改：将发送函数改为异步，并加入 try...catch 处理错误
const onFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const f = input.files && input.files[0] ? input.files[0] : null;
  if (!f) return;

  if (f.size > MAX_FILE_SIZE) {
    triggerError(`文件过大，最大 ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
    input.value = '';
    return;
  }

  selectedFile.value = f;
  if (f.type.startsWith('image/')) {
    filePreviewUrl.value = URL.createObjectURL(f);
  } else {
    filePreviewUrl.value = null;
  }
};

const removeFile = () => {
  if (filePreviewUrl.value) {
    URL.revokeObjectURL(filePreviewUrl.value);
  }
  selectedFile.value = null;
  filePreviewUrl.value = null;
  // 清空 file input DOM 可能需要用户再次选择同一文件
  const fi = document.getElementById('file-input') as HTMLInputElement | null;
  if (fi) fi.value = '';
};

const sendMessage = async (): Promise<void> => {
  if (!newMessage.value.trim() && !selectedFile.value) return;
  if (isSending.value) return;

  isSending.value = true;
  const url = new URL('/api/comments', CLOUDFLARE_WORKERS_URL);

  try {
    let res: Response;

    if (selectedFile.value) {
      // 当包含文件时，使用 FormData 提交，后端需支持 multipart/form-data
      const form = new FormData();
      const payload = {
        user_id: currentUser.value,
        content: newMessage.value,
        quote_id: quotingMsg.value ? quotingMsg.value.id : null
      } as any;
      form.append('data', JSON.stringify({ data: payload }));
      form.append('file', selectedFile.value, selectedFile.value.name);

      res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminKey.value}`
        },
        body: form
      });
    } else {
      // 纯文本的原有路径
      res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminKey.value}`
        },
        body: JSON.stringify({
          data: {
            user_id: currentUser.value,
            content: newMessage.value,
            quote_id: quotingMsg.value ? quotingMsg.value.id : null
          }
        })
      });
    }

    const json = await res.json() as AMResponse;
    const comment = json.data as Comment;

    if (json?.status === 200) {
      vcomments.value.push({
        ...comment,
        quoted_user_id: quotingMsg.value?.user_id,
        quoted_content: quotingMsg.value?.content,
        quoted_image_url: quotingMsg.value?.image_url,
        quoted_created_at: quotingMsg.value?.created_at,
        quoted_role: quotingMsg.value?.role
      });

      newMessage.value = '';
      quotingMsg.value = null;
      removeFile();
      await scrollToBottom();
    } else {
      triggerError(json.message || '发送失败，请稍后再试');
    }
  } catch (err: any) {
    triggerError(err?.message || String(err) || '发送过程中发生错误');
  } finally {
    isSending.value = false;
  }
};

const scrollToBottom = async (): Promise<void> => {
  await nextTick();
  if (chatBox.value) {
    chatBox.value.scrollTop = chatBox.value.scrollHeight;
  }
};

const formatTime = (t: string | number | Date): string => {
  const d = new Date(t);
  const date = `${d.getFullYear()}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getDate().toString().padStart(2, '0')}`;
  const time = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  return `${date} ${time}`;
};

const requestComments = async (bt?: number) => {
  const url = new URL(`/api/comments${bt ? `?bt=${bt}` : ''}`, CLOUDFLARE_WORKERS_URL);
  const res = await fetch(url.toString());
  const json = await res.json() as AMResponse;
  const result = json.data as VComment[];

  vcomments.value = result;
}

// 新增加载历史记录的专属函数
const loadHistory = async () => {
  // 如果正在加载、没有更多数据、或者还没有初始数据时，不执行
  if (isLoadingHistory.value || !hasMoreHistory.value || vcomments.value.length === 0) return;

  isLoadingHistory.value = true;

  try {
    const bt = topCommentId.value;
    const url = new URL(`/api/comments?bt=${bt}`, CLOUDFLARE_WORKERS_URL);
    const res = await fetch(url.toString());
    const json = await res.json() as AMResponse;
    const oldComments = json.data as VComment[];

    if (oldComments.length === 0) {
      // 接口返回空，说明没数据了
      hasMoreHistory.value = false;
    } else {
      // ⚠️ 核心技巧：记录插入数据前的 scrollHeight
      const oldScrollHeight = chatBox.value?.scrollHeight || 0;

      // 将旧消息追加到数组头部
      vcomments.value = [...oldComments, ...vcomments.value];

      // 等待 Vue 将新数据渲染到 DOM
      await nextTick();

      // 补偿滚动高度，让用户视角停留在加载前的那条消息上
      if (chatBox.value) {
        chatBox.value.scrollTop = chatBox.value.scrollHeight - oldScrollHeight;
      }
    }
  } catch (error: any) {
    triggerError(error || '加载历史记录失败');
  } finally {
    isLoadingHistory.value = false;
  }
};

const topCommentId = computed(() => vcomments.value.length > 0 ? vcomments.value[0]?.id : undefined)

const loadImage = (url: string) => {
  return new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image load failed'));
  });
};

onMounted(async () => {
  await Promise.all([
    requestComments()
  ]);

  await Promise.all([
    loadImage(adminAvatarUrl.value),
    ...vcomments.value.map(c => c.image_url ? loadImage(SUPABASE_STORAGE_BASE_URL + c.image_url) : Promise.resolve()),
  ]);
  

  // 初始化完成后，从 MessageList 子组件读取 refs 并开始监听顶部触发器
  if (messageListRef && messageListRef.value) {
    // the child exposes refs; they may be refs to DOM elements
    const child = messageListRef.value as any;
    chatBox.value = child.box?.value ?? child.box;
    topTriggerRef.value = child.topTrigger?.value ?? child.topTrigger;

    await scrollToBottom();
  }
  if (topTriggerRef.value) {
    observer.observe(topTriggerRef.value);
  }
});

onUnmounted(() => {
  // 组件销毁时断开监听，防止内存泄漏
  if (observer) {
    observer.disconnect();
  }
});
</script>

<template>
  <div :class="['app-container', { 'dark': isDark }]">

    <ToastNotification :show="showError" :message="errorMessage" />

  <HeaderBar :adminKey="adminKey" :authStatus="authStatus" :authStatusIcons="authStatusIcons" :isDark="isDark" @check="checkAuthenKey" @update:adminKey="val => adminKey = val" @toggleTheme="toggleTheme" />

    <MessageList ref="messageListRef" :msgs="vcomments" :adminAvatarUrl="adminAvatarUrl" :formatTime="formatTime" @reply="setReply">
      <template #top-trigger>
        <i v-if="isLoadingHistory" class="fa-solid fa-spin fa-snowflake"></i>
        <span v-else-if="!hasMoreHistory" class="no-more-text">There is no earlier news.</span>
      </template>
    </MessageList>

    <FooterBar :currentUser="currentUser" :selectedFile="selectedFile" :filePreviewUrl="filePreviewUrl" :quotingMsg="quotingMsg" :newMessage="newMessage" :isSending="isSending"
      @update:currentUser="val => currentUser = val"
      @remove-file="removeFile"
      @cancel-reply="quotingMsg = null"
      @update:newMessage="val => newMessage = val"
      @file-change="onFileChange"
      @send="sendMessage"
    />

  </div>
</template>

<style>
/* 原有的样式部分保持不变... (为节省篇幅不重复列出) */
.app-container {
  --bg-app: #f8fafc;
  --bg-header: rgba(255, 255, 255, 0.9);
  --bg-bubble: #ffffff;
  --bg-my-bubble: #f0f4ff;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --accent: #4f46e5;
  --input-bg: #ffffff;

  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-app);
  color: var(--text-main);
  transition: all 0.3s;
  font-family: system-ui, sans-serif;
  position: relative;
  /* 为提示框绝对定位提供基准 */
}

.app-container.dark {
  --bg-app: #0f172a;
  --bg-header: rgba(30, 41, 59, 0.9);
  --bg-bubble: #1e293b;
  --bg-my-bubble: #2d3748;
  --text-main: #f1f5f9;
  --text-muted: #94a3b8;
  --border: #334155;
  --input-bg: #1e293b;
}

/* --- 新增：错误提示 Toast 样式 --- */
.toast-notification {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-20px);
  background-color: #ef4444;
  /* 红色警告色 */
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;
  pointer-events: none;
}

.toast-notification.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.error-icon {
  flex-shrink: 0;
}

.sending-dots {
  font-weight: bold;
  animation: blink 1.4s infinite both;
}

@keyframes blink {
  0% {
    opacity: 0.2;
  }

  20% {
    opacity: 1;
  }

  100% {
    opacity: 0.2;
  }
}

/* 包含原有剩下的样式... */
.chat-header {
  padding: 0.8rem 1.5rem;
  background: var(--bg-header);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.admin-settings {
  display: flex;
  flex: 1;
  gap: 8px;
  font-size: 16px;
  color: var(--text-muted);
  font-family: monospace;
  align-items: center;
}

.admin-settings .text-input {
  flex: 1;
}

.brand-title {
  font-weight: 800;
  margin: 16px 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.user-settings {
  align-self: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label {
  font-weight: 800;
}

.text-input {
  background: var(--input-bg);
  border: 1px solid var(--border);
  color: var(--text-main);
  padding: 4px 8px;
  border-radius: 6px;
  width: 80px;
  font-size: 12px;
}

.chat-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chat-main::-webkit-scrollbar {
  width: 4px;
}

.chat-main::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}

.top-trigger {
  display: flex;
  justify-content: center;
  padding: 10px 0; /* 加一点上下内边距 */
  min-height: 24px; /* 防止因为空内容导致高度塌陷触发连续加载 */
}

.no-more-text {
  font-size: 12px;
  color: var(--text-muted);
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.avatar-circle {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.avatar-circle img {
  border-radius: 12px;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.message-content-area {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: 85%;
}

.message-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.user-name {
  font-weight: 700;
  color: var(--text-main);
}

.timestamp {
  color: var(--text-muted);
  font-size: 11px;
}

.admin-label {
  background: #fef3c7;
  color: #d97706;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
}

.bubble-and-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bubble-and-actions img {
  margin-top: 8px;
  max-width: 320px;
  border-radius: 6px;
}

.bubble {
  padding: 12px 16px;
  background: var(--bg-bubble);
  border: 1px solid var(--border);
  border-radius: 4px 18px 18px 18px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  transition: 0.2s;
  min-width: 0;
}

.text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
  white-space: pre-wrap;
}

.action-reply-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  transition: 0.2s;
  white-space: nowrap;
}

.message-row:hover .action-reply-btn {
  opacity: 1;
}

.quote-preview {
  background: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 8px;
  border-left: 3px solid var(--accent);
  margin-bottom: 8px;
  font-size: 12px;
}

.dark .quote-preview {
  background: rgba(255, 255, 255, 0.05);
}

.quote-preview small {
  display: block;
  margin-bottom: 2px;
  opacity: 0.6;
}

.quote-preview p {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quote-preview img {
  max-width: 60px;
  border-radius: 6px;
}

.chat-footer {
  padding: 15px;
  background: var(--bg-header);
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
}

.input-container {
  flex: 1;
  min-width: 0;
}

.reply-bar {
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-bottom: none;
  border-radius: 12px 12px 0 0;
  padding: 8px 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.reply-bar-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.reply-user {
  font-size: 11px;
  font-weight: bold;
  color: var(--accent);
}

.reply-preview {
  font-size: 12px;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cancel-reply {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
}

.input-box {
  background: var(--input-bg);
  border: 1px solid var(--border);
  padding: 8px 10px 8px 16px;
  border-radius: 14px;
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.file-upload-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.file-label input[type="file"] {
  display: none;
}

.file-preview {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  padding: 6px 8px;
  border-radius: 8px;
}

.file-preview img {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.file-name {
  font-size: 12px;
  color: var(--text-muted);
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-weight: bold;
}

.input-box.has-reply {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 8px 0;
  color: var(--text-main);
  font-size: 14px;
  resize: none;
  height: 24px;
}

textarea:disabled {
  opacity: 0.7;
}

.send-btn, .file-label {
  background: var(--accent);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s;
}

.send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (max-width: 600px) {
  .chat-footer {
    flex-direction: column;
  }

  .user-settings {
    align-self: flex-start;
  }

}
</style>