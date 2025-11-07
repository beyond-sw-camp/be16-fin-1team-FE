<template>
  <div class="project-dashboard-container">
    <div v-if="loading" class="loading-container">
      <p class="loading-text">대시보드 데이터를 불러오는 중...</p>
    </div>
    
    <div v-else class="dashboard-content">
      <!-- 차트 영역 -->
      <div class="charts-section">
        <!-- AI 차트 1: 프로젝트 인사이트 (텍스트) -->
        <div class="chart-card ai-card">
          <div class="chart-header">
            <h3 class="chart-title">AI 프로젝트 인사이트</h3>
            <p class="chart-subtitle">AI가 현재 진행 상황을 종합적으로 분석했습니다.</p>
          </div>
          <div class="chart-body ai-card-content">
            <div v-if="isAIDataLoading" class="ai-loading-container">
              <p class="ai-placeholder ai-loading-text">
                AI 분석 데이터를 준비중입니다<span class="ai-dot ai-dot-1">.</span><span class="ai-dot ai-dot-2">.</span><span class="ai-dot ai-dot-3">.</span>
              </p>
            </div>
            <div v-else-if="aiAnalysisData.analysisReport" class="ai-report-text">
              {{ aiAnalysisData.analysisReport }}
            </div>
            <div v-else class="ai-empty-state">
              <p>분석 데이터를 불러올 수 없습니다.</p>
            </div>
          </div>
        </div>

        <!-- AI 차트 2: 일정 예측 트렌드 (Line Chart) -->
        <div class="chart-card ai-card">
          <div class="chart-header">
            <h3 class="chart-title">AI 일정 예측 트렌드</h3>
            <p class="chart-subtitle">AI가 분석한 예상 완료일 신뢰도 추세를 확인하세요.</p>
          </div>
          <div class="chart-body ai-card-content">
            <div v-if="isAIDataLoading" class="ai-loading-container">
              <p class="ai-placeholder ai-loading-text">
                AI 분석 데이터를 준비중입니다<span class="ai-dot ai-dot-1">.</span><span class="ai-dot ai-dot-2">.</span><span class="ai-dot ai-dot-3">.</span>
              </p>
            </div>
            <div v-else-if="confidenceTrendChartSeries.length > 0" class="ai-chart-container">
              <apexchart
                type="line"
                height="230"
                :options="confidenceTrendChartOptions"
                :series="confidenceTrendChartSeries"
              />
            </div>
            <div v-else class="ai-empty-state">
              <p>예측 데이터를 불러올 수 없습니다.</p>
            </div>
          </div>
        </div>

        <!-- AI 차트 3: 리스크 진단 리포트 (Horizontal Bar Chart) -->
        <div class="chart-card ai-card">
          <div class="chart-header">
            <h3 class="chart-title">AI 리스크 진단 리포트</h3>
            <p class="chart-subtitle">AI가 감지한 잠재적 일정 리스크 요인을 시각화했습니다.</p>
          </div>
          <div class="chart-body ai-card-content">
            <div v-if="isAIDataLoading" class="ai-loading-container">
              <p class="ai-placeholder ai-loading-text">
                AI 분석 데이터를 준비중입니다<span class="ai-dot ai-dot-1">.</span><span class="ai-dot ai-dot-2">.</span><span class="ai-dot ai-dot-3">.</span>
              </p>
            </div>
            <div v-else-if="riskChartSeries.length > 0 && riskChartSeries[0].data.length > 0" class="ai-chart-container">
              <apexchart
                type="bar"
                height="230"
                :options="riskChartOptions"
                :series="riskChartSeries"
              />
            </div>
            <div v-else class="ai-empty-state">
              <p>리스크 데이터를 불러올 수 없습니다.</p>
            </div>
          </div>
        </div>

        <!-- 차트 4: 프로젝트 진행률 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">프로젝트 진행률</h3>
          </div>
          <div class="chart-body">
            <apexchart
              type="donut"
              height="280"
              :options="progressChartOptions"
              :series="progressChartSeries"
            />
          </div>
        </div>

        <!-- 차트 5: 스톤 완료 현황 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">스톤 완료 현황</h3>
          </div>
          <div class="chart-body">
            <apexchart
              type="donut"
              height="280"
              :options="stoneDonutChartOptions"
              :series="stoneDonutChartSeries"
            />
          </div>
        </div>

        <!-- 차트 6: 태스크 완료 현황 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 class="chart-title">태스크 완료 현황</h3>
          </div>
          <div class="chart-body">
            <apexchart
              type="donut"
              height="280"
              :options="taskDonutChartOptions"
              :series="taskDonutChartSeries"
            />
          </div>
        </div>

        <!-- 차트 7: 요약 카드 (2행 4번째) -->
        <div class="chart-card summary-cards-container">
          <div class="summary-grid">
            <!-- 카드 1: 평균 태스크 완료 시간 -->
            <div class="summary-card-item summary-card-1">
              <div class="summary-icon-box summary-icon-1">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-info">
                <div class="summary-label">평균 태스크 완료 시간</div>
                <div class="summary-value">{{ formattedAvgTaskTime }}</div>
              </div>
            </div>
            
            <!-- 카드 2: 지연 태스크 수 -->
            <div class="summary-card-item summary-card-2">
              <div class="summary-icon-box summary-icon-2">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-info">
                <div class="summary-label">지연 태스크 수</div>
                <div class="summary-value">{{ summaryStats.lazyTaskCount }} 개</div>
              </div>
            </div>
            
            <!-- 카드 3: 문서 총 개수 -->
            <div class="summary-card-item summary-card-3">
              <div class="summary-icon-box summary-icon-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-info">
                <div class="summary-label">문서 총 개수</div>
                <div class="summary-value">{{ summaryStats.totalDocumentCount }} 개</div>
              </div>
            </div>
            
            <!-- 카드 4: 문서 총 용량 -->
            <div class="summary-card-item summary-card-4">
              <div class="summary-icon-box summary-icon-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V9L14 4H7C5.89543 4 5 4.89543 5 6V19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M14 4V9H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M9 13H15M9 17H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="summary-info">
                <div class="summary-label">문서 총 용량</div>
                <div class="summary-value">{{ formattedDocumentSize }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 차트 8: 완료 추이 -->
        <div class="chart-card chart-wide">
          <div class="chart-header chart-header-with-options">
            <h3 class="chart-title">스톤/태스크 완료 추이</h3>
            <div class="chart-options">
              <button 
                v-for="(option, index) in trendPeriodOptions" 
                :key="option.value"
                class="period-btn" 
                :class="[
                  { active: trendPeriod === option.value },
                  index % 2 === 0 ? 'period-btn-green' : 'period-btn-blue'
                ]"
                @click="trendPeriod = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          <!-- ✅ 가로 스크롤 가능한 래퍼 + 내부 width 고정 -->
          <div class="chart-body chart-body-scroll">
            <div class="trend-chart-inner" :style="{ width: trendChartWidth }">
              <apexchart
                ref="trendChart"
                type="area"
                width="100%"
                height="350"
                :options="completionTrendChartOptions"
                :series="filteredCompletionTrendChartSeries"
              />
            </div>
          </div>
        </div>

      </div>

      <!-- 인원 현황 영역 -->
      <ProjectPeopleOverviewTable 
        :overview="peopleOverview" 
        :loading="loadingPeople"
        :error="peopleError"
      />

    </div>
  </div>
