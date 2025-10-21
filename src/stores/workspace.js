import { defineStore } from 'pinia'

export const useWorkspaceStore = defineStore('workspace', {
  state: () => ({
    currentWorkspace: null,
    workspaces: []
  }),
  
  getters: {
    getCurrentWorkspace: (state) => state.currentWorkspace,
    getWorkspaces: (state) => state.workspaces,
    getCurrentWorkspaceId: (state) => state.currentWorkspace?.workspaceId || null
  },
  
  actions: {
    setCurrentWorkspace(workspace) {
      const previousWorkspace = this.currentWorkspace;
      this.currentWorkspace = workspace;
      
      // localStorage에도 저장
      if (workspace) {
        localStorage.setItem('selectedWorkspaceId', workspace.workspaceId);
        localStorage.setItem('selectedWorkspaceName', workspace.workspaceName);
        localStorage.setItem('selectedWorkspaceRole', workspace.role);
      } else {
        localStorage.removeItem('selectedWorkspaceId');
        localStorage.removeItem('selectedWorkspaceName');
        localStorage.removeItem('selectedWorkspaceRole');
      }
      
      // 워크스페이스가 실제로 변경된 경우에만 이벤트 발생
      if (previousWorkspace?.workspaceId !== workspace?.workspaceId) {
        this.emitWorkspaceChange(workspace, previousWorkspace);
      }
      
      // 워크스페이스명이 변경된 경우에도 이벤트 발생
      if (previousWorkspace?.workspaceId === workspace?.workspaceId && 
          previousWorkspace?.workspaceName !== workspace?.workspaceName) {
        this.emitWorkspaceChange(workspace, previousWorkspace);
      }
    },
    
    // 워크스페이스 변경 이벤트 발생
    emitWorkspaceChange(newWorkspace, oldWorkspace) {
      // 커스텀 이벤트 발생
      const event = new CustomEvent('workspaceChanged', {
        detail: {
          newWorkspace,
          oldWorkspace,
          workspaceId: newWorkspace?.workspaceId,
          workspaceName: newWorkspace?.workspaceName,
          role: newWorkspace?.role
        }
      });
      window.dispatchEvent(event);
      
      // Vue 3의 전역 이벤트 버스 대신 window 이벤트 사용
      console.log('워크스페이스 변경됨:', {
        from: oldWorkspace?.workspaceName || '없음',
        to: newWorkspace?.workspaceName || '없음'
      });
    },
    
    setWorkspaces(workspaces) {
      this.workspaces = workspaces;
    },
    
    loadFromLocalStorage() {
      const workspaceId = localStorage.getItem('selectedWorkspaceId');
      const workspaceName = localStorage.getItem('selectedWorkspaceName');
      const workspaceRole = localStorage.getItem('selectedWorkspaceRole');
      
      if (workspaceId && workspaceName) {
        this.currentWorkspace = {
          workspaceId,
          workspaceName,
          role: workspaceRole
        };
      }
    },
    
    // 초기화 시 localStorage에서 데이터 로드
    initialize() {
      this.loadFromLocalStorage();
    },
    
    // 워크스페이스 목록 새로고침
    async loadWorkspaces() {
      try {
        const userId = localStorage.getItem('id') || 'user123';
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/workspace-service/workspace', {
          headers: {
            'X-User-Id': userId,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.statusCode === 200) {
            this.setWorkspaces(data.result);
            return data.result;
          }
        }
        return [];
      } catch (error) {
        console.error('워크스페이스 목록 로드 실패:', error);
        return [];
      }
    }
  }
})
