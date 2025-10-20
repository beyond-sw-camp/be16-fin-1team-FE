<template>
  <v-app-bar class="app-header" flat density="comfortable">
    <!-- 검색바 -->
    <div class="search-container">
      <div class="search-input">
        <input type="text" placeholder="검색" class="search-field" />
        <img src="@/assets/icons/header/search.svg" alt="검색" class="search-icon" />
      </div>
    </div>
    
    <!-- 알림 아이콘 -->
    <v-btn icon class="notification-btn">
      <img src="@/assets/icons/header/bell.svg" alt="알림" class="bell-icon" />
    </v-btn>
    
    <!-- 사용자 아이콘 -->
    <v-btn icon class="user-btn">
      <img src="@/assets/icons/header/user.svg" alt="사용자" class="user-icon" />
    </v-btn>
  </v-app-bar>
</template>

<script>
export default {
  name: "HeaderComponent",
};
</script>

<style scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 280px;
  right: 0;
  height: 83px;
  z-index: 1000;
  background: #F5F5F5;
  color: #000000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}

.search-container {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: min(640px, calc(100vw - 400px));
  max-width: 640px;
  min-width: 300px;
  height: 42px;
  display: flex;
  align-items: center;
}

.search-input {
  position: relative;
  width: 100%;
  height: 100%;
}

.search-field {
  width: 100%;
  height: 100%;
  background: #FFFFFF;
  border: 1px solid #DDDDDD;
  border-radius: 25px;
  padding: 13px 17px;
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 17px;
  color: #757575;
  box-sizing: border-box;
}

.search-field::placeholder {
  color: #757575;
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.notification-btn {
  position: absolute;
  right: 80px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #F5F5F5 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 1200px) {
  .notification-btn {
    right: 60px;
  }
}

@media (max-width: 768px) {
  .notification-btn {
    right: 50px;
  }
}

.bell-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
}

.user-btn {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #F5F5F5 !important;
  box-shadow: none !important;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .user-btn {
    right: 10px;
  }
}

.user-icon {
  width: 20px;
  height: 20px;
  opacity: 0.8;
  filter: brightness(0);
}
</style>