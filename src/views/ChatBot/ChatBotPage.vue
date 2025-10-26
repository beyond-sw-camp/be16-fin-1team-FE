<template>
  <div class="chatbot-container" aria-label="챗봇">
    <div class="chatbot-header">
      <div class="brand">
        <div class="bot-avatar"><v-icon size="20" color="#2A2828">mdi-robot-outline</v-icon></div>
        <div class="title-wrap">
          <div class="title">챗봇 오르빙</div>
          <div class="subtitle">무엇을 도와드릴까요?</div>
        </div>
      </div>
    </div>
    <div class="chatbot-body">
      <div
        v-for="(m, idx) in messages"
        :key="idx"
        :class="['bubble-row', m.role === 'user' ? 'sent' : 'received']"
      >
        <div v-if="m.type === 'typing'" class="bubble typing">
          <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        </div>
        <template v-else>
          <div class="bubble" v-html="formatMultiline(m.text)"></div>
          <div class="meta">{{ formatTime(m.time) }}</div>
        </template>
      </div>
      <div class="suggestions">
        <button class="chip" type="button">도움말</button>
      </div>
    </div>
    <div class="chatbot-footer">
      <div class="input-wrap">
        <input class="input" type="text" placeholder="메시지를 입력하세요" v-model="inputText" @keyup.enter="handleSend" />
      </div>
      <div class="footer-actions">
        <button class="send-btn" aria-label="전송" @click="handleSend">전송</button>
      </div>
    </div>
  </div>

  <!-- 캘린더 응답 상세 오버레이 (위젯 내부 전용) -->
  <div v-if="isCalendarDialogOpen" class="calendar-overlay">
    <div class="calendar-card">
      <div class="calendar-title">캘린더 일정 확인</div>
      <div v-if="calendarDetails" class="calendar-detail">
        <div class="detail-row"><span class="label">캘린더</span><span class="value">{{ calendarDetails.calendarName }}</span></div>
        <div class="detail-row"><span class="label">시작</span><span class="value">{{ calendarDetails.startedAt }}</span></div>
        <div class="detail-row"><span class="label">종료</span><span class="value">{{ calendarDetails.endedAt }}</span></div>
        <div class="detail-row" v-if="calendarDetails.calendarType !== undefined"><span class="label">유형</span><span class="value">{{ calendarDetails.calendarType ?? '-' }}</span></div>
        <div class="detail-row" v-if="calendarDetails.bookmark !== undefined"><span class="label">북마크</span><span class="value">{{ calendarDetails.bookmark ?? '-' }}</span></div>
        <div class="detail-row" v-if="calendarDetails.isShared !== undefined"><span class="label">공유</span><span class="value">{{ calendarDetails.isShared ?? '-' }}</span></div>
      </div>
      <div class="calendar-actions">
        <button class="btn" @click="isCalendarDialogOpen = false">닫기</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue';
import axios from 'axios';

const WELCOME = '안녕하세요! ORBIT의 귀염둥이 챗봇 오르빙입니다🤖 무엇을 도와드릴까요?';
const messages = ref([]);
const inputText = ref('');
const isLoading = ref(false);
const isCalendarDialogOpen = ref(false);
const calendarDetails = ref(null);

