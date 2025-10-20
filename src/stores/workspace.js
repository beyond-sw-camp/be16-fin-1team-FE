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
      this.currentWorkspace = workspace;
      // localStorage에도 저장
      if (workspace) {
        localStorage.setItem('selectedWorkspaceId', workspace.workspaceId);
        localStorage.setItem('selectedWorkspaceName', workspace.workspaceName);
        localStorage.setItem('selectedWorkspaceRole', workspace.role);
      }
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
    }
  }
})
