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

    <!-- Feature Sections -->
    <section class="feature-images">
      <SectionCard
        v-for="feature in featureCards"
        :key="feature.title"
        class="feature-section-card"
        :title="feature.title"
        :subtitle="feature.description"
      >
        <div class="feature-card-media">
          <img class="feature-image" :src="feature.icon" :alt="feature.title" />
        </div>
      </SectionCard>
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
import landingImage1 from '@/assets/icons/랜딩 아래쪽 1.png';
import landingImage2 from '@/assets/icons/랜딩 아래쪽 2.png';
import scheduleIcon from '@/assets/icons/0101.png';
import progressIcon from '@/assets/icons/프로젝트.png';
import documentIcon from '@/assets/icons/030303.png';
import collaborationIcon from '@/assets/icons/협업 및 소통.png';
import SectionCard from '@/components/common/SectionCard.vue';
export default {
  name: 'LandingPage',
  components: {
    SectionCard
  },
  data() {
    return { 
      landingVideo,
      landingImage1,
      landingImage2,
      featureCards: [
        {
          title: '일정관리',
          description: '팀의 주요 일정과 마일스톤을 한눈에 계획하세요.',
          icon: scheduleIcon
        },
        {
          title: '프로젝트 현황',
          description: '진행 상황을 실시간으로 모니터링하고 대응합니다.',
          icon: progressIcon
        },
        {
          title: '문서관리',
          description: '중요 문서를 안전하게 보관하고 빠르게 찾아보세요.',
          icon: documentIcon
        },
        {
          title: '협업 & 소통',
          description: '팀원과 자유롭게 소통하고 협업 흐름을 이어갑니다.',
          icon: collaborationIcon
        }
      ],
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
/* 시작하기 버튼 포커스 링 제거 */
.start-btn:focus,
.start-btn:focus-visible {
  outline: none !important;
  box-shadow: none !important;
}
:deep(.start-btn .v-btn__overlay),
:deep(.start-btn .v-btn__underlay) {
  display: none !important;
}
.start-btn { -webkit-tap-highlight-color: transparent; }

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

/* Feature sections */
.feature-images {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
  width: min(1440px, 92%);
  margin: 16px auto 48px;
}
.feature-section-card {
  padding: 24px;
}
:deep(.feature-section-card .section-card-header) {
  margin-bottom: 12px;
}
:deep(.feature-section-card .section-card-title) {
  font-size: 20px;
}
:deep(.feature-section-card .section-card-subtitle) {
  font-size: 14px;
  line-height: 1.5;
}
.feature-card-media {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 12px;
}
.feature-image {
  width: calc(100% + 16px);
  margin-left: -8px;
  margin-right: -8px;
  height: clamp(280px, 34vw, 380px);
  border-radius: 0;
  object-fit: contain;
  display: block;
  background: #f7f7f7;
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
  .feature-images { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .feature-image { height: clamp(220px, 38vw, 320px); }
  .gallery-item.large, .gallery-item.center { height: 240px; }
}

@media (max-width: 640px) {
  .hero-inner { padding-top: 72px; }
  .start-btn { height: 48px !important; }
  .feature-images { grid-template-columns: 1fr; }
  .feature-image { height: clamp(220px, 60vw, 320px); }
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
.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #f7f7f7;
}
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