</template>

<script>
import axios from 'axios';
import ProjectPeopleOverviewTable from '@/components/project/ProjectPeopleOverviewTable.vue';
import { getProjectPeopleOverview } from '@/services/projectService.js';
import VueApexCharts from 'vue3-apexcharts';

export default {
  name: "ProjectDashboard",
  components: {
    ProjectPeopleOverviewTable,
    apexchart: VueApexCharts
  },
  props: {
    projectId: {
      type: [String, Number],
      required: true
    }
  },
  
  data() {
    return {
      loading: false,
      loadingPeople: false,
      peopleOverview: null,
      peopleError: null,
      projectStats: {
        totalStones: 0,
        completedStones: 0,
        progress: 0,
        totalTasks: 0,
        completedTasks: 0
      },
      // Summary 카드 데이터
      summaryStats: {
        avgTaskCompletedTime: 0,
        lazyTaskCount: 0,
        totalDocumentCount: 0,
        totalDocumentSize: 0
      },
      // AI 분석 데이터
      isAIDataLoading: true,
      aiAnalysisData: {
        analysisReport: null,
        predictedCompletionTrend: [],
        riskFactors: []
      },
      // 완료 추이 기간 필터
      trendPeriod: 'all',
      // 더미 데이터 (완료 추이)
      completionTrendData: {
        projectStartDate: "2025-10-01",
        today: "2025-12-31",
        stoneCompletedList: [
          { "date": "2025-10-03", "count": 1 },
          { "date": "2025-10-10", "count": 2 },
          { "date": "2025-10-17", "count": 1 },
          { "date": "2025-10-25", "count": 3 },
          { "date": "2025-11-02", "count": 2 },
          { "date": "2025-11-10", "count": 2 },
          { "date": "2025-11-18", "count": 1 },
          { "date": "2025-11-27", "count": 2 },
          { "date": "2025-12-05", "count": 2 },
          { "date": "2025-12-12", "count": 3 },
          { "date": "2025-12-19", "count": 1 },
          { "date": "2025-12-28", "count": 2 }
        ],
        taskCompletedList: [
          { "date": "2025-10-02", "count": 3 },
          { "date": "2025-10-05", "count": 5 },
          { "date": "2025-10-09", "count": 4 },
          { "date": "2025-10-14", "count": 6 },
          { "date": "2025-10-21", "count": 7 },
          { "date": "2025-10-28", "count": 5 },
          { "date": "2025-11-04", "count": 8 },
          { "date": "2025-11-11", "count": 7 },
          { "date": "2025-11-18", "count": 9 },
          { "date": "2025-11-25", "count": 6 },
          { "date": "2025-12-03", "count": 10 },
          { "date": "2025-12-10", "count": 7 },
          { "date": "2025-12-17", "count": 9 },
          { "date": "2025-12-24", "count": 8 },
          { "date": "2025-12-30", "count": 6 }
        ]
      },
      // 프로젝트 진행률 차트 옵션
      progressChartOptions: {
        chart: {
          type: 'donut',
          fontFamily: 'Pretendard, sans-serif',
          toolbar: {
            show: false
          }
        },
        tooltip: {
          enabled: false
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            filter: {
              type: 'none'
            }
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#666666',
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111827',
                  offsetY: 5,
                  formatter: function(val) {
                    return val + '%';
                  }
                },
                total: {
                  show: true,
                  label: '진행률',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666666',
                  formatter: function(w) {
                    // 첫 번째 값(완료 퍼센트)을 가져오기
                    return w.globals.seriesTotals[0] + '%';
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '14px',
            fontWeight: 700,
            colors: ['#000']
          },
          dropShadow: {
            enabled: false
          }
        },
        labels: ['완료', '미완료'],
        colors: ['#FFE364', '#E5E7EB'],
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '14px',
          fontWeight: 600,
          labels: {
            colors: '#666666'
          },
          markers: {
            width: 12,
            height: 12,
            radius: 2
          }
        },
        stroke: {
          width: 0
        }
      },
      // 스톤 완료 현황 도넛 차트 옵션
      stoneDonutChartOptions: {
        chart: {
          type: 'donut',
          fontFamily: 'Pretendard, sans-serif',
          toolbar: {
            show: false
          }
        },
        tooltip: {
          enabled: false
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            filter: {
              type: 'none'
            }
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#666666',
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111827',
                  offsetY: 5,
                  formatter: function(val) {
                    return val;
                  }
                },
                total: {
                  show: true,
                  label: '총 스톤',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666666',
                  formatter: function(w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '14px',
            fontWeight: 700,
            colors: ['#000']
          },
          dropShadow: {
            enabled: false
          }
        },
        labels: ['완료', '미완료'],
        colors: ['#4ADE80', '#E5E7EB'],
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '14px',
          fontWeight: 600,
          labels: {
            colors: '#666666'
          },
          markers: {
            width: 12,
            height: 12,
            radius: 2
          }
        },
        stroke: {
          width: 0
        }
      },
      // 태스크 완료 현황 도넛 차트 옵션
      taskDonutChartOptions: {
        chart: {
          type: 'donut',
          fontFamily: 'Pretendard, sans-serif',
          toolbar: {
            show: false
          }
        },
        tooltip: {
          enabled: false
        },
        states: {
          hover: {
            filter: {
              type: 'none'
            }
          },
          active: {
            filter: {
              type: 'none'
            }
          }
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#666666',
                  offsetY: -10
                },
                value: {
                  show: true,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#111827',
                  offsetY: 5,
                  formatter: function(val) {
                    return val;
                  }
                },
                total: {
                  show: true,
                  label: '총 태스크',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666666',
                  formatter: function(w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                  }
                }
              }
            }
          }
        },
        dataLabels: {
          enabled: true,
          style: {
            fontSize: '14px',
            fontWeight: 700,
            colors: ['#000']
          },
          dropShadow: {
            enabled: false
          }
        },
        labels: ['완료', '미완료'],
        colors: ['#3B82F6', '#E5E7EB'],
        legend: {
          show: true,
          position: 'bottom',
          fontSize: '14px',
          fontWeight: 600,
          labels: {
            colors: '#666666'
          },
          markers: {
            width: 12,
            height: 12,
            radius: 2
          }
        },
        stroke: {
          width: 0
        }
      },
      // 완료 추이 차트 옵션
      completionTrendChartOptions: {
        chart: {
          type: 'area',
          fontFamily: 'Pretendard, sans-serif',
          width: '100%',
          toolbar: {
            show: false
          },
          zoom: {
            enabled: false
          }
        },
        dataLabels: {
          enabled: false
        },
        stroke: {
          curve: 'smooth',
          width: 3
        },
        markers: {
          size: 5,
          colors: ['#81C784', '#64B5F6'],
          strokeColors: '#FFFFFF',
          strokeWidth: 3,
          hover: {
            size: 7
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            opacityFrom: 0.6,
            opacityTo: 0.1,
          }
        },
        legend: {
          show: true,
          position: 'top',
          horizontalAlign: 'right',
          fontSize: '14px',
          fontWeight: 600,
          labels: {
            colors: '#666666'
          },
          markers: {
            width: 12,
            height: 12,
            radius: 2
          }
        },
        colors: ['#81C784', '#64B5F6'],
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'MM/dd',
            style: {
              colors: '#666666',
              fontSize: '12px'
            }
          },
          axisBorder: {
            show: true,
            color: '#D1D5DB'
          },
          axisTicks: {
            show: true,
            color: '#D1D5DB'
          }
        },
        yaxis: {
          title: {
            text: '완료 개수',
            style: {
              color: '#666666',
              fontSize: '13px',
              fontWeight: 600
            }
          },
          labels: {
            style: {
              colors: '#666666',
              fontSize: '12px'
            },
            formatter: function(val) {
              return Math.floor(val);
            }
          },
          forceNiceScale: true,
          decimalsInFloat: 0
        },
        grid: {
          borderColor: '#D1D5DB',
          strokeDashArray: 4
        },
        tooltip: {
          enabled: true,
          shared: true,
          intersect: false,
          x: {
            format: 'yyyy-MM-dd'
          },
          y: {
            formatter: function(val) {
              return val + '개';
            }
          }
        },
        responsive: [{
          breakpoint: 10000,
          options: {
            chart: {
              width: '100%'
            }
          }
        }]
      }
    };
  },
  
  computed: {
    // Summary 카드 포맷팅
    formattedAvgTaskTime() {
      const time = this.summaryStats.avgTaskCompletedTime || 0;
      return time.toFixed(1) + ' 일';
    },
    formattedDocumentSize() {
      const sizeInBytes = this.summaryStats.totalDocumentSize || 0;
      if (sizeInBytes === 0) return '0 B';
      
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const k = 1024;
      const i = Math.floor(Math.log(sizeInBytes) / Math.log(k));
      const size = (sizeInBytes / Math.pow(k, i)).toFixed(1);
      
      return size + ' ' + units[i];
    },
    
    progressChartSeries() {
      const progress = this.projectStats.progress || 0;
      const remaining = 100 - progress;
      return [progress, remaining];
    },
    stoneDonutChartSeries() {
      const completed = this.projectStats.completedStones || 0;
      const incomplete = (this.projectStats.totalStones || 0) - completed;
      return [completed, incomplete];
    },
    taskDonutChartSeries() {
      const completed = this.projectStats.completedTasks || 0;
      const incomplete = (this.projectStats.totalTasks || 0) - completed;
      return [completed, incomplete];
    },
    completionTrendChartSeries() {
      // 스톤 완료 데이터
      const stoneData = this.completionTrendData.stoneCompletedList.map(item => ({
        x: new Date(item.date).getTime(),
        y: item.count
      }));
      
      // 태스크 완료 데이터
      const taskData = this.completionTrendData.taskCompletedList.map(item => ({
        x: new Date(item.date).getTime(),
        y: item.count
      }));
      
      return [
        {
          name: '스톤 완료',
          data: stoneData
        },
        {
          name: '태스크 완료',
          data: taskData
        }
      ];
    },
    
    // 기간 필터링된 완료 추이 데이터
    filteredCompletionTrendChartSeries() {
      const today = new Date(this.completionTrendData.today);
      let cutoffDate;
      
      switch(this.trendPeriod) {
        case '3days':
          cutoffDate = new Date(today);
          cutoffDate.setDate(today.getDate() - 3);
          break;
        case '1week':
          cutoffDate = new Date(today);
          cutoffDate.setDate(today.getDate() - 7);
          break;
        case '2weeks':
          cutoffDate = new Date(today);
          cutoffDate.setDate(today.getDate() - 14);
          break;
        case '1month':
          cutoffDate = new Date(today);
          cutoffDate.setMonth(today.getMonth() - 1);
          break;
        case '2months':
          cutoffDate = new Date(today);
          cutoffDate.setMonth(today.getMonth() - 2);
          break;
        case '3months':
          cutoffDate = new Date(today);
          cutoffDate.setMonth(today.getMonth() - 3);
          break;
        case '6months':
          cutoffDate = new Date(today);
          cutoffDate.setMonth(today.getMonth() - 6);
          break;
        case 'all':
        default:
          cutoffDate = new Date(this.completionTrendData.projectStartDate);
          break;
      }
      
      // 스톤 완료 데이터 필터링
      const stoneData = this.completionTrendData.stoneCompletedList
        .filter(item => new Date(item.date) >= cutoffDate)
        .map(item => ({
          x: new Date(item.date).getTime(),
          y: item.count
        }));
      
      // 태스크 완료 데이터 필터링
      const taskData = this.completionTrendData.taskCompletedList
        .filter(item => new Date(item.date) >= cutoffDate)
        .map(item => ({
          x: new Date(item.date).getTime(),
          y: item.count
        }));
      
      return [
        {
          name: '스톤 완료',
          data: stoneData
        },
        {
          name: '태스크 완료',
          data: taskData
        }
      ];
    },
    
    // 완료 추이 기간 옵션 (동적 생성)
    trendPeriodOptions() {
      const start = new Date(this.completionTrendData.projectStartDate);
      const end = new Date(this.completionTrendData.today);
      const diffMs = end - start;
      const dayMs = 1000 * 60 * 60 * 24;
      const totalDays = diffMs > 0 ? Math.floor(diffMs / dayMs) + 1 : 1;
      
      const options = [];
      
      // 전체 기간에 따라 적절한 옵션 생성
      if (totalDays <= 7) {
        // 1주일 이하 프로젝트
        options.push({ value: '3days', label: '최근 3일' });
        options.push({ value: '1week', label: '전체 (7일)' });
      } else if (totalDays <= 30) {
        // 1달 이하 프로젝트
        options.push({ value: '1week', label: '최근 1주일' });
        options.push({ value: '2weeks', label: '최근 2주일' });
      } else if (totalDays <= 90) {
        // 3개월 이하 프로젝트
        options.push({ value: '1week', label: '최근 1주일' });
        options.push({ value: '1month', label: '최근 1달' });
        options.push({ value: '2months', label: '최근 2달' });
      } else if (totalDays <= 180) {
        // 6개월 이하 프로젝트
        options.push({ value: '1month', label: '최근 1달' });
        options.push({ value: '3months', label: '최근 3달' });
      } else {
        // 6개월 이상 프로젝트
        options.push({ value: '1month', label: '최근 1달' });
        options.push({ value: '3months', label: '최근 3달' });
        options.push({ value: '6months', label: '최근 6달' });
      }
      
      // 전체는 항상 마지막에 추가
      options.push({ value: 'all', label: '전체' });
      
      return options;
    },
    
    // ✅ 추이 차트 가로 길이 계산 (기간 기반)
    trendChartWidth() {
      // 프로젝트 기간 기준으로 일 수 계산
      const start = new Date(this.completionTrendData.projectStartDate);
      const end = new Date(this.completionTrendData.today);
      const diffMs = end - start;
      const dayMs = 1000 * 60 * 60 * 24;
      
      const days = diffMs > 0 ? Math.floor(diffMs / dayMs) + 1 : 1;
      
      // 하루당 40px 정도로 잡고, 최소 800px은 보장
      const pxPerDay = 40;
      const minWidth = 800;
      
      const width = Math.max(days * pxPerDay, minWidth);
      return width + 'px';
    },
    
    // AI 일정 예측 트렌드 차트 (신뢰도 Line Chart)
    confidenceTrendChartSeries() {
      if (!this.aiAnalysisData.predictedCompletionTrend || this.aiAnalysisData.predictedCompletionTrend.length === 0) {
        return [];
      }
      
      const data = this.aiAnalysisData.predictedCompletionTrend.map(item => ({
        x: new Date(item.date).getTime(),
        y: (item.confidence * 100).toFixed(1)
      }));
      
      return [{
        name: '신뢰도',
        data: data
      }];
    },
    
    confidenceTrendChartOptions() {
      return {
        chart: {
          type: 'line',
          fontFamily: 'Pretendard, sans-serif',
          toolbar: {
            show: false
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: {
              enabled: true,
              delay: 150
            },
            dynamicAnimation: {
              enabled: true,
              speed: 350
            }
          }
        },
        stroke: {
          curve: 'smooth',
          width: 4
        },
        markers: {
          size: 6,
          colors: ['#c084fc'],
          strokeColors: '#FFFFFF',
          strokeWidth: 3,
          hover: {
            size: 8
          }
        },
        fill: {
          type: 'gradient',
          gradient: {
            shade: 'light',
            type: 'vertical',
            shadeIntensity: 0.5,
            gradientToColors: ['#f9a8d4'],
            opacityFrom: 0.7,
            opacityTo: 0.3,
          }
        },
        colors: ['#c084fc'],
        dataLabels: {
          enabled: false
        },
        xaxis: {
          type: 'datetime',
          labels: {
            format: 'MM/dd',
            style: {
              colors: '#666666',
              fontSize: '12px'
            }
          },
          axisBorder: {
            show: true,
            color: '#D1D5DB'
          },
          axisTicks: {
            show: true,
            color: '#D1D5DB'
          }
        },
        yaxis: {
          min: 0,
          max: 100,
          title: {
            text: '신뢰도 (%)',
            style: {
              color: '#666666',
              fontSize: '13px',
              fontWeight: 600
            }
          },
          labels: {
            style: {
              colors: '#666666',
              fontSize: '12px'
            },
            formatter: function(val) {
              return val.toFixed(0) + '%';
            }
          }
        },
        grid: {
          borderColor: '#D1D5DB',
          strokeDashArray: 4
        },
        tooltip: {
          enabled: true,
          x: {
            format: 'yyyy-MM-dd'
          },
          y: {
            formatter: function(val) {
              return val + '%';
            },
            title: {
              formatter: function() {
                return '신뢰도';
              }
            }
          }
        }
      };
    },
    
    // AI 리스크 차트 (Horizontal Bar Chart)
    riskChartSeries() {
      if (!this.aiAnalysisData.riskFactors || this.aiAnalysisData.riskFactors.length === 0) {
        return [];
      }
      
      const data = this.aiAnalysisData.riskFactors.map(item => ({
        x: item.factor,
        y: (item.riskLevel * 100).toFixed(1)
      }));
      
      return [{
        name: '위험도',
        data: data
      }];
    },
    
    riskChartOptions() {
      const colors = this.aiAnalysisData.riskFactors.map(item => 
        item.riskLevel >= 0.7 ? '#fb7185' : 
        item.riskLevel >= 0.4 ? '#fbbf24' : 
        '#60a5fa'
      );
      
      return {
        chart: {
          type: 'bar',
          fontFamily: 'Pretendard, sans-serif',
          toolbar: {
            show: false
          },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '60%',
            distributed: true,
            dataLabels: {
              position: 'top'
            }
          }
        },
        colors: colors,
        dataLabels: {
          enabled: true,
          textAnchor: 'start',
          style: {
            colors: ['#333333'],
            fontSize: '12px',
            fontWeight: 600
          },
          formatter: function(val) {
            return val + '%';
          },
          offsetX: 10,
          dropShadow: {
            enabled: false
          }
        },
        xaxis: {
          min: 0,
          max: 100,
          labels: {
            style: {
              colors: '#666666',
              fontSize: '12px'
            },
            formatter: function(val) {
              return val + '%';
            }
          },
          title: {
            text: '위험도 (%)',
            style: {
              color: '#666666',
              fontSize: '13px',
              fontWeight: 600
            }
          }
        },
        yaxis: {
          labels: {
            style: {
              colors: '#666666',
              fontSize: '12px'
            },
            align: 'left'
          }
        },
        grid: {
          borderColor: '#D1D5DB',
          strokeDashArray: 4,
          xaxis: {
            lines: {
              show: true
            }
          },
          yaxis: {
            lines: {
              show: false
            }
          }
        },
        tooltip: {
          enabled: true,
          y: {
            formatter: function(val) {
              return val + '%';
            },
            title: {
              formatter: function() {
                return '위험도';
              }
            }
          }
        },
        legend: {
          show: false
        }
      };
    },
    
  },
  
  
  async mounted() {
    await this.loadDashboardData();
    await this.loadPeopleOverview();
    await this.loadAIAnalysis();
    this.logContainerHeights();
  },
  
  updated() {
    this.logContainerHeights();
  },
  
  watch: {
    projectId() {
      this.loadDashboardData();
      this.loadPeopleOverview();
    }
  },
  
  methods: {
    async loadDashboardData() {
      this.loading = true;
      try {
        await this.loadDashboardStats();
      } catch (error) {
        console.error('대시보드 데이터 로딩 실패:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadDashboardStats() {
      try {
        const userId = localStorage.getItem('id');
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        
        const response = await axios.get(
          `${baseURL}/workspace-service/project/dashboard/${this.projectId}`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200 && response.data.result) {
          const dashboardData = response.data.result;
          
          // 프로젝트 마일스톤 (진행률)
          this.projectStats.progress = dashboardData.projectMilestone 
            ? Math.round(Number(dashboardData.projectMilestone)) 
            : 0;
          
          // 스톤 통계
          this.projectStats.totalStones = dashboardData.totalStoneCount || 0;
          this.projectStats.completedStones = dashboardData.completedStoneCount || 0;
          
          // 태스크 통계
          this.projectStats.totalTasks = dashboardData.totalTaskCount || 0;
          this.projectStats.completedTasks = dashboardData.completedTaskCount || 0;
          
          // Summary 카드 데이터
          this.summaryStats.avgTaskCompletedTime = dashboardData.avgTaskCompletedTime || 0;
          this.summaryStats.lazyTaskCount = dashboardData.lazyTasklist ? dashboardData.lazyTasklist.length : 0;
          
          // 문서 통계
          if (dashboardData.elementCountAndSizeResDto) {
            const docData = dashboardData.elementCountAndSizeResDto;
            this.summaryStats.totalDocumentCount = (docData.fileCount || 0) + (docData.documentCount || 0);
            this.summaryStats.totalDocumentSize = docData.totalSize || 0;
          }
          
          // 완료 추이 데이터 처리
          this.processCompletionTrendData(
            dashboardData.completedStoneList || [],
            dashboardData.completedTaskList || []
          );
        }
      } catch (error) {
        console.error('대시보드 통계 로딩 실패:', error);
      }
    },
    
    processCompletionTrendData(completedStoneList, completedTaskList) {
      // 날짜별로 완료된 스톤 수 집계
      const stoneCountMap = {};
      completedStoneList.forEach(stone => {
        if (stone.stoneCompletedDay) {
          const date = stone.stoneCompletedDay.split('T')[0]; // "2025-11-05"
          stoneCountMap[date] = (stoneCountMap[date] || 0) + 1;
        }
      });
      
      // 날짜별로 완료된 태스크 수 집계
      const taskCountMap = {};
      completedTaskList.forEach(task => {
        if (task.taskCompletedDay) {
          const date = task.taskCompletedDay.split('T')[0]; // "2025-11-05"
          taskCountMap[date] = (taskCountMap[date] || 0) + 1;
        }
      });
      
      // 배열로 변환하여 날짜순 정렬
      this.completionTrendData.stoneCompletedList = Object.entries(stoneCountMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      this.completionTrendData.taskCompletedList = Object.entries(taskCountMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // 프로젝트 시작일과 오늘 날짜 설정 (추이 차트 범위 계산용)
      const allDates = [
        ...Object.keys(stoneCountMap),
        ...Object.keys(taskCountMap)
      ].sort();
      
      if (allDates.length > 0) {
        this.completionTrendData.projectStartDate = allDates[0];
        this.completionTrendData.today = new Date().toISOString().split('T')[0];
      }
      
      console.log('📊 완료 추이 데이터 처리 완료:', this.completionTrendData);
    },
    
    async loadAIAnalysis() {
      this.isAIDataLoading = true;
      try {
        const userId = localStorage.getItem('id');
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        
        const response = await axios.get(
          `${baseURL}/workspace-service/chatbot/project/${this.projectId}/dashboard`,
          {
            headers: {
              'X-User-Id': userId
            }
          }
        );
        
        if (response.data.statusCode === 200 && response.data.result) {
          const aiData = response.data.result;
          
          console.log('📥 AI 데이터 수신 완료, 분석 중...');
          
          // 1초 지연 - AI가 분석하는 느낌
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          this.aiAnalysisData.analysisReport = aiData.analysisReport || null;
          this.aiAnalysisData.predictedCompletionTrend = aiData.predictedCompletionTrend || [];
          this.aiAnalysisData.riskFactors = aiData.riskFactors || [];
          
          console.log('✅ AI 분석 완료:', this.aiAnalysisData);
        }
      } catch (error) {
        console.error('❌ AI 분석 데이터 로딩 실패:', error);
        // 에러 시에도 4초 지연 없이 바로 로딩 해제
      } finally {
        this.isAIDataLoading = false;
      }
    },
    
    
    async loadPeopleOverview() {
      this.loadingPeople = true;
      this.peopleError = null;
      
      // Mock 모드 (테스트용)
      const useMock = false;
      
      if (useMock) {
        // 샘플 데이터
        this.peopleOverview = {
          totalPeopleCount: 5,
          managerCount: 3,
          participantOnlyCount: 2,
          people: [
            {
              user: {
                userId: "user1",
                userName: "홍길동",
                userEmail: "hong@example.com",
                profileImageUrl: null
              },
              ownedStoneCount: 3,
              participatingStoneCount: 5,
              ownedStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s3", stoneName: "디자인" },
                { stoneId: "s4", stoneName: "기획" }
              ],
              participatingStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s3", stoneName: "디자인" },
                { stoneId: "s4", stoneName: "기획" },
                { stoneId: "s5", stoneName: "QA" }
              ],
              myTaskTotal: 10,
              myTaskCompleted: 7
            },
            {
              user: {
                userId: "user2",
                userName: "김철수",
                userEmail: "kim@example.com",
                profileImageUrl: null
              },
              ownedStoneCount: 2,
              participatingStoneCount: 3,
              ownedStones: [
                { stoneId: "s6", stoneName: "인프라" },
                { stoneId: "s7", stoneName: "배포" }
              ],
              participatingStones: [
                { stoneId: "s1", stoneName: "프론트엔드" },
                { stoneId: "s2", stoneName: "백엔드" },
                { stoneId: "s6", stoneName: "인프라" }
              ],
              myTaskTotal: 8,
              myTaskCompleted: 5
            }
          ]
        };
        this.loadingPeople = false;
        return;
      }
      
      try {
        const overview = await getProjectPeopleOverview(this.projectId);
        this.peopleOverview = overview;
      } catch (error) {
        console.error('인원 현황 로딩 실패:', error);
        this.peopleError = error.message || '인원 현황을 불러오는 중 오류가 발생했습니다.';
        this.peopleOverview = null;
      } finally {
        this.loadingPeople = false;
      }
    },
    
    logContainerHeights() {
      this.$nextTick(() => {
        const container = this.$el;
        const dashboardContent = container?.querySelector('.dashboard-content');
        
        console.log('=== 대시보드 컨테이너 높이 정보 ===');
        
        if (container) {
          const containerStyle = window.getComputedStyle(container);
          console.log('프로젝트 대시보드 컨테이너:');
          console.log('  - offsetHeight:', container.offsetHeight, 'px');
          console.log('  - scrollHeight:', container.scrollHeight, 'px');
          console.log('  - clientHeight:', container.clientHeight, 'px');
          console.log('  - style.height:', container.style.height || 'none');
          console.log('  - computed height:', containerStyle.height);
          console.log('  - computed max-height:', containerStyle.maxHeight);
          console.log('  - computed overflow-y:', containerStyle.overflowY);
        }
        
        if (dashboardContent) {
          console.log('대시보드 콘텐츠:');
          console.log('  - offsetHeight:', dashboardContent.offsetHeight, 'px');
          console.log('  - scrollHeight:', dashboardContent.scrollHeight, 'px');
          console.log('  - clientHeight:', dashboardContent.clientHeight, 'px');
        }
        
        if (container) {
          const canScroll = container.scrollHeight > container.clientHeight;
          console.log('컨테이너 스크롤 가능 여부:');
          console.log('  - 스크롤 가능:', canScroll);
          console.log('  - scrollTop:', container.scrollTop, 'px');
          console.log('  - 최대 scrollTop:', container.scrollHeight - container.clientHeight, 'px');
        }
        
        // 부모 컨테이너도 확인
        const parentContainer = container?.parentElement;
        if (parentContainer) {
          const parentStyle = window.getComputedStyle(parentContainer);
          console.log('부모 컨테이너 (.dashboard-container):');
          console.log('  - offsetHeight:', parentContainer.offsetHeight, 'px');
          console.log('  - scrollHeight:', parentContainer.scrollHeight, 'px');
          console.log('  - clientHeight:', parentContainer.clientHeight, 'px');
          console.log('  - className:', parentContainer.className);
          console.log('  - style.height:', parentContainer.style.height || 'none');
          console.log('  - computed height:', parentStyle.height);
          console.log('  - computed overflow:', parentStyle.overflow);
        }
        
        // 최상위 부모도 확인
        const grandParent = parentContainer?.parentElement;
        if (grandParent) {
          const grandParentStyle = window.getComputedStyle(grandParent);
          console.log('조부모 컨테이너 (.other-tabs):');
          console.log('  - offsetHeight:', grandParent.offsetHeight, 'px');
          console.log('  - scrollHeight:', grandParent.scrollHeight, 'px');
          console.log('  - clientHeight:', grandParent.clientHeight, 'px');
          console.log('  - className:', grandParent.className);
          console.log('  - style.height:', grandParent.style.height || 'none');
          console.log('  - computed height:', grandParentStyle.height);
          console.log('  - computed flex:', grandParentStyle.flex);
        }
        
        console.log('=== 높이 정보 끝 ===\n');
      });
    }
    
  }
};
</script>

<style>
.project-dashboard-container {
  width: 100%;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  padding: 0px 8px 30px 8px;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
  position: relative;
  flex: 1 1 100%;
  min-width: 0;
}

.project-dashboard-container::-webkit-scrollbar {
  width: 8px;
}

.project-dashboard-container::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.project-dashboard-container::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 4px;
  transition: background 0.3s ease;
}

