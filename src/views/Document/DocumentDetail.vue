<template>
  <div class="document-page">
    <h1>문서 상세 페이지 (Vue 3)</h1>
    <p>문서 ID: {{ documentId }}</p>
    <hr>
    <RealTimeEditor
      v-if="isContentLoaded"
      :initialContent="editorInitialContent"
      :documentId="documentId"
      @document-line-created="handleDocumentLineCreation"
    />
    <div v-else>
      문서 내용을 불러오는 중입니다...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import RealTimeEditor from '@/components/document/RealTimeEditor.vue';

// data() 대신 ref/reactive 사용
const route = useRoute();
const documentId = ref(route.params.documentId);
const editorInitialContent = ref('');
const isContentLoaded = ref(false);

// methods 대신 const 함수 선언
const fetchDocumentLines = async () => {
  try {
    const response = await axios.get(`http://localhost:8080/drive-service/documentLine/document/${documentId.value}/documentLines`);
    const lines = response.data.result;
    editorInitialContent.value = lines.map(line => line.content).join('');
    isContentLoaded.value = true;
  } catch (error) {
    console.error('문서 라인 로딩 실패:', error);
    isContentLoaded.value = true;
  }
};

const handleDocumentLineCreation = async (lineData) => {
  console.log('[Payload Debug] Event data received from RealTimeEditor:', lineData);

  const payload = {
    documentId: documentId.value,
    lineId: lineData.lineId,
    content: lineData.htmlContent,
    prevLineId: lineData.prevLineId,
  };

  console.log('[Payload Debug] Payload to be sent to server:', payload);

  try {
    await axios.post('http://localhost:8080/drive-service/documentLine', payload);
    console.log('새 문서 라인이 성공적으로 저장되었습니다:', payload.lineId);
  } catch (error) {
    console.error('문서 라인 저장 실패:', error);
  }
};

// created() 훅 대신 onMounted() 사용
onMounted(async () => {
  await fetchDocumentLines();
});
</script>

<style scoped>
/* 스타일은 동일하게 유지됩니다. */
.document-page {
  padding: 20px;
}
</style>
