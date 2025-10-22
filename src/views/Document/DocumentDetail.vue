<template>
  <div class="document-page">
    <h1>문서 상세 페이지 (Vue 3)</h1>
    <p>문서 ID: {{ documentId }}</p>
    <hr>
    <RealTimeEditor
      v-if="isContentLoaded"
      :initialContent="editorInitialContent"
      :documentId="documentId"
      :initial-locked-lines="lockedLinesMap"
      :user-id="userId"
    />
    <div v-else>
      문서 내용을 불러오는 중입니다...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import axios from 'axios';
import RealTimeEditor from '@/components/document/RealTimeEditor.vue';
import { disconnectStomp } from '@/services/editorStompService.js';

// data() 대신 ref/reactive 사용
const route = useRoute();
const documentId = ref(route.params.documentId);
const editorInitialContent = ref('');
const isContentLoaded = ref(false);
const lockedLinesMap = ref(new Map());
// 랜덤 사용자 ID 생성
const userId = ref('User_' + Math.floor(Math.random() * 1000));

const handleDisconnect = () => {
  if (documentId.value && userId.value) {
    disconnectStomp(documentId.value, userId.value);
  }
};

// methods 대신 const 함수 선언
const fetchDocumentLines = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/drive-service/documentLine/document/${documentId.value}/documentLines`);
    const lines = response.data.result;
    editorInitialContent.value = lines.map(line => line.content).join('');

    const locked = new Map();
    lines.forEach(line => {
      if (line.lockedBy) {
        locked.set(line.lineId, line.lockedBy);
      }
    });
    lockedLinesMap.value = locked;

    isContentLoaded.value = true;
  } catch (error) {
    console.error('문서 라인 로딩 실패:', error);
    isContentLoaded.value = true;
  }
};

// created() 훅 대신 onMounted() 사용
onMounted(async () => {
  await fetchDocumentLines();
  window.addEventListener('beforeunload', handleDisconnect);
});

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleDisconnect);
});

// 컴포넌트를 떠나기 직전에 라우터 가드가 호출됩니다.
onBeforeRouteLeave((to, from, next) => {
  handleDisconnect();
  next();
});
</script>

<style scoped>
/* 스타일은 동일하게 유지됩니다. */
.document-page {
  padding: 20px;
}
</style>
