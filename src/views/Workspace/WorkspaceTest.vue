<template>
  <v-container fluid class="px-0">
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="text-h4 mb-4">
            <v-icon left>mdi-domain</v-icon>
            워크스페이스 API 테스트
          </v-card-title>
          
          <v-card-text>
            <v-alert type="info" class="mb-4">
              워크스페이스 관련 API를 테스트할 수 있는 페이지입니다.
            </v-alert>

            <!-- 현재 워크스페이스 정보 -->
            <v-card variant="outlined" class="mb-4">
              <v-card-title>현재 워크스페이스 정보</v-card-title>
              <v-card-text>
                <v-chip v-if="currentWorkspace" color="primary" class="mr-2">
                  {{ currentWorkspace.name }}
                </v-chip>
                <v-chip v-else color="grey" variant="outlined">
                  워크스페이스 미선택
                </v-chip>
              </v-card-text>
            </v-card>

            <!-- API 테스트 섹션 -->
            <v-expansion-panels multiple>
              <!-- 워크스페이스 목록 조회 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-format-list-bulleted</v-icon>
                  워크스페이스 목록 조회
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-btn @click="getWorkspaceList" :loading="loading.list" color="primary" class="mb-3">
                    목록 조회
                  </v-btn>
                  <v-data-table
                    v-if="workspaceList.length > 0"
                    :headers="listHeaders"
                    :items="workspaceList"
                    :loading="loading.list"
                  >
                    <template v-slot:item.actions="{ item }">
                      <v-btn size="small" @click="selectWorkspace(item)" color="primary">
                        선택
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 워크스페이스 생성 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-plus</v-icon>
                  워크스페이스 생성
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-form @submit.prevent="createWorkspace">
                    <v-text-field
                      v-model="newWorkspace.workspaceName"
                      label="워크스페이스 이름"
                      required
                      class="mb-3"
                    ></v-text-field>
                    <v-select
                      v-model="newWorkspace.workspaceTemplates"
                      label="워크스페이스 템플릿"
                      :items="workspaceTemplates"
                      required
                      class="mb-3"
                    ></v-select>
                    <v-btn type="submit" :loading="loading.create" color="success">
                      워크스페이스 생성
                    </v-btn>
                  </v-form>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 워크스페이스 상세 조회 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-information</v-icon>
                  워크스페이스 상세 조회
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="selectedWorkspaceId"
                    label="워크스페이스 ID"
                    class="mb-3"
                  ></v-text-field>
                  <v-btn @click="getWorkspaceDetail" :loading="loading.detail" color="info">
                    상세 조회
                  </v-btn>
                  <v-card v-if="workspaceDetail" class="mt-3" variant="outlined">
                    <v-card-text>
                      <pre>{{ JSON.stringify(workspaceDetail, null, 2) }}</pre>
                    </v-card-text>
                  </v-card>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 워크스페이스 이름 변경 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-pencil</v-icon>
                  워크스페이스 이름 변경
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-form @submit.prevent="updateWorkspaceName">
                    <v-text-field
                      v-model="updateName.workspaceId"
                      label="워크스페이스 ID"
                      required
                      class="mb-3"
                    ></v-text-field>
                    <v-text-field
                      v-model="updateName.workspaceName"
                      label="새 워크스페이스 이름"
                      required
                      class="mb-3"
                    ></v-text-field>
                    <v-btn type="submit" :loading="loading.update" color="warning">
                      이름 변경
                    </v-btn>
                  </v-form>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 참여자 관리 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-account-group</v-icon>
                  참여자 관리
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-tabs>
                    <v-tab>참여자 목록</v-tab>
                    <v-tab>참여자 추가</v-tab>
                    <v-tab>참여자 삭제</v-tab>
                    <v-tab>이메일 초대</v-tab>
                  </v-tabs>
                  
                  <v-tabs-window>
                    <!-- 참여자 목록 -->
                    <v-tabs-window-item value="0">
                      <v-text-field
                        v-model="participantWorkspaceId"
                        label="워크스페이스 ID"
                        class="mb-3"
                      ></v-text-field>
                      <v-btn @click="getParticipants" :loading="loading.participants" color="info" class="mb-3">
                        참여자 목록 조회
                      </v-btn>
                      <v-data-table
                        v-if="participants.length > 0"
                        :headers="participantHeaders"
                        :items="participants"
                        :loading="loading.participants"
                      ></v-data-table>
                    </v-tabs-window-item>

                    <!-- 참여자 추가 -->
                    <v-tabs-window-item value="1">
                      <v-form @submit.prevent="addParticipants">
                        <v-text-field
                          v-model="addParticipant.workspaceId"
                          label="워크스페이스 ID"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-text-field
                          v-model="addParticipant.userIdList"
                          label="사용자 ID 목록 (쉼표로 구분)"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-btn type="submit" :loading="loading.addParticipant" color="success">
                          참여자 추가
                        </v-btn>
                      </v-form>
                    </v-tabs-window-item>

                    <!-- 참여자 삭제 -->
                    <v-tabs-window-item value="2">
                      <v-form @submit.prevent="deleteParticipants">
                        <v-text-field
                          v-model="deleteParticipant.workspaceId"
                          label="워크스페이스 ID"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-text-field
                          v-model="deleteParticipant.userIdList"
                          label="삭제할 사용자 ID 목록 (쉼표로 구분)"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-btn type="submit" :loading="loading.deleteParticipant" color="error">
                          참여자 삭제
                        </v-btn>
                      </v-form>
                    </v-tabs-window-item>

                    <!-- 이메일 초대 -->
                    <v-tabs-window-item value="3">
                      <v-form @submit.prevent="inviteUsers">
                        <v-text-field
                          v-model="invite.workspaceId"
                          label="워크스페이스 ID"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-text-field
                          v-model="invite.emailList"
                          label="초대할 이메일 목록 (쉼표로 구분)"
                          required
                          class="mb-3"
                        ></v-text-field>
                        <v-btn type="submit" :loading="loading.invite" color="primary">
                          이메일 초대
                        </v-btn>
                      </v-form>
                    </v-tabs-window-item>
                  </v-tabs-window>
                </v-expansion-panel-text>
              </v-expansion-panel>

              <!-- 워크스페이스 삭제 -->
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon left>mdi-delete</v-icon>
                  워크스페이스 삭제
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                    v-model="deleteWorkspaceId"
                    label="워크스페이스 ID"
                    required
                    class="mb-3"
                  ></v-text-field>
                  <v-btn @click="openDeleteModal" color="error">
                    워크스페이스 삭제
                  </v-btn>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <!-- 응답 결과 표시 -->
            <v-card v-if="apiResponse" class="mt-4" variant="outlined">
              <v-card-title>API 응답</v-card-title>
              <v-card-text>
                <pre>{{ JSON.stringify(apiResponse, null, 2) }}</pre>
              </v-card-text>
            </v-card>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 워크스페이스 삭제 모달 -->
    <DeleteWorkspaceModal
      v-model="showDeleteModal"
      :workspace-name="selectedWorkspaceForDelete?.workspaceName || ''"
      :workspace-id="selectedWorkspaceForDelete?.workspaceId || deleteWorkspaceId"
      @confirm-delete="confirmDeleteWorkspace"
    />
  </v-container>
