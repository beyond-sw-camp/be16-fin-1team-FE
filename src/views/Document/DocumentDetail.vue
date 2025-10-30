<template>
  <div class="document-page">
    <hr>
    <RealTimeEditor
      v-if="isContentLoaded"
      :initialContent="editorInitialContent"
      :documentId="documentId"
      :initial-locked-lines="lockedLinesMap"
      :user-id="userId"
      :user-name="userName"
      :profile-image="profileImage"
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
import driveService from '@/services/driveService';

// data() 대신 ref/reactive 사용
const route = useRoute();
const documentId = ref(route.params.documentId);
const editorInitialContent = ref('');
const isContentLoaded = ref(false);
const lockedLinesMap = ref(new Map());
const documentTitle = ref('문서 로딩 중...');
// 사용자 정보
const userId = ref('');
const userName = ref('');
const profileImage = ref('');

const handleDisconnect = () => {
  if (documentId.value && userId.value) {
    disconnectStomp(documentId.value, userId.value);
  }
};

// methods 대신 const 함수 선언
const fetchUserInfo = async () => {
  try {
    const localUserId = localStorage.getItem('id');
    const token = localStorage.getItem('accessToken');
    
    const response = await axios.get('http://localhost:8080/drive-service/documentLine/userInfo', {
      headers: {
        'X-User-Id': localUserId,
        'Authorization': `Bearer ${token}`
      }
    });
    
    const userInfo = response.data.result;
    userId.value = userInfo.userId;
    userName.value = userInfo.userName;
    profileImage.value = userInfo.profileImage;
    
    console.log('사용자 정보 로드 성공:', userInfo);
  } catch (error) {
    console.error('사용자 정보 로드 실패:', error);
    // 실패 시 localStorage에서 fallback
    userId.value = localStorage.getItem('id') || 'Guest';
    userName.value = localStorage.getItem('name') || '게스트';
  }
};

const fetchDocumentInfo = async () => {
  try {
    const response = await driveService.getDocument(documentId.value);
    if (response.result) {
      documentTitle.value = response.result.name || '제목 없음';
    }
  } catch (error) {
    console.error('문서 정보 로딩 실패:', error);
    documentTitle.value = '제목 없음';
  }
};

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
  await fetchUserInfo();
  await fetchDocumentInfo();
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