/* 스크롤 시에만 스크롤바 표시 */
.project-dashboard-container:hover::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
}

.project-dashboard-container::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.4);
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-text {
  font-size: 16px;
  color: #666;
}

.dashboard-content {
  max-width: 100%;
  margin: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: visible;
}

/* 차트 영역 */
.charts-section {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  margin-bottom: 30px;
  width: 100%;
  min-width: 0;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  min-height: 350px;
  display: flex;
  flex-direction: column;
}

/* 1행: AI 카드 3개 - 각각 4칸씩 (더 넓게) */
.chart-card:nth-child(1),
.chart-card:nth-child(2),
.chart-card:nth-child(3) {
  grid-column: span 4;
  min-height: 350px;
  max-height: 350px;
}

/* 2행: 도넛 차트 4개 - 각각 3칸씩 */
.chart-card:nth-child(4),
.chart-card:nth-child(5),
.chart-card:nth-child(6),
.chart-card:nth-child(7) {
  grid-column: span 3;
  min-height: 400px;
  max-height: 400px;
}

/* 넓은 카드 (8번 이후만 적용) */
.chart-card.chart-wide {
  grid-column: 1 / -1 !important;
  width: 100% !important;
  min-height: 450px;
  margin: 0 !important;
  box-sizing: border-box;
}