</template>

<script>
import axios from 'axios';
import DeleteWorkspaceModal from './DeleteWorkspaceModal.vue';

export default {
  components: {
    DeleteWorkspaceModal
  },
  name: 'WorkspaceTest',
  data() {
    return {
      // 현재 워크스페이스 정보
      currentWorkspace: null,
      
      // 로딩 상태
      loading: {
        list: false,
        create: false,
        detail: false,
        update: false,
        participants: false,
        addParticipant: false,
        deleteParticipant: false,
        invite: false,
        delete: false
      },
      
      // 워크스페이스 목록
      workspaceList: [],
      listHeaders: [
        { title: 'ID', key: 'workspaceId' },
        { title: '이름', key: 'workspaceName' },
        { title: '설명', key: 'description' },
        { title: '생성일', key: 'createdAt' },
        { title: '액션', key: 'actions', sortable: false }
      ],
      
      // 워크스페이스 생성
      newWorkspace: {
        workspaceName: '',
        workspaceTemplates: ''
      },
      
      // 워크스페이스 템플릿 옵션
      workspaceTemplates: [
        { title: 'PERSONAL', value: 'PERSONAL' },
        { title: 'PRO', value: 'PRO' },
        { title: 'ENTERPRISE', value: 'ENTERPRISE' }
      ],
      
      // 워크스페이스 상세 조회
      selectedWorkspaceId: '',
      workspaceDetail: null,
      
      // 워크스페이스 이름 변경
      updateName: {
        workspaceId: '',
        workspaceName: ''
      },
      
      // 참여자 관리
      participantWorkspaceId: '',
      participants: [],
      participantHeaders: [
        { title: '사용자 ID', key: 'userId' },
        { title: '이름', key: 'userName' },
        { title: '이메일', key: 'email' },
        { title: '역할', key: 'role' }
      ],
      
      // 참여자 추가
      addParticipant: {
        workspaceId: '',
        userIdList: ''
      },
      
      // 참여자 삭제
      deleteParticipant: {
        workspaceId: '',
        userIdList: ''
      },
      
      // 이메일 초대
      invite: {
        workspaceId: '',
        emailList: ''
      },
      
      // 워크스페이스 삭제
      deleteWorkspaceId: '',
      showDeleteModal: false,
      selectedWorkspaceForDelete: null,
      
      // API 응답
      apiResponse: null
    };
  },
  
  mounted() {
    this.loadCurrentWorkspace();
  },
  
  methods: {
    // 현재 워크스페이스 로드
    loadCurrentWorkspace() {
      const workspace = localStorage.getItem('currentWorkspace');
      if (workspace) {
        this.currentWorkspace = JSON.parse(workspace);
      }
    },
    
    // 워크스페이스 선택
    selectWorkspace(workspace) {
      this.currentWorkspace = workspace;
      localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
      this.$toast?.success(`${workspace.workspaceName} 워크스페이스를 선택했습니다.`);
    },
    
    // API 호출 헬퍼
    async apiCall(apiFunction, loadingKey) {
      try {
        this.loading[loadingKey] = true;
        const result = await apiFunction();
        this.apiResponse = result;
        return result;
      } catch (error) {
        console.error('API 호출 실패:', error);
        this.apiResponse = { error: error.message };
        throw error;
      } finally {
        this.loading[loadingKey] = false;
      }
    },
    
    // 워크스페이스 목록 조회
    async getWorkspaceList() {
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const response = await axios.get(`${baseURL}/workspace-service/workspace`, {
          headers: {
            'X-User-Id': userId
          }
        });
        
        this.workspaceList = response.data.result || [];
        return response.data;
      }, 'list');
    },
    
    // 워크스페이스 생성
    async createWorkspace() {
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const response = await axios.post(`${baseURL}/workspace-service/workspace`, {
          workspaceName: this.newWorkspace.workspaceName,
          workspaceTemplates: this.newWorkspace.workspaceTemplates
        }, {
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        // 생성 후 목록 새로고침
        await this.getWorkspaceList();
        this.newWorkspace = { workspaceName: '', workspaceTemplates: '' };
        
        return response.data;
      }, 'create');
    },
    
    // 워크스페이스 상세 조회
    async getWorkspaceDetail() {
      if (!this.selectedWorkspaceId) {
        // alert('워크스페이스 ID를 입력해주세요.');
        showSnackbar('워크스페이스 ID를 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const response = await axios.get(`${baseURL}/workspace-service/workspace/${this.selectedWorkspaceId}`, {
          headers: {
            'X-User-Id': userId
          }
        });
        
        this.workspaceDetail = response.data.result;
        return response.data;
      }, 'detail');
    },
    
    // 워크스페이스 이름 변경
    async updateWorkspaceName() {
      if (!this.updateName.workspaceId || !this.updateName.workspaceName) {
        // alert('워크스페이스 ID와 새 이름을 입력해주세요.');
        showSnackbar('워크스페이스 ID와 새 이름을 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const response = await axios.patch(`${baseURL}/workspace-service/workspace/${this.updateName.workspaceId}/name`, {
          workspaceName: this.updateName.workspaceName
        }, {
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      }, 'update');
    },
    
    // 참여자 목록 조회
    async getParticipants() {
      if (!this.participantWorkspaceId) {
        // alert('워크스페이스 ID를 입력해주세요.');
        showSnackbar('워크스페이스 ID를 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const response = await axios.get(`${baseURL}/workspace-service/workspace/${this.participantWorkspaceId}/participants`, {
          headers: {
            'X-User-Id': userId
          }
        });
        
        this.participants = response.data.result || [];
        return response.data;
      }, 'participants');
    },
    
    // 참여자 추가
    async addParticipants() {
      if (!this.addParticipant.workspaceId || !this.addParticipant.userIdList) {
        // alert('워크스페이스 ID와 사용자 ID 목록을 입력해주세요.'); 
        showSnackbar('워크스페이스 ID와 사용자 ID 목록을 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const userIdList = this.addParticipant.userIdList.split(',').map(id => id.trim());
        
        const response = await axios.post(`${baseURL}/workspace-service/workspace/${this.addParticipant.workspaceId}/participants`, {
          userIdList: userIdList
        }, {
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      }, 'addParticipant');
    },
    
    // 참여자 삭제
    async deleteParticipants() {
      if (!this.deleteParticipant.workspaceId || !this.deleteParticipant.userIdList) {
        // alert('워크스페이스 ID와 삭제할 사용자 ID 목록을 입력해주세요.');
        showSnackbar('워크스페이스 ID와 삭제할 사용자 ID 목록을 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const userIdList = this.deleteParticipant.userIdList.split(',').map(id => id.trim());
        
        const response = await axios.delete(`${baseURL}/workspace-service/workspace/${this.deleteParticipant.workspaceId}/participants`, {
          data: {
            userIdList: userIdList
          },
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      }, 'deleteParticipant');
    },
    
    // 이메일 초대
    async inviteUsers() {
      if (!this.invite.workspaceId || !this.invite.emailList) {
        // alert('워크스페이스 ID와 초대할 이메일 목록을 입력해주세요.');
        showSnackbar('워크스페이스 ID와 초대할 이메일 목록을 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      await this.apiCall(async () => {
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const userId = localStorage.getItem('id');
        
        const emailList = this.invite.emailList.split(',').map(email => email.trim());
        
        const response = await axios.post(`${baseURL}/workspace-service/workspace/${this.invite.workspaceId}/invite`, {
          emailList: emailList
        }, {
          headers: {
            'X-User-Id': userId,
            'Content-Type': 'application/json'
          }
        });
        
        return response.data;
      }, 'invite');
    },
    
    // 삭제 모달 열기
    openDeleteModal() {
      if (!this.deleteWorkspaceId) {
        // alert('워크스페이스 ID를 입력해주세요.');
        showSnackbar('워크스페이스 ID를 입력해주세요.', { color: 'error', timeout: 5000 });

        return;
      }
      
      // 입력된 ID로 워크스페이스 정보 찾기
      const workspace = this.workspaceList.find(w => w.workspaceId === this.deleteWorkspaceId);
      if (workspace) {
        this.selectedWorkspaceForDelete = workspace;
      } else {
        // 목록에 없는 경우 입력된 ID로 임시 객체 생성
        this.selectedWorkspaceForDelete = {
          workspaceId: this.deleteWorkspaceId,
          workspaceName: '알 수 없는 워크스페이스'
        };
      }
      
      this.showDeleteModal = true;
    },
    
    // 워크스페이스 삭제 확인
    async confirmDeleteWorkspace(workspaceData) {
      try {
        await this.apiCall(async () => {
          const baseURL = import.meta.env.VITE_API_BASE_URL;
          const userId = localStorage.getItem('id');
          
          const response = await axios.delete(`${baseURL}/workspace-service/workspace/${workspaceData.workspaceId}`, {
            headers: {
              'X-User-Id': userId
            }
          });
          
          // 삭제된 워크스페이스를 현재 워크스페이스에서 제거
          if (this.currentWorkspace && this.currentWorkspace.workspaceId === workspaceData.workspaceId) {
            await this.switchToAnotherWorkspace();
          }
          
          // 삭제 후 목록 새로고침
          await this.getWorkspaceList();
          this.deleteWorkspaceId = '';
          
          return response.data;
        }, 'delete');
        
        this.showDeleteModal = false;
      } catch (error) {
        console.error('워크스페이스 삭제 실패:', error);
        this.showDeleteModal = false;
      }
    },
    
    // 다른 워크스페이스로 자동 이동
    async switchToAnotherWorkspace() {
      try {
        // 워크스페이스 목록 새로고침
        await this.getWorkspaceList();
        
        if (this.workspaceList.length > 0) {
          // 첫 번째 워크스페이스로 이동
          const newWorkspace = this.workspaceList[0];
          this.selectWorkspace(newWorkspace);
          
          console.log(`삭제된 워크스페이스에서 "${newWorkspace.workspaceName}"으로 자동 이동`);
        } else {
          // 워크스페이스가 없는 경우
          this.currentWorkspace = null;
          localStorage.removeItem('currentWorkspace');
          console.log('사용 가능한 워크스페이스가 없습니다.');
        }
      } catch (error) {
        console.error('워크스페이스 전환 실패:', error);
        this.currentWorkspace = null;
        localStorage.removeItem('currentWorkspace');
      }
    }
  }
};
</script>

<style scoped>
pre {
  background-color: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
