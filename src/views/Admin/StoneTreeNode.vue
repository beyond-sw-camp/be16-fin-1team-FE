<template>
  <div class="stone-tree-node" :class="{ 'has-children': stone.children && stone.children.length > 0 }">
    <!-- 현재 스톤 -->
    <div class="stone-item" :class="getStoneStatusClass(stone.milestone)" @click="handleClick">
      <span class="stone-name">{{ stone.stoneName }}: {{ Math.round(stone.milestone || 0) }}%</span>
    </div>
    
    <!-- 자식 스톤들 -->
    <div v-if="stone.children && stone.children.length > 0" class="children-container">
      <stone-tree-node
        v-for="child in stone.children"
        :key="child.stoneId"
        :stone="child"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'StoneTreeNode',
  props: {
    stone: {
      type: Object,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  methods: {
    getStoneStatusClass(milestone) {
      const progress = milestone || 0;
      if (progress === 100) {
        return 'completed';
      } else if (progress > 0) {
        return 'in-progress';
      } else {
        return 'not-started';
      }
    },
    
    handleClick() {
      this.$emit('node-click', this.stone);
    }
  }
};
</script>

<style scoped>
.stone-tree-node {
  margin-bottom: 10px;
}

.stone-item {
  flex: 1;
  min-width: 80px;
  height: 30px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border: 1px solid;
  margin-bottom: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.stone-item:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.stone-item.completed {
  background: #E8F5E8;
  border-color: #4CAF50;
}

.stone-item.in-progress {
  background: #FFF3E0;
  border-color: #FF9800;
}

.stone-item.not-started {
  background: #FFEBEE;
  border-color: #F44336;
}

.stone-name {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 12px;
  line-height: 14px;
  text-align: center;
  color: #2E7D32;
}

.stone-item.in-progress .stone-name {
  color: #E65100;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
}

.stone-item.not-started .stone-name {
  color: #C62828;
  font-weight: 400;
  font-size: 10px;
  line-height: 12px;
}

.children-container {
  margin-left: 20px;
  border-left: 2px solid #E0E0E0;
  padding-left: 10px;
  position: relative;
}

.children-container::before {
  content: '';
  position: absolute;
  left: -2px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #E0E0E0;
}

.stone-tree-node.has-children .stone-item::after {
  content: '';
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 2px;
  background: #E0E0E0;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .children-container {
    margin-left: 15px;
    padding-left: 8px;
  }
  
  .stone-item {
    min-width: 60px;
    height: 25px;
  }
  
  .stone-name {
    font-size: 10px;
    line-height: 12px;
  }
}
</style>