.chart-header {
  margin-bottom: 20px;
  padding-bottom: 0;
}

.chart-header-with-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-options {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.period-btn {
  padding: 6px 12px;
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  font-family: 'Pretendard', sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #666666;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.period-btn:focus {
  outline: none;
}

.period-btn:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}

/* 초록색 버튼 (짝수 인덱스: 0, 2, 4...) */
.period-btn-green.active {
  background: #81C784;
  border-color: #81C784;
  color: #FFFFFF;
  font-weight: 600;
}

.period-btn-green:hover:not(.active) {
  background: rgba(129, 199, 132, 0.1);
  border-color: #81C784;
}

/* 파란색 버튼 (홀수 인덱스: 1, 3, 5...) */
.period-btn-blue.active {
  background: #64B5F6;
  border-color: #64B5F6;
  color: #FFFFFF;
  font-weight: 600;
}

.period-btn-blue:hover:not(.active) {
  background: rgba(100, 181, 246, 0.1);
  border-color: #64B5F6;
}

.chart-title {
  font-family: 'Pretendard', sans-serif;
  font-weight: 700;
  font-size: 18px;
  color: #666666;
  margin: 0;
}

.chart-subtitle {
  font-family: 'Pretendard', sans-serif;
  font-weight: 400;
  font-size: 12px;
  color: #666666;
  margin: 6px 0 0 0;
  padding-left: 8px;
  line-height: 1.4;
}

