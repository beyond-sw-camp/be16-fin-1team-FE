<template>
  <v-app>
    <SideBarComponent v-if="!hideLayout" />
    <HeaderComponent v-if="!hideLayout" />
    <v-main :class="hideLayout ? 'no-offset' : 'with-offset'">
      <router-view />
      <GlobalSnackbar />
    </v-main>
    
    <!-- 워크스페이스 생성 모달 (전체 화면에서 렌더링) -->
    <CreateWorkspaceModal 
      :show="showCreateModal" 
      @close="closeCreateModal"
    />
    
    <!-- 프로젝트 생성 모달 (전체 화면에서 렌더링) -->
    <CreateProjectModal v-model="showProjectModal" />
  </v-app>
</template>

<script>
import HeaderComponent from './components/HeaderComponent.vue';
import SideBarComponent from './components/SideBarComponent.vue';
import CreateWorkspaceModal from './views/Workspace/CreateWorkspaceModal.vue';
import CreateProjectModal from './views/Project/CreateProjectModal.vue';
import GlobalSnackbar from './components/GlobalSnackbar.vue';

export default {
  name: "App",
  components: {
    SideBarComponent,
    HeaderComponent,
    GlobalSnackbar,
    CreateWorkspaceModal,
    CreateProjectModal,
  },
  data() {
    return {
      showCreateModal: false,
      showProjectModal: false
    };
  },
  computed: {
    hideLayout() {
      return this.$route.meta?.hideLayout === true;
    }
  },
  methods: {
    closeCreateModal() {
      this.showCreateModal = false;
    }
  },
  mounted() {
    // 전역 이벤트 리스너 등록 (Vue 3 방식)
    window.addEventListener('openCreateWorkspaceModal', () => {
      this.showCreateModal = true;
    });
    
    window.addEventListener('openCreateProjectModal', () => {
      this.showProjectModal = true;
    });
  }
}
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
.with-offset { padding-top: 64px; padding-left: 240px; }
.no-offset { padding: 0; }
</style>

<style>
/* 관리자 페이지일 때 전체 배경을 회색으로 설정 */
body {
  background: #F5F5F5;
}

/* 관리자 페이지 라우트일 때 */
.v-main {
  background: #F5F5F5;
}
</style>