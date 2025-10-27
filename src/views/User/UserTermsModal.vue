<template>
  <v-dialog v-model="isOpen" max-width="720" scrollable persistent>
    <v-card class="terms-card" rounded="lg">
      <v-card-text class="card-body">
        <div class="title">이용 약관</div>
        <div class="subtitle">Orbit 일정 관리 서비스 약관 요약</div>

        <section class="section">
          <h3>1. 서비스 개요</h3>
          <p>
            Orbit는 개인과 팀을 위한 일정·업무 관리 서비스입니다. 캘린더, 작업 보드,
            알림 및 협업 기능을 제공하며, 다양한 디바이스에서 동일한 경험을 제공합니다.
          </p>
        </section>

        <section class="section">
          <h3>2. 계정 및 보안</h3>
          <ul>
            <li>본인 소유의 이메일로 계정을 생성해야 합니다.</li>
            <li>비밀번호는 주기적으로 변경하고, 타인과 공유하지 마세요.</li>
            <li>이상 로그인 탐지 시 보안 조치를 위해 접속이 제한될 수 있습니다.</li>
          </ul>
        </section>

        <section class="section">
          <h3>3. 사용자 콘텐츠</h3>
          <ul>
            <li>사용자가 생성한 일정, 메모, 첨부파일의 소유권은 사용자에게 있습니다.</li>
            <li>서비스 품질 향상을 위한 비식별 분석에 동의할 수 있습니다.</li>
            <li>불법·유해 콘텐츠 업로드 시 사전 통보 없이 삭제될 수 있습니다.</li>
          </ul>
        </section>

        <section class="section">
          <h3>4. 알림 및 통신</h3>
          <p>
            푸시/이메일 알림은 일정 리마인드, 초대, 상태 변경 등 핵심 이벤트를 안내합니다.
            알림 빈도는 설정에서 세밀하게 제어할 수 있습니다.
          </p>
        </section>

        <section class="section">
          <h3>5. 서비스 이용 제한</h3>
          <ul>
            <li>시스템을 과부하시키는 행위 또는 자동화 크롤링은 금지됩니다.</li>
            <li>타인의 권리를 침해하는 활동이 확인될 경우 계정이 제한될 수 있습니다.</li>
          </ul>
        </section>

        <section class="section">
          <h3>6. 책임의 한계</h3>
          <p>
            서비스는 현 상태(as-is)로 제공되며, 불가항력적 장애에 대해 손해배상을 보장하지 않습니다.
            단, 법령이 허용하는 범위 내에서 최선의 복구를 제공합니다.
          </p>
        </section>

        <section class="section">
          <h3>7. 약관 변경</h3>
          <p>
            약관이 변경될 경우 서비스 내 공지 및 이메일로 안내되며, 고지일로부터 7일 후 효력이 발생합니다.
          </p>
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
  name: 'UserTermsModal',
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