.chart-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 250px;
  width: 100%;
}

.chart-wide .chart-body {
  align-items: stretch;
  justify-content: stretch;
  padding: 10px 0;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 100% !important;
  height: 100%;
  min-height: 350px;
  flex-grow: 1;
  flex: 1;
}

.chart-wide .chart-body .apexcharts-canvas {
  width: 100% !important;
  max-width: 100% !important;
}

.chart-wide .chart-body svg {
  width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
}

.chart-wide .chart-body .apexcharts-graphical {
  width: 100% !important;
}

/* ✅ 추이 그래프 가로 스크롤용 */
.chart-body-scroll {
  overflow-x: auto;
  overflow-y: hidden;
}

/* ✅ 실제 차트 캔버스가 붙는 영역 */
.trend-chart-inner {
  min-width: 800px;
}

/* 🔮 AI 카드 오로라 효과 */
.ai-card {
  position: relative;
  overflow: hidden;
  background: #FFFFFF;
  backdrop-filter: blur(20px);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 0 25px rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

/* 오로라 효과 */
.ai-card::before {
  content: "";
  position: absolute;
  inset: -50%;
  background: conic-gradient(
    from 0deg,
    rgba(0, 255, 255, 0.2),
    rgba(255, 0, 255, 0.2),
    rgba(255, 255, 0, 0.2),
    rgba(0, 255, 255, 0.2)
  );
  filter: blur(80px);
  animation: auroraFlow 8s linear infinite;
  z-index: 0;
}

@keyframes auroraFlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* AI 카드 내용이 오로라 위에 보이도록 */
.ai-card-content {
  position: relative;
  z-index: 1;
}

.ai-card .chart-header {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.ai-placeholder {
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  margin: 0;
  position: relative;
}

/* AI 로딩 텍스트 shimmer 효과 */
.ai-loading-text {
  background: linear-gradient(
    90deg,
    #7dd3fc 0%,
    #c084fc 25%,
    #f9a8d4 50%,
    #c084fc 75%,
    #7dd3fc 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: aiTextShimmer 3s ease-in-out infinite;
}

@keyframes aiTextShimmer {
  0% {
    background-position: 200% center;
  }
  100% {
    background-position: -200% center;
  }
}

/* AI 점(...) 깜빡임 */
.ai-dot {
  opacity: 0;
  animation: aiDotBlink 1.5s ease-in-out infinite;
}

.ai-dot-1 {
  animation-delay: 0s;
}

.ai-dot-2 {
  animation-delay: 0.3s;
}

.ai-dot-3 {
  animation-delay: 0.6s;
}

@keyframes aiDotBlink {
  0%, 100% {
    opacity: 0;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* AI 로딩 컨테이너 */
.ai-loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 150px;
}

/* AI 분석 리포트 텍스트 */
.ai-report-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  line-height: 1.8;
  color: #333333;
  padding: 20px;
  text-align: left;
  white-space: pre-line;
  overflow-y: auto;
  max-height: 250px;
}

/* AI 차트 컨테이너 */
.ai-chart-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
}

/* AI Empty State */
.ai-empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 150px;
}

.ai-empty-state p {
  font-family: 'Pretendard', sans-serif;
  font-size: 14px;
  color: #999999;
  text-align: center;
}

/* Placeholder 텍스트 */
.placeholder-text {
  font-family: 'Pretendard', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #999999;
  text-align: center;
  margin: 0;
}

/* 요약 카드 컨테이너 (2행 4번째) */
.summary-cards-container {
  padding: 14px !important;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
  height: 100%;
}

.summary-card-item {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding: 8px 12px;
  gap: 16px;
  border-radius: 10px;
  transition: all 0.2s ease;
}

.summary-card-1 {
  background: #fff3e0;
}

.summary-card-2 {
  background: #e3f2fd;
}

.summary-card-3 {
  background: #e8f5e9;
}

.summary-card-4 {
  background: #f3e5f5;
}

.summary-card-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 아이콘 박스 공통 스타일 */
.summary-icon-box {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.summary-icon-1 {
  background: #f59e0b;
  color: #FFFFFF;
}

.summary-icon-2 {
  background: #3b82f6;
  color: #FFFFFF;
}

.summary-icon-3 {
  background: #10b981;
  color: #FFFFFF;
}

.summary-icon-4 {
  background: #a855f7;
  color: #FFFFFF;
}

/* 공통 스타일 */
.summary-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.summary-label {
  font-family: 'Pretendard', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #666666;
  text-align: left;
  line-height: 1.3;
}

.summary-value {
  font-family: 'Pretendard', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #1C0F0F;
  text-align: left;
  line-height: 1.2;
}

/* 인사이트 항목 스타일 */
.insights-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  padding: 20px;
  align-items: start;
  justify-content: start;
}

.insight-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  background: #F9FAFB;
  border-radius: 12px;
  border: 1px solid #E5E7EB;
  transition: all 0.2s ease;
}

.insight-item:hover {
  background: #F3F4F6;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
}

.insight-label {
  font-family: 'Pretendard', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #666666;
  line-height: 1.4;
}

.insight-value {
  font-family: 'Pretendard', sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #1C0F0F;
}

/* 통계 카드 영역 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon img {
  width: 28px;
  height: 28px;
}

.stone-icon {
  background: #e3f2fd;
}

.completed-stone-icon {
  background: #e8f5e9;
}

.completed-task-icon {
  background: #f3e5f5;
}

.progress-icon {
  background: #fff3e0;
}

.task-icon {
  background: #f3e5f5;
}

.progress-circle {
  position: relative;
  width: 56px;
  height: 56px;
}

.circular-chart {
  width: 56px;
  height: 56px;
  transform: rotate(-90deg);
}

.circle-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 3;
}

.circle {
  fill: none;
  stroke: #ffa726;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 0.3s;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 12px;
  font-weight: 600;
  color: #ffa726;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

</style>
