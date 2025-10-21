<template>
  <div class="delete-members-page">
    <!-- 헤더 -->
    <div class="page-header">
      <div class="header-content">
        <div class="back-button" @click="goBack">
          <svg width="31" height="31" viewBox="0 0 31 31" fill="none">
            <path d="M19.5 8L12 15.5L19.5 23" stroke="#2A2828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="header-title">회원 삭제</div>
        <div class="header-spacer"></div>
      </div>
    </div>

    <!-- 메인 콘텐츠: 권한그룹 페이지 스타일과 동일한 구조 -->
    <div class="page-content">
      <div class="content-container">
        <!-- 제목 섹션 -->
        <div class="title-section">
          <h1 class="main-title">회원삭제</h1>
          <p class="sub-title">워크스페이스의 회원을 삭제해주세요</p>
        </div>

        <!-- 이메일로 사용자 검색 -->
        <div class="section">
          <div class="section-heading">이메일로 사용자 검색</div>
          <div class="search-row">
            <input
              v-model="emailQuery"
              type="email"
              class="text-input"
              placeholder="이메일 주소를 입력하세요"
              @keyup.enter="searchByEmail"
            />
            <button class="primary-btn" @click="searchByEmail">검색</button>
          </div>
        </div>

        <!-- 검색 결과 -->
        <div class="section">
          <div class="section-heading">검색 결과</div>
          <div class="panel">
            <div class="cards">
              <div v-if="results.length === 0">
                <div class="card placeholder"></div>
                <div class="empty-tip">검색 결과가 없습니다.</div>
              </div>
              <div v-else>
                <div class="card" v-for="user in results" :key="user.email">
                  <div class="dot"></div>
                  <div class="user-col">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                  <button class="accent-btn" @click="addSelected(user)">추가</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 선택한 사용자 -->
        <div class="section">
          <div class="section-heading">선택한 사용자</div>
          <div class="panel">
            <div class="cards">
              <div v-if="selectedUsers.length === 0">
                <div class="card placeholder"></div>
                <div class="empty-tip">선택된 사용자가 없습니다.</div>
              </div>
              <div v-else>
                <div class="card" v-for="user in selectedUsers" :key="user.email">
                  <div class="dot"></div>
                  <div class="user-col">
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                  <button class="danger-btn" @click="removeSelected(user.email)">제거</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 버튼 섹션 -->
        <div class="button-section">
          <button class="ghost-btn" @click="goBack">취소</button>
          <button class="danger-accent-btn" @click="deleteMembers" :disabled="deleting">삭제하기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { useWorkspaceStore } from '@/stores/workspace';

