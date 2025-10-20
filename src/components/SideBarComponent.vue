<template>
  <v-navigation-drawer class="app-sidebar" permanent>
    <!-- 로고 섹션 -->
    <div class="logo-section">
      <div class="logo-icon"></div>
      <div class="logo-text">Orbit 워크스페이스</div>
      <div class="dropdown-arrow">▼</div>
    </div>
    
    <!-- 저작권 -->
    <div class="copyright">
      copyright © 2025 all rights
    </div>
    
    <!-- 네비게이션 메뉴 -->
    <div class="nav-section">
      <!-- 홈 (활성 상태) -->
      <div class="nav-item active">
        <img src="@/assets/icons/sidebar/home.svg" alt="홈" class="nav-icon" />
        <div class="nav-text">홈</div>
      </div>
      
      <!-- 내 일정 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/schedule.svg" alt="내 일정" class="nav-icon" />
        <div class="nav-text">내 일정</div>
      </div>
      
      <!-- 채팅 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/chat.svg" alt="채팅" class="nav-icon" />
        <div class="nav-text">채팅</div>
      </div>
      
      <!-- 문서함 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/document.svg" alt="문서함" class="nav-icon" />
        <div class="nav-text">문서함</div>
      </div>
      
      <!-- 프로젝트 -->
      <div class="nav-item">
        <img src="@/assets/icons/sidebar/project.svg" alt="프로젝트" class="nav-icon" />
        <div class="nav-text">프로젝트</div>
        <div class="dropdown-arrow">▼</div>
      </div>
    </div>
    
    <!-- 스토리지 사용량 -->
    <div class="storage-section">
      <div class="storage-indicator">
        <div class="storage-dot"></div>
        <div class="storage-text">스토리지 사용량</div>
      </div>
      
      <div class="storage-progress">
        <div class="storage-bar">
          <div class="storage-fill"></div>
        </div>
      </div>
      
      <div class="storage-info">4.8GB/10GB</div>
    </div>
  </v-navigation-drawer>
</template>

<script>
export default {
  name: "SideBarComponent",
};
</script>

<style scoped>
.app-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  z-index: 900;
  background: #2A2828;
  color: #FDF5EB;
  padding: 20px;
  box-sizing: border-box;
  transition: transform 0.3s ease;
}

@media (max-width: 768px) {
  .app-sidebar {
    width: 240px;
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .app-sidebar {
    width: 200px;
    padding: 10px;
  }
}

.logo-section {
  position: relative;
  height: 50px;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.logo-icon {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: #FFDD44;
  border-radius: 4px;
}

.logo-text {
  position: absolute;
  left: 32px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 20px;
  line-height: 24px;
  color: #FDF5EB;
}

@media (max-width: 768px) {
  .logo-text {
    left: 28px;
    font-size: 18px;
    line-height: 22px;
  }
}

@media (max-width: 480px) {
  .logo-text {
    left: 25px;
    font-size: 16px;
    line-height: 20px;
  }
}

.dropdown-arrow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #FDF5EB;
}

.copyright {
  position: absolute;
  left: 20px;
  top: 71px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #888888;
}

.nav-section {
  position: absolute;
  left: 20px;
  right: 20px;
  top: 112px;
  bottom: 86px;
}

.nav-item {
  position: relative;
  height: 44px;
  margin-bottom: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  background: rgba(255, 221, 68, 0.2);
}

.nav-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  opacity: 0.9;
}

.nav-text {
  position: absolute;
  left: 46px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 16px;
  line-height: 19px;
  color: #FDF5EB;
}

@media (max-width: 768px) {
  .nav-text {
    left: 40px;
    font-size: 14px;
    line-height: 17px;
  }
}

@media (max-width: 480px) {
  .nav-text {
    left: 35px;
    font-size: 12px;
    line-height: 15px;
  }
}

.nav-item .dropdown-arrow {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 19px;
  color: #FDF5EB;
}

.storage-section {
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 20px;
}

.storage-indicator {
  position: relative;
  height: 14px;
  margin-bottom: 10px;
}

.storage-dot {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background: #FFDD44;
  border-radius: 6px;
}

.storage-text {
  position: absolute;
  left: 18px;
  top: 0;
  font-family: 'Pretendard', sans-serif;
  font-weight: 800;
  font-size: 12px;
  line-height: 14px;
  color: #FDF5EB;
}

.storage-progress {
  position: relative;
  height: 6px;
  margin-bottom: 10px;
}

.storage-bar {
  position: relative;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  position: absolute;
  left: 0;
  top: 0;
  width: 48%;
  height: 100%;
  background: #FFDD44;
  border-radius: 3px;
}

.storage-info {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
  color: #CCCCCC;
}
</style>
