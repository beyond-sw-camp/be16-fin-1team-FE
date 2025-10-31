<template>
  <div class="landing-root">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-inner">
        <div class="logo-row">
          <div class="logo-dot"></div>
          <div class="logo-text">Orbit</div>
        </div>

        <h1 class="hero-title">하나의 공간에서 협업과 생산성을</h1>
        <p class="hero-subtitle">일정·소통·프로젝트·자동화를 한 번에</p>

        <div class="hero-cta">
          <v-btn class="start-btn" rounded="lg" color="#FFE364" @click="$router.push('/login')">시작하기</v-btn>
        </div>
      </div>
    </section>

    <!-- Intro Copy -->
    <section class="intro">
      <p class="intro-text">Orbit은 팀이 필요한 모든 작업을 연결해 주는 협업 플랫폼입니다.</p>
    </section>

    <!-- Feature Cards -->
    <section class="features">
      <div class="feature-card">
        <div class="feature-title">일정 관리</div>
        <div class="feature-media placeholder">Calendar Preview</div>
      </div>
      <div class="feature-card">
        <div class="feature-title">협업 & 소통</div>
        <div class="feature-media placeholder">Chat & Docs</div>
      </div>
      <div class="feature-card">
        <div class="feature-title">프로젝트 현황</div>
        <div class="feature-media placeholder">Project Board</div>
      </div>
      <div class="feature-card">
        <div class="feature-title">스마트 자동화</div>
        <div class="feature-media placeholder">Automation</div>
      </div>
    </section>

    <!-- Gallery (Dummy) -->
    <section class="gallery">
      <div class="gallery-item large placeholder">이미지 1</div>
      <div class="gallery-item center placeholder">GIF/미리보기</div>
      <div class="gallery-item large placeholder">이미지 2</div>
    </section>
  </div>
  
</template>

<script>
export default {
  name: 'LandingPage',
};
</script>

<style scoped>
.landing-root {
  width: 100%;
  min-height: 100vh;
  background: #F5F5F5;
  display: flex;
  flex-direction: column;
}

/* Hero */
.hero {
  position: relative;
  background: #2A2828;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-inner {
  position: relative;
  width: min(1200px, 92%);
  padding: 80px 16px 64px;
  text-align: center;
}
.logo-row {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 24px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.logo-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #FFE364;
}
.logo-text {
  font-family: 'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  font-weight: 800;
  font-size: 32px;
  color: #FFFFFF;
}
.hero-title {
  margin: 0;
  margin-top: 36px;
  font-family: 'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  font-weight: 800;
  font-size: clamp(28px, 4.2vw, 48px);
  line-height: 1.2;
  color: #FFFFFF;
}
.hero-subtitle {
  margin: 8px 0 0;
  font-family: 'Pretendard', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  font-weight: 800;
  font-size: clamp(16px, 2.2vw, 24px);
  color: #F5F5F5;
}
.hero-cta { margin-top: 28px; }
.start-btn {
  background: #FFE364 !important;
  color: #1C0F0F !important;
  font-weight: 700 !important;
  height: 52px !important;
  padding: 0 28px !important;
}

/* Intro copy */
.intro {
  padding: 40px 16px 8px;
}
.intro-text {
  margin: 0 auto;
  text-align: center;
  width: min(900px, 92%);
  font-weight: 800;
  font-size: 24px;
  color: #1C0F0F;
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  width: min(1440px, 92%);
  margin: 24px auto 56px;
}
.feature-card {
  box-sizing: border-box;
  background: linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%);
  border: 1px solid #CCCCCC;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.feature-title {
  font-weight: 800;
  font-size: 22px;
  color: #151414;
}
.feature-media {
  width: 100%;
  height: 300px;
  border-radius: 14px;
}

/* Gallery */
.gallery {
  width: min(1440px, 92%);
  margin: 8px auto 80px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  align-items: start;
}
.gallery-item.large { height: 340px; }
.gallery-item.center { height: 280px; border-radius: 15px; }

/* Placeholders */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
  background: repeating-linear-gradient(
    45deg,
    #f3f3f3,
    #f3f3f3 10px,
    #e9e9e9 10px,
    #e9e9e9 20px
  );
  border: 1px dashed #D0D0D0;
}

@media (max-width: 1200px) {
  .features { grid-template-columns: repeat(2, 1fr); }
  .feature-media { height: 240px; }
  .gallery { grid-template-columns: 1fr; }
  .gallery-item.large, .gallery-item.center { height: 240px; }
}

@media (max-width: 640px) {
  .hero-inner { padding-top: 72px; }
  .start-btn { height: 48px !important; }
}
</style>


