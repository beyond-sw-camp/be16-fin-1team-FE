<template>
  <v-dialog v-model="isOpen" max-width="720" scrollable persistent>
    <v-card class="terms-card" rounded="lg">
      <v-card-text class="card-body">
        <div class="title">개인 정보 보호 정책</div>
        <div class="subtitle">Orbit 일정 관리 서비스 개인정보 처리방침 요약</div>

        <section class="section">
          <h3>1. 수집하는 정보</h3>
          <ul>
            <li>필수: 이메일, 이름(또는 닉네임), 로그인 이력, 기기 정보 일부</li>
            <li>선택: 프로필 이미지, 전화번호(2단계 인증/알림용)</li>
          </ul>
        </section>

        <section class="section">
          <h3>2. 수집/이용 목적</h3>
          <ul>
            <li>계정 생성 및 로그인, 일정 공유 및 초대 기능 제공</li>
            <li>알림/리마인드 전송, 서비스 보안 및 성능 개선</li>
          </ul>
        </section>

        <section class="section">
          <h3>3. 보관 기간</h3>
          <p>회원 탈퇴 또는 목적 달성 시 지체 없이 파기하며, 법령이 정한 기간은 별도 보관합니다.</p>
        </section>

        <section class="section">
          <h3>4. 제3자 제공/위탁</h3>
          <p>필수 기능 수행을 위한 최소한의 범위에서만 처리 위탁하며, 수탁사/항목/목적을 사전에 고지합니다.</p>
        </section>

        <section class="section">
          <h3>5. 이용자 권리</h3>
          <ul>
            <li>개인정보 열람/정정/삭제/처리정지 요청</li>
            <li>동의 철회 및 마케팅 수신 거부</li>
          </ul>
        </section>

        <section class="section">
          <h3>6. 안전성 확보 조치</h3>
          <ul>
            <li>전송/저장 구간 암호화, 접근 통제, 로그 모니터링</li>
            <li>민감정보 최소 수집, 내부 권한 분리</li>
          </ul>
        </section>

        <div class="actions">
          <v-btn class="confirm-btn" rounded="lg" height="40" @click="close">확인</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'UserPrivacyModal',
  props: {
    modelValue: { type: Boolean, default: false },
  },
  computed: {
    isOpen: {
      get() { return this.modelValue; },
      set(v) { this.$emit('update:modelValue', v); }
    }
  },
  methods: {
    close() { this.isOpen = false; }
  }
}
</script>

<style scoped>
.terms-card { background: #2A2828; color: #FFFFFF; }
.card-body { padding: 24px 20px 16px; }
.title { font-size: 20px; font-weight: 800; margin-bottom: 6px; }
.subtitle { font-size: 13px; color: #CFCFCF; margin-bottom: 16px; }
.section { margin-bottom: 14px; }
.section h3 { font-size: 14px; font-weight: 700; margin: 8px 0; }
.section p, .section li { font-size: 12px; line-height: 1.6; color: #FFFFFF; }
.section ul { margin: 0 0 0 16px; padding: 0; }
.actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.confirm-btn { background: #FFE364; color: #2A2828; font-weight: 700; }
/* remove focus ring on button */
:deep(.v-btn:focus),
:deep(.v-btn:focus-visible),
:deep(button:focus),
:deep(button:focus-visible),
.confirm-btn:focus,
.confirm-btn:focus-visible { outline: none !important; box-shadow: none !important; }
</style>