export default {
  name: 'DeleteMembers',
  setup() {
    const workspaceStore = useWorkspaceStore();
    return { workspaceStore };
  },
  data() {
    return {
      emailQuery: '',
      results: [],
      selectedUsers: [],
      loading: false,
      deleting: false,
    };
  },
  mounted() {
    // 컴포넌트 마운트 시 필요한 초기화 작업
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    async searchByEmail() {
      const keyword = (this.emailQuery || '').trim();
      if (!keyword) {
        this.results = [];
        return;
      }
      try {
        this.loading = true;
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const lsUserIdRaw = localStorage.getItem('id') || '';
        const lsUserEmailRaw = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';

        const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';
        
        const response = await axios.post(
          'http://localhost:8080/workspace-service/workspace/participants/search',
          { 
            workspaceId: workspaceId,
            searchKeyword: keyword 
          },
          {
            headers: {
              'X-User-Id': lsUserIdRaw || 'user123',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          }
        );

        const normalizeUuid = (v) => String(v || '').trim().toLowerCase();
        const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

        if (response?.data?.statusCode === 200) {
          const list = response.data.result?.userInfoList || [];
          const requesterId = normalizeUuid(lsUserIdRaw);

          // 디버깅: 실제 비교값 확인 (필요 시 주석 해제)
          // console.log('requesterId:', requesterId);

          const filtered = list.filter(u => {
            const uid = normalizeUuid(u.userId);
            const notSelfById = requesterId ? uid !== requesterId : true;
            return notSelfById;
          });

          this.results = filtered.map(u => ({
            userId: u.userId,
            name: u.userName,
            email: u.userEmail || '', // 워크스페이스 내 참여자 검색에서는 이메일이 없을 수 있음
            profileImageUrl: u.profileImageUrl || '',
          }));
        } else {
          this.results = [];
        }
      } catch (e) {
        console.error('회원 검색 실패:', e);
        this.results = [];
        alert(e?.response?.data?.statusMessage || '회원 검색 중 오류가 발생했습니다.');
      } finally {
        this.loading = false;
      }
    },
    addSelected(user) {
      if (!this.selectedUsers.some(u => u.email === user.email)) {
        this.selectedUsers.push(user);
      }
      // 검색 결과에서 제거하여 중복 추가를 방지하고 UI에서 사라지게 함
      this.results = this.results.filter(u => u.email !== user.email);
    },
    removeSelected(email) {
      const removed = this.selectedUsers.find(u => u.email === email);
      this.selectedUsers = this.selectedUsers.filter(u => u.email !== email);
      if (removed && !this.results.some(u => u.email === removed.email)) {
        this.results = [removed, ...this.results];
      }
    },
    async deleteMembers() {
      if (this.selectedUsers.length === 0) {
        alert('삭제할 사용자를 선택하세요.');
        return;
      }

      const userIdList = this.selectedUsers
        .map(u => u.userId)
        .filter(Boolean);

      if (userIdList.length === 0) {
        alert('선택된 사용자에 유효한 사용자 ID가 없습니다. 검색을 통해 다시 선택해주세요.');
        return;
      }

      if (confirm(`선택한 ${this.selectedUsers.length}명의 회원을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
        try {
          this.deleting = true;
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
          const requesterId = localStorage.getItem('id') || 'user123';
          const workspaceId = this.workspaceStore.getCurrentWorkspaceId || localStorage.getItem('selectedWorkspaceId') || 'ws_1';

          const response = await axios.delete(
            `http://localhost:8080/workspace-service/workspace/${workspaceId}/participants`,
            {
              headers: {
                'X-User-Id': requesterId,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              data: {
                userIdList: userIdList
              }
            }
          );

          if (response?.data?.statusCode === 200) {
            alert('선택한 회원들이 성공적으로 삭제되었습니다.');
            this.goBack();
          } else {
            alert(response?.data?.statusMessage || '회원 삭제에 실패했습니다.');
          }
        } catch (e) {
          console.error('회원 삭제 실패:', e);
          alert(e?.response?.data?.statusMessage || '회원 삭제 중 오류가 발생했습니다.');
        } finally {
          this.deleting = false;
        }
      }
    }
  }
}
</script>

<style scoped>
/* 페이지 컨테이너 */
.delete-members-page {
  position: fixed;
  top: 83px;
  left: 280px;
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 100;
}

/* 헤더 영역 */
.page-header {
  background: #F5F5F5;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 20px 30px;
  flex-shrink: 0;
  z-index: 200;
}
.header-content { display: flex; align-items: center; gap: 20px; }
.back-button { width: 31px; height: 31px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; transition: background-color 0.2s; }
.back-button:hover { background: rgba(0, 0, 0, 0.05); }
.header-title { font-family: 'Pretendard', sans-serif; font-weight: 800; font-size: 28px; line-height: 33px; color: #1C0F0F; }
.header-spacer { flex: 1; }

/* 콘텐츠 영역 */
.page-content { flex: 1; padding: 30px; overflow-y: auto; background: #F5F5F5; }
.content-container { max-width: 1200px; margin: 0 auto; }

/* 타이틀 섹션 (권한그룹 페이지 스타일) */
.title-section { margin-bottom: 40px; }
.main-title { font-family: 'Pretendard', sans-serif; font-weight: 800; font-size: 28px; line-height: 33px; color: #1C0F0F; margin: 0 0 15px 0; text-align: left; }
.sub-title { font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 16px; line-height: 19px; color: #666666; margin: 0; text-align: left; }

/* 공통 섹션 */
.section { margin-bottom: 24px; }
.section-heading { font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 18px; line-height: 21px; color: #1C0F0F; margin-bottom: 12px; text-align: left; }

/* 검색 행 */
.search-row { display: flex; gap: 12px; max-width: 620px; }
.text-input { flex: 1; height: 42px; padding: 0 17px; background: #FFFFFF; border: 1px solid #DDDDDD; border-radius: 25px; font-family: 'Pretendard', sans-serif; font-weight: 400; font-size: 14px; line-height: 17px; color: #1C0F0F; box-sizing: border-box; }
.text-input::placeholder { color: #757575; }
.primary-btn { height: 42px; padding: 0 18px; background: #FFDD44; border: none; border-radius: 8px; font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 14px; line-height: 17px; color: #1C0F0F; cursor: pointer; }

/* 카드 리스트 */
.cards { display: flex; flex-direction: column; gap: 10px; }
.panel { background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 2px; padding: 12px; }
.card { display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 8px; padding: 12px 16px; }
.card.placeholder { height: 60px; }
.dot { width: 8px; height: 8px; background: #2A2828; border-radius: 50%; }
.user-col { display: flex; flex-direction: column; gap: 4px; flex: 1; text-align: left; }
.user-name { font-family: 'Pretendard', sans-serif; font-weight: 700; font-size: 13px; color: #1C0F0F; }
.user-email { font-family: 'Pretendard', sans-serif; font-weight: 400; font-size: 13px; color: #666666; }
.accent-btn { background: #FFDD44; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 700; font-size: 14px; color: #1C0F0F; cursor: pointer; }
.danger-btn { background: #FF0000; border: none; border-radius: 6px; padding: 8px 12px; font-weight: 700; font-size: 12px; color: #FFFFFF; cursor: pointer; }

/* 빈 상태 */
.empty-tip { color: #666666; font-size: 14px; text-align: left; padding: 4px 2px; }

/* 버튼 섹션 */
.button-section { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 24px; }
.ghost-btn { height: 36px; padding: 0 16px; background: #E0E0E0; border: none; border-radius: 8px; font-weight: 700; color: #666666; cursor: pointer; }
.danger-accent-btn { height: 36px; padding: 0 16px; background: #FF6B6B; border: none; border-radius: 8px; font-weight: 700; color: #FFFFFF; cursor: pointer; }
.danger-accent-btn:hover { background: #FF5252; }
</style>