function formatTime(date) {
  if (!date) return '';
  const d = (date instanceof Date) ? date : new Date(date);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function formatMultiline(text){
  if (!text) return '';
  return String(text).replace(/\n/g, '<br/>');
}

async function handleSend() {
  const text = inputText.value.trim();
  if (!text || isLoading.value) return;
  messages.value.push({ role: 'user', text, time: new Date() });
  inputText.value = '';
  await nextTick();
  scrollToBottom();

  messages.value.push({ role: 'assistant', type: 'typing' });
  await nextTick();
  scrollToBottom();
  isLoading.value = true;
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const body = { workspaceId: 'ws_1', content: text };
    const { data } = await axios.post(`${baseURL}/workspace-service/chatbot/message`, body, {
      headers: { 'Content-Type': 'application/json' }
    });
    messages.value = messages.value.filter(m => m.type !== 'typing');
    const resultObj = (data && typeof data.result === 'object') ? data.result : null;
    if (resultObj) console.log('[chatbot] result keys =', Object.keys(resultObj), resultObj);
    const resultText = resultObj ? (resultObj.text ?? '') : (typeof data?.result === 'string' ? data.result : '');
    messages.value.push({ role: 'assistant', text: resultText, time: new Date() });
    if (resultObj && resultObj.calendarName != null && String(resultObj.calendarName).trim() !== '') {
      calendarDetails.value = resultObj;
      // 답장을 먼저 보여주고 1초 뒤 상세 모달을 띄움
      setTimeout(() => { isCalendarDialogOpen.value = true; }, 1000);
    }
  } catch (e) {
    messages.value = messages.value.filter(m => m.type !== 'typing');
    messages.value.push({ role: 'assistant', text: '잠시 후 다시 시도해 주세요.', time: new Date() });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function scrollToBottom() {
  const el = document.querySelector('.chatbot-body');
  if (el) el.scrollTop = el.scrollHeight;
}

// 초기 히스토리 불러오기
onMounted(loadHistory);
async function loadHistory() {
  try {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    const { data } = await axios.get(`${baseURL}/workspace-service/chatbot/workspaces/ws_1/chat/messages`);
    const list = Array.isArray(data?.result) ? data.result : [];
    const mapped = list.map(item => ({
      role: String(item?.type).toUpperCase() === 'USER' ? 'user' : 'assistant',
      text: normalizeContent(item?.content),
      time: new Date(),
    }));
    // 환영 문구는 가장 마지막(최신)으로 표시
    messages.value = [...mapped, { role: 'assistant', text: WELCOME, time: new Date() }];
    await nextTick();
    scrollToBottom();
  } catch (e) {
    // 실패해도 환영 문구는 유지
  }
}

function normalizeContent(content) {
  if (!content) return '';
  // BOT 응답이 문자열 JSON인 경우 text만 추출
  if (typeof content === 'string' && content.trim().startsWith('{')) {
    try {
      const obj = JSON.parse(content);
      return obj?.text ?? content;
    } catch(_) { return content; }
  }
  return content;
}
</script>

<style scoped>
.chatbot-container {
  width: 360px;
  height: 520px;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  border: 1px solid #E7E7E7;
  border-radius: 16px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.12);
  overflow: hidden;
}
.chatbot-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 12px 12px 12px 14px; border-bottom: 1px solid #F0F0F0; background: #FAFBFC; }
.brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
.bot-avatar { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: #FFE364; color: #2A2828; font-size: 18px; }
.title-wrap { min-width: 0; }
.title { font-size: 14px; font-weight: 700; color: #2A2828; }
.subtitle { font-size: 12px; color: #8B8B8B; }
.chatbot-body { flex: 1 1 auto; padding: 12px; overflow-y: auto; background: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%); }
.bubble-row { display: flex; align-items: flex-end; gap: 6px; margin-bottom: 10px; }
.bubble-row.received { justify-content: flex-start; }
.bubble-row.sent { justify-content: flex-end; }
.bubble-row .bubble { max-width: 75%; padding: 8px 10px; border-radius: 10px; font-size: 14px; line-height: 1.4; }
.bubble-row.received .bubble { background: #F1F3F4; color: #222; }
.bubble-row.sent .bubble { background: #FFE364; color: #2A2828; }
.bubble.typing { display: inline-flex; align-items: center; gap: 4px; width: auto; }
.dot { width: 6px; height: 6px; background: #9E9E9E; border-radius: 50%; display: inline-block; opacity: 0.2; animation: blink 1.2s infinite; }
.dot:nth-child(2){ animation-delay: 0.2s; }
.dot:nth-child(3){ animation-delay: 0.4s; }
@keyframes blink { 0%{ opacity: 0.2 } 50%{ opacity: 1 } 100%{ opacity: 0.2 } }
.bubble-row .meta { font-size: 11px; color: #9E9E9E; }
.suggestions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.chip { padding: 6px 10px; border-radius: 999px; border: 1px solid #E3E8EF; background: #FFF; font-size: 12px; color: #475467; cursor: pointer; }
.chip:hover { background: #F8FAFC; }
.chatbot-footer { padding: 10px; display: flex; align-items: center; gap: 8px; border-top: 1px solid #F0F0F0; background: #FFFFFF; }
.input-wrap { flex: 1 1 auto; }
.input { width: 100%; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid #E3E3E3; outline: none; background: #FFF; color: #2A2828; }
.input-wrap { flex: 1 1 auto; }
.input::placeholder { color: #9E9E9E; }
.footer-actions { display: flex; align-items: center; }
.send-btn { height: 36px; padding: 0 12px; border-radius: 10px; border: 0; background: #FFE364; color: #2A2828; font-weight: 700; cursor: pointer; }
.send-btn:hover { filter: brightness(0.98); }

.calendar-detail { display: grid; grid-template-columns: 80px 1fr; row-gap: 8px; column-gap: 12px; font-size: 14px; }
.detail-row { display: contents; }
.detail-row .label { color: #757575; }
.detail-row .value { color: #2A2828; }

/* 내부 오버레이 */
.calendar-overlay{
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: grid;
  place-items: center;
}
.calendar-card{
  width: 420px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  padding: 16px;
}
.calendar-title{ font-weight: 700; font-size: 16px; margin-bottom: 12px; }
.calendar-actions{ display: flex; justify-content: flex-end; margin-top: 12px; }
.calendar-actions .btn{ background: #FFE364; color: #2A2828; border: 0; border-radius: 10px; padding: 6px 12px; cursor: pointer; }
</style>


