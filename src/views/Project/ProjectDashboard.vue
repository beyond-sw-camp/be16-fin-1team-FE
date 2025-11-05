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

        <!-- 차트 7: 완료 추이 -->
        <div class="chart-card chart-wide">
          <div class="chart-header">
            <h3 class="chart-title">스톤/태스크 완료 추이</h3>
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
                :series="completionTrendChartSeries"
              />
            </div>
          </div>
        </div>

        <!-- 차트 8: AI 예상 완료일 -->
        <div class="chart-card chart-wide ai-card">
          <div class="chart-header">
            <h3 class="chart-title">AI 예상 완료일</h3>
          </div>
          <div class="chart-body ai-card-content">
            <p class="ai-placeholder ai-loading-text">
              AI가 프로젝트의 예상 완료일을 계산하고 있습니다<span class="ai-dot ai-dot-1">.</span><span class="ai-dot ai-dot-2">.</span><span class="ai-dot ai-dot-3">.</span>
            </p>
          </div>
        </div>

        <!-- 차트 9: 프로젝트 인사이트 -->
        <div class="chart-card chart-wide">
          <div class="chart-header">
            <h3 class="chart-title">프로젝트 인사이트</h3>
          </div>
          <div class="chart-body insights-body">
            <div class="insight-item">
              <div class="insight-label">평균 태스크 완료 시간</div>
              <div class="insight-value">-</div>
            </div>
            <div class="insight-item">
              <div class="insight-label">지연 태스크 수</div>
              <div class="insight-value">-</div>
            </div>
            <div class="insight-item">
              <div class="insight-label">문서 개수 / 문서 용량</div>
              <div class="insight-value">-</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 통계 카드 영역 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon progress-icon">
            <div class="progress-circle">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path 
                  class="circle" 
                  :stroke-dasharray="`${projectStats.progress}, 100`"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                />
              </svg>
              <span class="progress-text">{{ projectStats.progress }}%</span>
            </div>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.progress }}%</div>
            <div class="stat-label">프로젝트 진행률</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon stone-icon">
            <img src="@/assets/icons/project/stones_1.svg" alt="스톤" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.totalStones }}</div>
            <div class="stat-label">총 스톤 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon task-icon">
            <img src="@/assets/icons/home/file-document.svg" alt="Task" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.totalTasks }}</div>
            <div class="stat-label">총 태스크 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-stone-icon">
            <img src="@/assets/icons/project/stones_1.svg" alt="완료된 스톤" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.completedStones }} / {{ projectStats.totalStones }}</div>
            <div class="stat-label">완료된 스톤 수</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon completed-task-icon">
            <img src="@/assets/icons/home/file-document.svg" alt="완료된 Task" />
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projectStats.completedTasks }} / {{ projectStats.totalTasks }}</div>
            <div class="stat-label">완료된 태스크 수</div>
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
      // AI 분석 데이터
      isAIDataLoading: true,
      aiAnalysisData: {
        analysisReport: null,
        predictedCompletionTrend: [],
        riskFactors: []
      },
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
    }
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
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        
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
        }
      } catch (error) {
        console.error('대시보드 통계 로딩 실패:', error);
      }
    },
    
    async loadAIAnalysis() {
      this.isAIDataLoading = true;
      try {
        const userId = localStorage.getItem('id');
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
        
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
          
          // 4초 지연 - AI가 분석하는 느낌
          await new Promise(resolve => setTimeout(resolve, 4000));
          
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
.chart-card.chart-wide:nth-child(n+8) {
  grid-column: 1 / -1 !important;
  width: 100% !important;
  min-height: 450px;
  margin: 0 !important;
  box-sizing: border-box;
}

/* 7번 카드 (완료 추이)는 2행에 배치 */
.chart-card:nth-child(7) {
  grid-column: span 3;
  min-height: 400px;
  max-height: 400px;
}

.chart-header {
  margin-bottom: 20px;
  padding-bottom: 0;
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
