<template>
  <div class="landing-root">
    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-inner">
        <div class="logo-row">
          <img class="logo-img" src="@/assets/icons/logo/1_2.svg" alt="Orbit Logo" />
          <div class="logo-text">ORBIT</div>
        </div>

        <h1 class="hero-title">일정 관리의 새로운 시대를 열다</h1>
        <p class="hero-subtitle">쉽고 직관적인 방식으로,당신의 프로젝트를 완벽하게 이끌어보세요.</p>

        <div class="hero-cta">
          <v-btn class="start-btn" rounded="lg" color="#FFE364" @click="$router.push('/login')">시작하기</v-btn>
        </div>
      </div>
    </section>

    <!-- Intro Copy -->
    <section class="intro">
      <p class="intro-text">계획, 소통, 진행 현황, 자동화까지.</p>
      <p class="intro-text">프로젝트 관리에 필요한 모든 것을 한 곳에서 경험하세요.</p>
    </section>

    <!-- Feature Cards -->
    <section class="features">
      <v-card class="feature-card" elevation="4" rounded="xl">
        <v-card-title class="feature-title">일정 관리</v-card-title>
        <v-card-text class="feature-body">
          <img class="feature-media-img" :src="landingImage3" alt="feature" />
        </v-card-text>
      </v-card>
      <v-card class="feature-card" elevation="4" rounded="xl">
        <v-card-title class="feature-title">협업 & 소통</v-card-title>
        <v-card-text class="feature-body">
          <img class="feature-media-img" :src="landingImage3" alt="feature" />
        </v-card-text>
      </v-card>
      <v-card class="feature-card" elevation="4" rounded="xl">
        <v-card-title class="feature-title">프로젝트 현황</v-card-title>
        <v-card-text class="feature-body">
          <img class="feature-media-img" :src="landingImage3" alt="feature" />
        </v-card-text>
      </v-card>
      <v-card class="feature-card" elevation="4" rounded="xl">
        <v-card-title class="feature-title">스마트 자동화</v-card-title>
        <v-card-text class="feature-body">
          <img class="feature-media-img" :src="landingImage3" alt="feature" />
        </v-card-text>
      </v-card>
    </section>

    <section class="intro">
      <p class="intro-text">스마트한 일정 관리부터 실시간 협업, 프로젝트 모니터링, 자동화까지</p>
      <p class="intro-text">팀의 모든 업무를 하나로 연결합니다.</p>
    </section>

    <!-- Gallery (overlapped) -->
    <section class="gallery-stacked">
      <div class="pair">
        <v-card class="img-card img left" elevation="4" rounded="xl">
          <img class="gallery-img" :src="landingImage1" alt="img1" />
        </v-card>
        <v-card class="img-card img right" elevation="4" rounded="xl">
          <img class="gallery-img" :src="landingImage2" alt="img2" />
        </v-card>
      </div>
      <div class="overlay-video">
        <v-card class="video-card landing-video-wrap" elevation="6" rounded="xl">
          <video
            class="landing-video"
            :src="landingVideo"
            autoplay
            muted
            loop
            playsinline
          ></video>
        </v-card>
      </div>
    </section>
  </div>
  
</template>

<script>
import landingVideo from '@/assets/videos/landing/Orbing(Project_summary,tasks).mp4';
import landingImage1 from '@/assets/images/landing/calendar_1.png';
import landingImage2 from '@/assets/images/landing/calendar_2.png';
import landingImage3 from '@/assets/images/landing/calendar_3.png';
export default {
  name: 'LandingPage',
  data() {
    return { 
      landingVideo,
      landingImage1,
      landingImage2,
      landingImage3,
    };
  }
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
  min-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero-inner {
  position: relative;
  width: min(1200px, 92%);
  padding: 56px 16px 48px;
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
.logo-img { width: 40px; height: 40px; border-radius: 20%; display: block; }
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
  height: 42px !important;
  font-size: 16px !important;
  padding: 0 28px !important;
}

/* Intro copy */
.intro {
  padding: 64px 16px 8px;
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
  border: 1px solid #E0E0E0;
  transition: transform .18s ease, box-shadow .18s ease;
}
.feature-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important; }
.feature-body { padding-top: 8px; }
.feature-title {
  font-weight: 800;
  font-size: 22px;
  color: #151414;
}
.feature-media-img { width: 100%; height: 360px; border-radius: 14px; object-fit: cover; display: block; }

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
.gallery-item.center { height: auto; border-radius: 15px; }
.landing-video-wrap { width: 70%; overflow: hidden; border-radius: 15px; border: 1px solid #E0E0E0; }
.landing-video { width: calc(100% + 5px); height: auto; display: block; transform: translateX(-1px); }

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
  .feature-media { height: 300px; }
  .gallery-item.large, .gallery-item.center { height: 240px; }
}

@media (max-width: 640px) {
  .hero-inner { padding-top: 72px; }
  .start-btn { height: 48px !important; }
}

/* Overlapped gallery layout */
.gallery-stacked {
  position: relative;
  width: min(1440px, 92%);
  margin: 8px auto 120px;
}
.gallery-stacked .pair {
  display: flex;
  gap: 46px;
  margin-top: 60px;
}
.gallery-stacked .pair .img,
.gallery-stacked .pair .img-card {
  flex: 1 1 50%;
  height: 420px;
  border-radius: 16px;
  overflow: hidden;
}
.gallery-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gallery-stacked .pair .img.left { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.gallery-stacked .pair .img.right { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.gallery-stacked .overlay-video {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  top: 20px;
  z-index: 2;
  display: flex;
  justify-content: center;
}
.gallery-stacked .overlay-video .landing-video-wrap,
.gallery-stacked .overlay-video .video-card { width: 48%; }
</style>


