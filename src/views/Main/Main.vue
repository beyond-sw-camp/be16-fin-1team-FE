<template>
  <div class="main-fill">
    <v-container class="pa-6">
      <v-row>

        <!-- 이 카드를 복사해서 사용하세요. -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>홈</v-card-title>
            <v-card-text>
              설명이 필요하면 적어주세요.
            </v-card-text>
            <v-card-actions>
              <v-btn variant="flat" color="primary" :to="'/'">랜딩페이지</v-btn>
              <v-btn variant="flat" color="primary" :to="'/'">홈 이동2</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>


        <!-- User -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>User</v-card-title>
            <v-card-text>
              회원 관련
            </v-card-text>
            <v-card-actions>
              <v-btn variant="flat" color="primary" :to="'/new-user/input-email'">회원가입</v-btn>
              <v-btn variant="flat" color="primary" :to="'/login'">로그인</v-btn>
              <v-btn variant="flat" color="primary" :to="'/my-info'">마이페이지</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Chat -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Chat</v-card-title>
            <v-card-text>
              채팅 관련
            </v-card-text>
            <v-card-actions>
              <v-btn variant="flat" color="primary" :to="'/chat/main'">채팅 메인</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <!-- ChatBot -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>ChatBot</v-card-title>
            <v-card-text>
              챗봇 관련
            </v-card-text>
            <v-card-actions>
              <v-btn class="chatbot-open-btn" variant="flat" color="primary" :to="'/chatbot/page'">챗봇 화면</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- Workspace -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Workspace</v-card-title>
            <v-card-text>
              워크스페이스 관련
            </v-card-text>
            <v-card-actions>
              <v-btn variant="flat" color="primary" :to="'/workspace/test'">워크스페이스 테스트</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <!-- OpenVidu -->
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>OpenVidu</v-card-title>
            <v-card-text>
              화상회의 관련
            </v-card-text>
            <v-card-actions>
              <v-btn variant="flat" color="primary" :to="`/callpage/${1}`">화상회의 테스트</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>


        
        
      </v-row>
    </v-container>
  </div>
  
</template>

<script>
export default {
  name: "Main",
};
</script>

<style scoped>
.main-fill {
  position: fixed;
  top: 64px;
  left: 240px;
  right: 0;
  bottom: 0;
  background-color: #F5F5F5;
}
.chatbot-open-btn:focus, .chatbot-open-btn:focus-visible { outline: none !important; box-shadow: none !important; }
.chatbot-open-btn { -webkit-tap-highlight-color: transparent; }
</style>