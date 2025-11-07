<template>
  <v-container fluid :class="['openvidu-container', { embedded: embedded }]">

    <!-- 포커스(단독) 뷰 또는 1인 접속 시 단독 뷰 -->
    <v-row v-if="focusedStreamManager || isAlone" class="main-video-row no-gutters">
      <v-col cols="12" md="12" class="main-video-area pa-0">
        <div id="main-video-container" :class="{ speaking: isSpeaking(singleViewStream), 'video-off': !isVideoActive(singleViewStream) }" @click="onSingleViewClick">
          <video-stream 
            v-if="isVideoActive(singleViewStream)"
            :stream-manager="singleViewStream" 
            :key="singleViewStream && singleViewStream.stream && singleViewStream.stream.streamId"
          />
          <div v-else class="video-placeholder">
            <img :src="userDefaultIcon" class="default-user-icon" alt="사용자 아이콘" />
          </div>
          <div class="nickname">
            {{ displayName(singleViewStream, singleViewStream === publisher) }}
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- 컨트롤바 영역 -->
    <div class="control-bar-overlay">
      <div class="control-bar">
        <div class="controls-wrapper">

          <!-- (중앙 그룹) 토글 버튼들 -->
          <div class="left-controls d-flex justify-center align-center">

            <div class="control-btn" @click="toggleAudio">
              <img :src="isAudioEnabled ? audioIconOn : audioIconOff" class="control-icon" />
            </div>

            <div class="control-btn" @click="toggleVideo">
              <img :src="isVideoEnabled ? videoIconOn : videoIconOff" class="control-icon" />
            </div>

            <div class="control-btn" @click="toggleScreenShare">
              <img :src="isScreenShareEnabled ? screenShareIconOff : screenShareIconOn" class="control-icon" />
            </div>

            <div class="control-btn" @click="leaveSession">
              <img :src="shutdownIcon" class="control-icon" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 전체화면 버튼 (오른쪽 하단) -->
    <div class="fullscreen-button-overlay">
      <img 
        :src="isFullScreenMode ? fullScreenIconOut : fullScreenIconIn" 
        class="fullscreen-icon" 
        @click="toggleFullScreen"
        alt="전체화면 토글" 
      />
    </div>

    <!-- 그리드(체스판) 레이아웃 -->
    <div v-if="!focusedStreamManager && !isAlone" class="grid-container" :style="gridStyle">
      <div 
        class="video-item" 
        v-for="sm in gridParticipants" 
        :key="sm.stream.streamId"
        :class="{ speaking: isSpeaking(sm), 'video-off': !isVideoActive(sm) }" 
        @click="toggleFocus(sm)"
      >
        <video-stream 
          v-if="isVideoActive(sm)"
          :stream-manager="sm" 
          :key="sm.stream.streamId"
        />
        <div v-else class="video-placeholder">
          <img :src="userDefaultIcon" class="default-user-icon" alt="사용자 아이콘" />
        </div>
        <div class="nickname">{{ displayName(sm, sm === publisher) }}</div>
      </div>
    </div>
  </v-container>
</template>

<script>
import axios from 'axios';
import { OpenVidu } from 'openvidu-browser';
import VideoStream from '../OpenVidu/VideoStream.vue';

// 아이콘 import
import recordFill from '@/assets/icons/OpenVidu/record-fill.svg';
import recordStop from '@/assets/icons/OpenVidu/record-stop.svg';
import micFill from '@/assets/icons/OpenVidu/mic-fill.svg';
import micOffFill from '@/assets/icons/OpenVidu/mic-off-fill.svg';
import vidOnFill from '@/assets/icons/OpenVidu/video-on-fill.svg';
import vidOffFill from '@/assets/icons/OpenVidu/video-off-fill.svg';
import shareScreenFill from '@/assets/icons/OpenVidu/share-box-fill.svg';
import shareScreenOff from '@/assets/icons/OpenVidu/share-box-off.svg';
import shutDownLine from '@/assets/icons/OpenVidu/shut-down-line.svg';
import fullScreeenIn from '@/assets/icons/OpenVidu/fullscreen-line.svg';
import fullScreeenOut from '@/assets/icons/OpenVidu/fullscreen-exit-line.svg';
import userDefaultIcon from '@/assets/icons/chat/user_defualt_reverse.svg';


export default {
  components: { VideoStream },
  props: {
    roomId: {
      type: [String, Number],
      default: null
    },
    embedded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      // pending streams received before we finish connecting
      _pendingStreams: [],
  // connectionId -> parsed client name cache
  _connectionClientMap: {},
      // bound handler references so we can remove them on cleanup
      _onStartSpeaking: null,
      _onStopSpeaking: null,
      _onStreamCreated: null,
      _onStreamDestroyed: null,
      _onConnectionDestroyed: null,
      OV: null,
      session: undefined,
      publisher: undefined,
      subscribers: [],
      mainStreamManager: null,
      mySessionId: null,
      myUserName: '',
      // 포커스(단독 표시) 대상. null이면 그리드 모드
      focusedStreamManager: null,
      // 말하기 상태: connectionId -> boolean
      speakingMap: {},

      isRecording: false, // 녹음 토글 상태
      recordingId: null,
      isAudioEnabled: true, // 오디오 토글 상태
      isVideoEnabled: true, // 비디오 토글 상태
      isScreenShareEnabled: false, // 화면 공유 상태
      wasVideoEnabledBeforeScreenShare: true, // 화면 공유 시작 전 비디오 상태 저장
      
      // replaceTrack 방식 전환을 위한 상태
      _camVideoTrack: null, // 초기 카메라 비디오 트랙 저장
      _screenStream: null, // 화면 공유 스트림 저장
      _replacing: false, // 전환 중 중복 호출 방지

      devices: [], // 장치 목록
      audioInput: null, // 선택된 오디오 입력 장치 ID
      videoInput: null, // 선택된 비디오 입력 장치 ID
      audioOutput: null, // 출력 장치 (OpenVidu 직접 제어 불가, Vuetify 바인딩용)

      inputVolume: 70, // 입력 음량 (0-100)
      outputVolume: 70, // 출력 음량 (0-100)

      isFullScreenMode: false,
  // local camera preview used when screen sharing (not published)
  cameraPreview: null,
  // overlay position (px) relative to #main-video-container
  overlayX: null,
  overlayY: null,
  overlayWidth: 260,
  overlayHeight: 180,
  overlayDragging: false,
  _overlayDragStart: null,
  _overlayPendingDrag: false,
  _overlayMouseMoveHandler: null,

      // 아이콘 설정
      recordStart: recordFill, // 녹화 시작 아이콘
      recordEnd: recordStop, // 녹화 종료 아이콘

      audioIconOn: micFill, // 마이크 켜짐 아이콘
      audioIconOff: micOffFill, // 마이크 꺼짐 아이콘

      videoIconOn: vidOnFill, // 비디오 켜짐 아이콘
      videoIconOff: vidOffFill, // 비디오 꺼짐 아이콘

      // 화면 공유 아이콘
      screenShareIconOn: shareScreenFill, // 화면 공유 시작
      screenShareIconOff: shareScreenOff, // 화면 공유 중지

      fullScreenIconIn: fullScreeenIn, // 전체화면 진입 아이콘
      fullScreenIconOut: fullScreeenOut, // 전체화면 종료 아이콘

      shutdownIcon: shutDownLine, // 종료 아이콘
      
      userDefaultIcon: userDefaultIcon, // 기본 사용자 아이콘
      
      // 새로고침/강제 리로드 관련
      _beforeUnloadBound: null,
      _refreshStorageKey: 'ov_refresh_count',
      _refreshLimit: 3,
    }
  },
  async created() {
    // 새로고침 횟수 체크: 너무 많이 새로고침 했으면 메인으로 돌려보냄
    try {
      const cnt = parseInt(sessionStorage.getItem(this._refreshStorageKey) || '0', 10) || 0;
      if (cnt >= this._refreshLimit) {
        alert('새로고침이 너무 많이 감지되어 메인 화면으로 이동합니다. 다시 접속해 주세요.');
        if (!this.embedded) {
          this.$router.push('/main');
        }
        return;
      }
    } catch (e) {
      console.debug('refresh count parse error', e);
    }
    // props로 받은 roomId 또는 route params의 roomId 사용
    const roomId = this.roomId || this.$route.params.roomId;
    if (!roomId) {
      alert("유효하지 않은 접근입니다. 채팅방 ID를 확인해 주세요.");
      if (!this.embedded) {
        this.$router.push('/');
      }
      return;
    }
    this.mySessionId = roomId;
    // 먼저 로그인된 사용자의 이름을 로드하여 clientData로 전달
    await this.loadMyUserName();
    await this.joinSession();
    // OV 객체가 생성된 후 장치 목록을 가져옵니다.
    if (this.OV) await this.getDevices();

    // join 성공 후 beforeunload 바인딩을 안전하게 유지하기 위해 바운드 핸들러 준비
    // (joinSession에서도 바인딩하지만, 컴포넌트 레벨에서 한 번 관리)
    if (!this._beforeUnloadBound) {
      this._beforeUnloadBound = this.beforeUnloadHandler.bind(this);
      window.addEventListener('beforeunload', this._beforeUnloadBound);
    }
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    // 안전 정리
    try { this.safeCleanup(); } catch (e) { console.debug('safeCleanup error', e); }
    if (this._beforeUnloadBound) {
      window.removeEventListener('beforeunload', this._beforeUnloadBound);
      this._beforeUnloadBound = null;
    }
  },

  mounted() {
    // 브라우저의 전체 화면 상태 변화 감지 이벤트 리스너 추가
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
  },

  computed: {
    // 1명만 접속해 있는가?
    isAlone() {
      return this.gridParticipants.length <= 1;
    },
    // 단독 뷰에 사용할 StreamManager (포커스가 있으면 포커스, 없으면 내 화면)
    singleViewStream() {
      return this.focusedStreamManager || this.publisher;
    },
    // Zoom과 유사한 그리드용 참가자 목록 (내 화면 + 중복 제거된 원격)
    gridParticipants() {
      const parts = [];
      const seen = new Set();
      const addUnique = (sm) => {
        if (!sm) return;
        // Use connectionId as primary unique key (stable, always unique).
        // For the local publisher, connectionId may not be available immediately after initPublisher,
        // so use a stable local key based on myUserName to avoid creating 'Unknown' duplicate entries.
        let key = sm?.stream?.connection?.connectionId || null;
        if (!key && sm === this.publisher) {
          const localName = this.myUserName && String(this.myUserName).trim() !== '' ? this.myUserName : 'local-self';
          key = `local-${localName}`;
        }
        if (!key) key = this.clientData(sm) || null;
        if (!key || seen.has(key)) return;
        seen.add(key);
        parts.push(sm);
      };

      // 우선 내 화면
      addUnique(this.publisher);

      // 원격 참가자 (내 연결과 중복 제거)
      const myCid = this.publisher?.stream?.connection?.connectionId;
      this.subscribers.forEach((sub) => {
        const subCid = sub?.stream?.connection?.connectionId;
        if (myCid && subCid === myCid) return; // 내 스트림 제외
        addUnique(sub);
      });

      return parts;
    },
    // 현재 그리드에 표시될 참가자 수
    participantCount() {
      return this.gridParticipants.length;
    },
    // 참가자 수에 따라 고정된 열 개수 결정 (창 크기와 무관)
    gridCols() {
      const n = this.participantCount;
      if (n <= 1) return 1;      // 1명
      if (n <= 8) return 2;      // 4~8명 포함: 2열
      if (n <= 15) return 3;     // 9~15명: 3열
      if (n <= 24) return 4;     // 확장 규칙
      if (n <= 35) return 5;     // 확장 규칙
      return Math.ceil(Math.sqrt(n)); // 그 외 일반화
    },
    // 인라인 그리드 스타일: 고정 열 개수 유지
    gridStyle() {
      return {
        gridTemplateColumns: `repeat(${this.gridCols}, minmax(0, 1fr))`,
        gridAutoRows: '1fr'
      };
    },
    filteredSubscribers() {
      const publisherConnectionId = this.publisher?.stream?.connection?.connectionId;
      const seenClientData = new Set(); // 렌더링된 사용자 추적

      return this.subscribers.filter(sub => {
        const data = this.clientData(sub);

        // (1) 로컬 스트림 제외
        const isLocalStream = publisherConnectionId && sub.stream.connection.connectionId === publisherConnectionId;
        if (isLocalStream) return false;

        // (2) 🚨 핵심: 이미 같은 사용자의 스트림이 발견되었으면 무시 (중복 제거)
        if (seenClientData.has(data)) {
          return false;
        }
        seenClientData.add(data); // 처음 발견된 스트림만 Set에 추가하여 다음 필터링에 사용

        // (3) 메인 화면 영상 제외 및 Publisher 객체 자체 제외 (기존 로직 유지)
        const isMain = sub === this.mainStreamManager;
        const isMyPublisher = sub === this.publisher;

        return !isMain && !isMyPublisher;
      });
    },
    // is local user speaking (used for overlay highlight)
    isLocalSpeaking() {
      const cid = this.session?.connection?.connectionId;
      if (!cid) return false;
      return !!this.speakingMap[cid];
    },
    // whether the current single/main view is a screen share (from any user)
    isMainStreamScreenShare() {
      const sm = this.singleViewStream;
      if (!sm || !sm.stream) return false;
      const t = sm.stream.typeOfVideo || sm.stream.videoType || sm.stream.type;
      if (!t) return false;
      return String(t).toLowerCase().includes('screen');
    },
  },

  watch: {
    // when the main view changes, ensure local preview exists if viewing a screen share
    singleViewStream: {
      handler() { this._onMainStreamChanged(); },
      immediate: true,
    },
    // 참여자 수 변경 시 부모에게 알림
    participantCount: {
      handler(newCount) {
        this.$emit('participant-count-change', newCount);
      },
      immediate: true,
    },
  },

  methods: {
    // 단독 뷰에서의 클릭 처리: 포커스 상태일 때만 토글 동작, 혼자일 때는 무시
    onSingleViewClick() {
      if (this.focusedStreamManager) {
        this.toggleFocus(this.focusedStreamManager);
      }
    },
    // 포커스 토글: 그리드 <-> 단독 뷰 전환
    toggleFocus(streamManager) {
      if (this.focusedStreamManager === streamManager) {
        this.focusedStreamManager = null; // 그리드 복귀
      } else {
        this.focusedStreamManager = streamManager; // 단독 뷰
      }
    },
    async joinSession() {
      try {
        // 이미 세션이 존재하면 중복 실행 방지
        if (this.session && this.session.connected) {
          console.warn('Session already connected — skipping joinSession()');
          return;
        }

  // OpenVidu 인스턴스 초기화 (URL from env if available)
  const openViduUrl = import.meta.env.VITE_OPENVIDU_URL || 'http://localhost:4443';
  this.OV = new OpenVidu(openViduUrl);
        // 말하기 이벤트 민감도 설정 (필요 시 조정)
        try {
          this.OV.setAdvancedConfiguration({
            publisherSpeakingEvents: {
              interval: 150, // ms 주기
              threshold: -50 // dBFS (낮을수록 민감)
            }
          });
        } catch (e) {
          // 일부 버전에서 없음 – 무시
          console.debug('AdvancedConfiguration not available:', e?.message || e);
        }
        this.session = this.OV.initSession();

        // === 이벤트 등록 ===
        // 음성 감지 - 시작/종료 (핸들러 참조를 보관하여 나중에 off 할 수 있게 함)
        this._onStartSpeaking = (event) => {
          const cid = event?.connection?.connectionId;
          if (!cid) return;
          // Vue3 친화적 반응성 갱신
          this.speakingMap = { ...this.speakingMap, [cid]: true };
        };
        this._onStopSpeaking = (event) => {
          const cid = event?.connection?.connectionId;
          if (!cid) return;
          // 제거하여 상태를 깨끗하게 유지
          const { [cid]: _, ...rest } = this.speakingMap || {};
          this.speakingMap = rest;
        };
        this.session.on('publisherStartSpeaking', this._onStartSpeaking);
        this.session.on('publisherStopSpeaking', this._onStopSpeaking);

        // 스트림 생성: 세션 연결 전에 발생할 수 있으므로 버퍼링 및 안전 체크를 한다
        this._onStreamCreated = ({ stream }) => {
          // 안전: 아직 세션 연결(자기 connection 정보)이 없다면 버퍼에 보관
          if (!this.session?.connection) {
            this._pendingStreams.push(stream);
            return;
          }

          const streamConnId = stream?.connection?.connectionId;
            // cache clientData quickly for UI (nickname)
            try {
              const parsed = this._parseRawClientData(stream?.connection?.data);
              // store only valid string names
              if (streamConnId && typeof parsed === 'string' && parsed.trim() !== '' && !/^\[object\s+.+\]$/.test(parsed)) {
                this._connectionClientMap = { ...this._connectionClientMap, [streamConnId]: parsed };
              }
            } catch (e) { /* ignore */ }
          // 자기 자신의 스트림은 구독하지 않음
          if (streamConnId && this.session?.connection?.connectionId === streamConnId) return;

          // 추가 안전: connection.data에 담긴 clientData가 내 이름과 같다면 중복 구독을 방지
          try {
            const raw = stream?.connection?.data;
            const client = this._parseRawClientData(raw);
            if (client && client === this.myUserName) return;
          } catch (e) { /* ignore */ }

          // 중복 구독 방지
          const alreadySubscribed = this.subscribers.some(
            (s) => s.stream.connection.connectionId === streamConnId
          );
          if (alreadySubscribed) return;

          const subscriber = this.session.subscribe(stream);
          this.subscribers.push(subscriber);

            // Try to cache clientData for this connection — retry a few times because
            // some browsers (Chrome) may populate connection.data slightly later.
            this._cacheClientDataForConnection(streamConnId, subscriber, stream).catch(e => {
              // non-fatal
              console.debug('cacheClientDataForConnection error', e);
            });

          // 렌더링 완료 후 볼륨 반영
          this.$nextTick(() => {
            this.updateOutputVolume(this.outputVolume);
          });
        };
        this.session.on('streamCreated', this._onStreamCreated);

        this._onStreamDestroyed = ({ stream }) => {
          if (this.mainStreamManager === stream.streamManager)
            this.mainStreamManager = this.publisher;

          this.deleteSubscriber(stream.streamManager);
          // 연결 종료 시 말하기 상태 정리
          const cid = stream?.connection?.connectionId;
          if (cid && this.speakingMap[cid] !== undefined) {
            const { [cid]: _, ...rest } = this.speakingMap || {};
            this.speakingMap = rest;
          }
          // ✅ 포커스 대상이 나간 경우, 포커스 해제하여 그리드로 복귀
          if (this.focusedStreamManager === stream.streamManager) {
            this.focusedStreamManager = null;
          }
        };
        this.session.on('streamDestroyed', this._onStreamDestroyed);

        this._onConnectionDestroyed = ({ connection }) => {
          const streamManager = this.subscribers.find(
            (sub) => sub.stream.connection.connectionId === connection.connectionId
          );

          if (streamManager) {
            this.deleteSubscriber(streamManager);
            if (this.mainStreamManager === streamManager)
              this.mainStreamManager = this.publisher;
          }
          // 연결 파괴 시 말하기 상태 정리
          const cid = connection?.connectionId;
          if (cid && this.speakingMap[cid] !== undefined) {
            const { [cid]: _, ...rest } = this.speakingMap || {};
            this.speakingMap = rest;
          }
          // connection이 사라지면 캐시에서 제거
          if (cid && this._connectionClientMap && this._connectionClientMap[cid]) {
            const { [cid]: __, ...rest } = this._connectionClientMap || {};
            this._connectionClientMap = rest;
          }
          // ✅ 포커스 대상이 나간 경우 처리 (보조 안전장치)
          if (streamManager && this.focusedStreamManager === streamManager) {
            this.focusedStreamManager = null;
          }
        };
        this.session.on('connectionDestroyed', this._onConnectionDestroyed);

        // === 세션 연결 ===
        const token = await this.getToken(); // 서버에서 토큰 발급받는 함수
        await this.session.connect(token, { clientData: this.myUserName });

        // 연결 직후, 세션 연결이 완료되었으므로 내 connectionId에 대해 clientData 캐시를 채우고
        // 버퍼에 보관된 스트림을 먼저 처리하여 원격 영상이 빠르게 표시되도록 한다
        try {
          const myCid = this.session?.connection?.connectionId;
          if (myCid && typeof this.myUserName === 'string' && this.myUserName.trim() !== '') {
            this._connectionClientMap = { ...this._connectionClientMap, [myCid]: this.myUserName };
          }
        } catch (e) { /* ignore */ }
        this._processPendingStreams && this._processPendingStreams();

        // === 퍼블리셔 초기화 및 publish ===
        this.publisher = await this.OV.initPublisherAsync(undefined, {
          audioSource: undefined,
          videoSource: undefined,
          publishAudio: true,
          publishVideo: true,
          resolution: '640x480',
          frameRate: 30,
          mirror: false,
        });

  await this.session.publish(this.publisher);
  this.mainStreamManager = this.publisher;
  
  // ✅ 초기 카메라 비디오 트랙 저장
  this._camVideoTrack =
    this.publisher?.stream?.getMediaStream()?.getVideoTracks()?.[0] || null;
  
  // Ensure publisher's own connectionId maps to myUserName for immediate UI display
  try {
    const pubCid = this.publisher?.stream?.connection?.connectionId || this.session?.connection?.connectionId;
    if (pubCid && typeof this.myUserName === 'string' && this.myUserName.trim() !== '') {
      this._connectionClientMap = { ...this._connectionClientMap, [pubCid]: this.myUserName };
    }
  } catch (e) { /* ignore */ }
  // 세션 연결/게시 완료 후에 버퍼에 남아있던 streamCreated 이벤트들을 처리
  this._processPendingStreams && this._processPendingStreams();
        // 초기에는 그리드 모드 유지 (focusedStreamManager = null)

        // === 새로고침 / 탭 닫기 시 안전하게 세션 정리 ===
        if (!this._beforeUnloadBound) {
          this._beforeUnloadBound = this.beforeUnloadHandler.bind(this);
          window.addEventListener('beforeunload', this._beforeUnloadBound);
        }

        // 성공적으로 접속했으므로 새로고침 카운터 초기화
        try { sessionStorage.setItem(this._refreshStorageKey, '0'); } catch (e) { /* ignore */ }

        console.log('✅ Session joined successfully.');
      } catch (error) {
        console.error('❌ Error joining session:', error);
        alert('세션에 연결 중 오류가 발생했습니다. 서버 상태를 확인해주세요.');
      }
    },

    // 🔴 [추가] 녹화 토글 함수
    async toggleRecord() {
      if (!this.session) {
        alert('세션에 연결되어 있지 않아 녹화 기능을 사용할 수 없습니다.');
        return;
      }

      if (this.isRecording) {
        // 녹화 중이면 중지
        await this.stopRecording();
      } else {
        // 녹화 중이 아니면 시작
        await this.startRecording();
      }
    },

    // 🔴 [추가] 녹화 시작 함수
    async startRecording() {
      try {
        // OpenVidu 서버의 녹화 시작 API 엔드포인트 호출
        // (주의: OpenVidu 서버/백엔드에 이 API를 구현해야 합니다.)
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.post(
          `${apiBase}/openvidu/recordings/start`,
          { sessionId: this.mySessionId },
          // 백엔드가 OpenVidu 서버와 통신할 수 있도록 필요한 헤더(예: 인증)를 추가할 수 있습니다.
          // 여기서는 백엔드가 OpenVidu API를 대신 호출한다고 가정합니다.
        );

        if (response.data && response.data.id) {
          this.recordingId = response.data.id;
          this.isRecording = true;
          console.log(`✅ Recording started successfully. Recording ID: ${this.recordingId}`);
        } else {
          throw new Error('녹화 시작 응답 형식이 올바르지 않습니다.');
        }
      } catch (error) {
        console.error('❌ Error starting recording:', error);
        alert('녹화 시작에 실패했습니다. 백엔드 API 및 OpenVidu 서버 상태를 확인해주세요.');
      }
    },

    // 🔴 [추가] 녹화 중지 함수
    async stopRecording() {
      if (!this.recordingId) {
        console.warn('Recording ID is missing. Cannot stop recording.');
        return;
      }

      try {
        // OpenVidu 서버의 녹화 중지 API 엔드포인트 호출
        const apiBase = import.meta.env.VITE_API_BASE_URL || '';
        const response = await axios.post(
          `${apiBase}/openvidu/recordings/stop/${this.recordingId}`
        );

        if (response.status === 200 || response.status === 202) {
          this.isRecording = false;
          this.recordingId = null;
          console.log(`✅ Recording stopped successfully. Recording ID: ${this.recordingId}`);
          alert(`녹화가 성공적으로 중지되었습니다. 파일 처리에는 시간이 걸릴 수 있습니다.`);
        } else {
          throw new Error(`녹화 중지 응답 코드: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Error stopping recording:', error);
        alert('녹화 중지에 실패했습니다. 서버 상태를 확인해주세요.');
      }
    },

    async getToken() {
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/chat-service/open-vidu/room/${this.mySessionId}/openvidu/token`);
        return res.data;
      } catch (err) {
        console.error('토큰 발급 실패:', err);
        throw err;
      }
    },
    // 현재 로그인한 사용자의 이름을 user-service에서 가져와 myUserName에 저장
    async loadMyUserName() {
      try {
        const id = localStorage.getItem('id');
        if (!id) return;
        const baseURL = import.meta.env.VITE_API_BASE_URL;
        const { data } = await axios.get(`${baseURL}/user-service/user/${id}`);
        const user = data?.result;
        if (user) {
          // 서버에서 제공하는 이름 필드은 'name' 이므로 우선 사용
          this.myUserName = user.name || user.userName || localStorage.getItem('email') || '';
        }
      } catch (e) {
        console.warn('loadMyUserName 실패:', e);
        // 폴백: 로컬스토리지 email 사용
        this.myUserName = localStorage.getItem('email') || '';
      }
    },
    // beforeunload 핸들러: 새로고침 카운트 증가 및 안전한 연결 해제
    beforeUnloadHandler(event) {
      try {
        const k = this._refreshStorageKey;
        const prev = parseInt(sessionStorage.getItem(k) || '0', 10) || 0;
        sessionStorage.setItem(k, String(prev + 1));
      } catch (e) {
        console.debug('beforeUnload storage error', e);
      }

      try {
        if (this.session) {
          try { if (this.publisher) this.session.unpublish(this.publisher); } catch (e) { }
          try { this.session.disconnect(); } catch (e) { }
        }
      } catch (e) {
        console.debug('beforeUnload disconnect error', e);
      }
      return undefined;
    },

    // 안전 정리: 세션/퍼블리셔/구독자 정리 및 상태 리셋
    // NOTE: make async to allow callers (leaveSession) to await completion and avoid navigation/teardown races
    async safeCleanup() {
      try {
        if (this.session) {
          // Unpublish local publisher if exists
          try {
            if (this.publisher) {
              // Some SDKs/modes may throw if publish state is not yet established — guard it
              try { this.session.unpublish(this.publisher); } catch (e) { console.debug('unpublish error', e); }
            }
          } catch (e) { console.debug('safeCleanup unpublish outer error', e); }

          // Unsubscribe all subscribers (guard each call)
          try {
            this.subscribers.forEach(sub => {
              try { this.session.unsubscribe(sub); } catch (e) { console.debug('unsubscribe error', e); }
            });
          } catch (e) { console.debug('safeCleanup unsubscribers iteration error', e); }

          // 이벤트 핸들러 제거 (off) — remove only if handler refs exist
          try { if (this._onStartSpeaking) this.session.off('publisherStartSpeaking', this._onStartSpeaking); } catch (e) { console.debug('off startSpeaking error', e); }
          try { if (this._onStopSpeaking) this.session.off('publisherStopSpeaking', this._onStopSpeaking); } catch (e) { console.debug('off stopSpeaking error', e); }
          try { if (this._onStreamCreated) this.session.off('streamCreated', this._onStreamCreated); } catch (e) { console.debug('off streamCreated error', e); }
          try { if (this._onStreamDestroyed) this.session.off('streamDestroyed', this._onStreamDestroyed); } catch (e) { console.debug('off streamDestroyed error', e); }
          try { if (this._onConnectionDestroyed) this.session.off('connectionDestroyed', this._onConnectionDestroyed); } catch (e) { console.debug('off connectionDestroyed error', e); }

          // Disconnect session (guarded)
          try { this.session.disconnect(); } catch (e) { console.debug('session.disconnect error', e); }
        }
      } catch (e) {
        console.debug('safeCleanup error', e);
      } finally {
        // Remove beforeunload listener if present (avoid duplicate handlers later)
        try {
          if (this._beforeUnloadBound) {
            window.removeEventListener('beforeunload', this._beforeUnloadBound);
            this._beforeUnloadBound = null;
          }
        } catch (e) { console.debug('remove beforeunload error', e); }

        // Reset all internal state synchronously
        this.session = undefined;
        this.publisher = undefined;
        this.subscribers = [];
        this.mainStreamManager = undefined;
        this.focusedStreamManager = null;
        this.speakingMap = {};
        this._pendingStreams = [];
        this._connectionClientMap = {};
        
        // 화면공유 스트림 정리
        try { this._screenStream?.getTracks()?.forEach(t => t.stop()); } catch {}
        this._screenStream = null;
        this._camVideoTrack = null;
        
        this.OV = null;
      }
    },

    async leaveSession() {
      // 마지막 참여자인지 확인 (자기 자신만 남음)
      const isLastParticipant = this.participantCount === 1;
      
      try {
        // Await cleanup to avoid racing navigation/unmount with in-flight SDK ops
        await this.safeCleanup();
      } catch (e) {
        console.debug('leaveSession safeCleanup error', e);
      }

      // Reset refresh counter to allow normal re-entry
      try { sessionStorage.setItem(this._refreshStorageKey, '0'); } catch (e) { console.debug('sessionStorage set error', e); }

      // Ensure beforeunload listener is removed (safeCleanup already tries, but double-guard here)
      try {
        if (this._beforeUnloadBound) {
          window.removeEventListener('beforeunload', this._beforeUnloadBound);
          this._beforeUnloadBound = null;
        }
      } catch (e) { console.debug('leaveSession remove beforeunload error', e); }

      // embedded 모드일 때는 부모 컴포넌트에 이벤트 전달, 아니면 라우팅
      if (this.embedded) {
        this.$emit('leave', { isLastParticipant });
      } else {
        // Navigate back to main — guard routing to avoid uncaught exceptions
        try {
          this.$router.push(`/`);
        } catch (e) {
          console.debug('router push error on leaveSession', e);
        }
      }
    },
    deleteSubscriber(streamManager) {
      const idx = this.subscribers.indexOf(streamManager);
      if (idx > -1) this.subscribers.splice(idx, 1);
    },


    // (구) 메인 스트림 토글은 그리드/포커스 전환으로 대체
    updateMainStreamManager(streamManager) {
      this.toggleFocus(streamManager);
    },

    // 2. 오디오 토글 기능
    toggleAudio() {
      if (this.publisher) {
        this.isAudioEnabled = !this.isAudioEnabled;
        this.publisher.publishAudio(this.isAudioEnabled);
        // 마이크를 끌 때 즉시 내 말하기 상태를 OFF로
        if (!this.isAudioEnabled) {
          const myCid = this.session?.connection?.connectionId;
          if (myCid) {
            const { [myCid]: _, ...rest } = this.speakingMap || {};
            this.speakingMap = rest;
          }
        }
      }
    },

    // 3. 비디오 토글 기능
    toggleVideo() {
      if (this.publisher) {
        this.isVideoEnabled = !this.isVideoEnabled;
        this.publisher.publishVideo(this.isVideoEnabled);
      }
    },

    clientData(streamManager) {
      const connId = streamManager?.stream?.connection?.connectionId;
      if (connId && this._connectionClientMap && this._connectionClientMap[connId]) {
        return this._connectionClientMap[connId];
      }
      const raw = streamManager?.stream?.connection?.data;
      if (!raw) return 'Unknown';
      return this._parseRawClientData(raw) || 'Unknown';
    },

    // raw connection.data 파싱(다양한 포맷 지원)
    _parseRawClientData(raw) {
      if (!raw) return null;
      // If it's already an object, inspect its fields
      try {
        if (typeof raw === 'object') {
          const obj = raw;
          if (obj.clientData) return String(obj.clientData);
          if (obj.name) return String(obj.name);
          if (obj.userName) return String(obj.userName);
          // maybe nested stringified json inside a field
          if (typeof obj.clientData === 'string') {
            // fall through to string parsing
            raw = obj.clientData;
          } else {
            return null;
          }
        }

        // If it's a string, try iteratively parsing nested JSON up to a few times
        let s = String(raw);
        for (let i = 0; i < 3; i++) {
          // trim
          s = s.trim();
          // try key=value pattern first
          const kv = s.match(/clientData=([^;,&]*)/);
          if (kv && kv[1]) return decodeURIComponent(kv[1]);

          try {
            const parsed = JSON.parse(s);
            if (parsed == null) break;
            if (typeof parsed === 'string') {
              s = parsed; // continue to next iteration
              continue;
            }
            if (typeof parsed === 'object') {
              if (parsed.clientData) return String(parsed.clientData);
              if (parsed.name) return String(parsed.name);
              if (parsed.userName) return String(parsed.userName);
              // if object has a string value, try that
              s = String(parsed);
              break;
            }
          } catch (e) {
            // not json, return raw string
            break;
          }
        }

        // final fallback: return the trimmed string if non-empty and not a toString'ed object
        const trimmed = s && s.trim();
        if (!trimmed || trimmed === '{}' ) return null;
        // avoid returning '[object Object]' style values
        if (/^\[object\s+.+\]$/.test(trimmed)) return null;
        return trimmed;
      } catch (e) {
        return null;
      }
    },

    // pending streams 처리
    _processPendingStreams() {
      if (!this._pendingStreams || this._pendingStreams.length === 0) return;
      const pending = this._pendingStreams.splice(0, this._pendingStreams.length);
      pending.forEach((stream) => {
        try {
          const streamConnId = stream?.connection?.connectionId;
          if (streamConnId && this.session?.connection?.connectionId === streamConnId) return;
          const client = this._parseRawClientData(stream?.connection?.data);
          if (streamConnId && typeof client === 'string' && client.trim() !== '' && !/^\[object\s+.+\]$/.test(client)) {
            this._connectionClientMap = { ...this._connectionClientMap, [streamConnId]: client };
          }
          if (client && client === this.myUserName) return;
          const alreadySubscribed = this.subscribers.some(
            (s) => s.stream.connection.connectionId === streamConnId
          );
          if (alreadySubscribed) return;
          const subscriber = this.session.subscribe(stream);
          this.subscribers.push(subscriber);
          // same caching for pending streams
          this._cacheClientDataForConnection(streamConnId, subscriber, stream).catch(e => { /* ignore */ });
        } catch (e) { console.debug('processPendingStreams error', e); }
      });
      // 반영
      this.$nextTick(() => this.updateOutputVolume(this.outputVolume));
    },

    // Try reading/parsing clientData for a connection multiple times with small delays.
    async _cacheClientDataForConnection(connectionId, subscriber, stream) {
      if (!connectionId) return;
      const delays = [0, 100, 300, 600];
      for (const d of delays) {
        if (d) await new Promise(r => setTimeout(r, d));
        try {
          const raw = (subscriber && subscriber.stream && subscriber.stream.connection && subscriber.stream.connection.data)
            || (stream && stream.connection && stream.connection.data)
            || null;
          const parsed = this._parseRawClientData(raw);
          if (parsed && typeof parsed === 'string' && parsed.trim() !== '' && !/^[\[]object\s+.+\]$/.test(parsed)) {
            this._connectionClientMap = { ...this._connectionClientMap, [connectionId]: parsed };
            return;
          }
        } catch (e) {
          // ignore and retry
        }
      }
      // Final attempt: if nothing found, leave unknown but log for diagnostics
      try {
        const rawFinal = (subscriber && subscriber.stream && subscriber.stream.connection && subscriber.stream.connection.data)
          || (stream && stream.connection && stream.connection.data) || null;
        if (rawFinal) console.debug('clientData remained unavailable after retries, raw:', rawFinal);
      } catch (e) { /* ignore */ }
    },

    displayName(streamManager, isPublisher = false) {
      // For publisher (local), prefer the authoritative myUserName value so we don't show fallback '나(나)'
      if (isPublisher) {
        // Prefer myUserName if available
        if (this.myUserName && String(this.myUserName).trim() !== '') {
          return `${this.myUserName}(나)`;
        }

        // Otherwise try to use any parsed clientData from the stream/connection
        const cached = this.clientData(streamManager);
        if (cached && cached !== 'Unknown') return `${cached}(나)`;

        // Final fallback: just display '나' (without duplicating suffix)
        return '나';
      }

      const name = this.clientData(streamManager);
      return name || 'Unknown';
    },

    // 현재 스트림매니저의 연결 ID
    connectionIdOf(streamManager) {
      return streamManager?.stream?.connection?.connectionId || null;
    },
    // 해당 스트림 소유자가 말하는 중인지 여부
    isSpeaking(streamManager) {
      const cid = this.connectionIdOf(streamManager);
      if (!cid) return false;
      return !!this.speakingMap[cid];
    },
    
    // 비디오가 활성화되어 있는지 확인
    isVideoActive(streamManager) {
      if (!streamManager || !streamManager.stream) return false;

      const s = streamManager.stream;

      // OpenVidu가 아예 꺼졌다고 알려주면 (videoActive === false) 무조건 꺼진 걸로 취급
      if (s.videoActive === false) return false;

      // 로컬 퍼블리셔는 내 토글 상태까지 같이 보자
      if (streamManager === this.publisher) {
        return this.isVideoEnabled;
      }

      // 원격은 videoActive만 보면 됨 (위에서 false인 경우 걸러짐)
      return true;
    },

    // 4. 장치 목록 가져오기 및 초기화
    async getDevices() {
      try {
        this.devices = await this.OV.getDevices();
        const audioInputs = this.devices.filter(d => d.kind === 'audioinput');
        const videoInputs = this.devices.filter(d => d.kind === 'videoinput');

        // 초기 선택 (현재 활성화된 장치로 설정)
        this.audioInput = this.publisher?.properties?.audioSource || audioInputs[0]?.deviceId;
        this.videoInput = this.publisher?.properties?.videoSource || videoInputs[0]?.deviceId;

      } catch (error) {
        console.error('장치 목록 가져오기 오류:', error);
      }
    },

    // Overlay helpers: initial positioning and drag handling
    _setInitialOverlayPosition() {
      try {
        const container = document.getElementById('main-video-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        // place at bottom-right with 16px margin
        this.overlayX = Math.max(8, rect.width - this.overlayWidth - 16);
        this.overlayY = Math.max(8, rect.height - this.overlayHeight - 16);
      } catch (e) { console.debug('setInitialOverlayPosition error', e); }
    },

    async _onMainStreamChanged() {
      // 화면 공유 관련 오버레이 기능 제거됨
    },

    async _createLocalPreview() {
      // 카메라 프리뷰 오버레이 기능 제거됨
    },

    _destroyLocalPreview() {
      // 카메라 프리뷰 오버레이 기능 제거됨
    },

    overlayMouseDown(event) {
      // only left button
      if (event.button !== 0) return;
      // Start a "pending" drag: we don't actually move the overlay until the
      // pointer moves past a small threshold. This prevents simple clicks from
      // causing accidental relocations. The real drag only starts after the
      // threshold is exceeded while the left button remains pressed.
      const startX = event.clientX;
      const startY = event.clientY;
      this._overlayDragStart = { startX, startY, origX: this.overlayX || 0, origY: this.overlayY || 0 };
      this._overlayPendingDrag = true;
      this.overlayDragging = false;
      // bind handlers so we can remove the exact references later
      this._overlayMouseMoveHandler = (e) => this._onWindowMouseMove(e);
      this._overlayMouseUpHandler = () => this._onWindowMouseUp();
      window.addEventListener('mousemove', this._overlayMouseMoveHandler);
      window.addEventListener('mouseup', this._overlayMouseUpHandler);
      // prevent text selection while attempting to drag
      event.preventDefault();
    },

    _onWindowMouseMove(evt) {
      // If drag hasn't been initiated, ignore.
      if (!this._overlayDragStart) return;
      try {
        // If left mouse button is not pressed anymore, cancel/finish drag.
        if (typeof evt.buttons !== 'undefined' && (evt.buttons & 1) === 0) {
          this._onWindowMouseUp();
          return;
        }

        const dx = evt.clientX - this._overlayDragStart.startX;
        const dy = evt.clientY - this._overlayDragStart.startY;

        // If we're in the pending state, only start dragging after a small
        // threshold (prevents clicks from moving the overlay). Threshold is
        // distance squared (e.g. 5px -> 25).
        const dist2 = dx * dx + dy * dy;
        if (this._overlayPendingDrag) {
          const threshold2 = 25;
          if (dist2 < threshold2) return; // not enough movement yet
          // Start actual dragging now
          this.overlayDragging = true;
          this._overlayPendingDrag = false;
        }

        if (!this.overlayDragging) return;

        const newX = this._overlayDragStart.origX + dx;
        const newY = this._overlayDragStart.origY + dy;
        // constrain inside container
        const container = document.getElementById('main-video-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        // allow the overlay to be dragged so that up to half of it can hang outside
        // i.e., permit positions from -overlayWidth/2 .. rect.width - overlayWidth/2
        const halfW = Math.floor(this.overlayWidth / 2);
        const halfH = Math.floor(this.overlayHeight / 2);
        const minX = -halfW;
        const maxX = rect.width - halfW;
        const minY = -halfH;
        const maxY = rect.height - halfH;
        this.overlayX = Math.min(Math.max(minX, newX), maxX);
        this.overlayY = Math.min(Math.max(minY, newY), maxY);
      } catch (e) { /* ignore */ }
    },

    _onWindowMouseUp() {
      this.overlayDragging = false;
      this._overlayPendingDrag = false;
      this._overlayDragStart = null;
      if (this._overlayMouseMoveHandler) {
        window.removeEventListener('mousemove', this._overlayMouseMoveHandler);
        this._overlayMouseMoveHandler = null;
      }
      if (this._overlayMouseUpHandler) {
        window.removeEventListener('mouseup', this._overlayMouseUpHandler);
        this._overlayMouseUpHandler = null;
      }
    },

    // 5. 장치 변경 및 재게시 (Re-publishing)
    async changeDevice(deviceType, deviceId) {
      if (!this.publisher || !deviceId) return;

      const currentPublisher = this.publisher;
      const oldAudioEnabled = this.isAudioEnabled;
      const oldVideoEnabled = this.isVideoEnabled;

      // OpenVidu 객체에서 새 Publisher 생성 시에 사용할 설정
      const properties = {
        audioSource: deviceType === 'audio' ? deviceId : currentPublisher.properties.audioSource,
        videoSource: deviceType === 'video' ? deviceId : currentPublisher.properties.videoSource,
        publishAudio: oldAudioEnabled,
        publishVideo: oldVideoEnabled,
        // 기타 설정 (해상도 등)은 기존 설정 유지
        resolution: currentPublisher.properties.resolution,
        frameRate: currentPublisher.properties.frameRate,
        mirror: currentPublisher.properties.mirror,
      };

      try {
        // 기존 Publisher 연결 해제
        this.session.unpublish(currentPublisher);

        // 새 Publisher 생성
        const newPublisher = this.OV.initPublisher(undefined, properties);

        // 메인 스트림 업데이트 및 재게시
        this.publisher = newPublisher;
        this.mainStreamManager = newPublisher;
        await this.session.publish(newPublisher);

        // ✅ 새 퍼블리셔 비디오 트랙 다시 저장
        this._camVideoTrack =
          this.publisher?.stream?.getMediaStream()?.getVideoTracks()?.[0] || null;

        // 장치 ID 상태 업데이트
        if (deviceType === 'audio') this.audioInput = deviceId;
        if (deviceType === 'video') this.videoInput = deviceId;

        console.log(`${deviceType} 장치 변경 성공:`, deviceId);


      } catch (error) {
        console.error('장치 변경 오류:', error);
      }
    },

    // 6. 화면 공유 토글
    async toggleScreenShare() {
      if (this._replacing) return;
      if (this.isScreenShareEnabled) {
        return this.stopScreenShare(); // 아래 함수
      }

      try {
        this._replacing = true;

        // 1) 화면 공유 미디어 얻기
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) throw new Error('No screen video track');

        // 2) 화면 공유 종료(툴바에서 stop) 대응
        screenTrack.onended = () => this.stopScreenShare(true);

        // 3) 카메라 → 화면공유 트랙 교체 (퍼블리셔는 그대로)
        //   최신 OV에선 Promise, 구버전은 콜백 방식 모두 지원
        const maybePromise = this.publisher.replaceTrack(screenTrack);
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }

        // 4) 상태 업데이트
        this._screenStream = screenStream;
        this.isScreenShareEnabled = true;
        this.isVideoEnabled = true; // 화면공유는 비디오 ON 취급
        
        console.log('✅ 화면 공유 시작 완료');
      } catch (e) {
        console.error('화면 공유 시작 오류:', e);
        this.isScreenShareEnabled = false;
        // 화면 공유 권한 거부 등으로 열렸다면 정리
        try { this._screenStream?.getTracks()?.forEach(t => t.stop()); } catch {}
        this._screenStream = null;
      } finally {
        this._replacing = false;
      }
    },

    // 화면 공유 중지 → 카메라 트랙으로 복귀
    async stopScreenShare(internal = false) {
      if (this._replacing) return;
      if (!this.isScreenShareEnabled) {
        console.log('🟡 이미 화면공유 해제 상태. internal =', internal);
        return;
      }

      try {
        this._replacing = true;

        // 카메라 트랙이 죽어있으면 재획득
        if (!this._camVideoTrack || this._camVideoTrack.readyState === 'ended') {
          const cam = await navigator.mediaDevices.getUserMedia({
            video: this.videoInput ? { deviceId: { exact: this.videoInput } } : true,
            audio: false,
          });
          this._camVideoTrack = cam.getVideoTracks()[0];
        }

        // 화면공유 → 카메라 트랙 교체 (퍼블리셔 유지)
        const maybePromise = this.publisher.replaceTrack(this._camVideoTrack);
        if (maybePromise && typeof maybePromise.then === 'function') {
          await maybePromise;
        }
        
        console.log('✅ 카메라 트랙 복귀 완료');
      } catch (e) {
        console.error('카메라 복귀 오류:', e);
        alert('카메라로 복귀하는 중 오류가 발생했습니다: ' + e.message);
      } finally {
        // 화면공유 스트림 정리
        try { this._screenStream?.getTracks()?.forEach(t => t.stop()); } catch {}
        this._screenStream = null;
        this.isScreenShareEnabled = false;
        this.isVideoEnabled = true;
        this._replacing = false;
      }
    },

    // 7. 전체화면 토글
    toggleFullScreen() {
      const element = this.$el;  // Vue 컴포넌트의 루트 엘리먼트
      if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
          element.requestFullscreen();
        } else if (element.mozRequestFullScreen) { /* Firefox */
          element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
          element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) { /* IE/Edge */
          element.msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
          document.msExitFullscreen();
        }
      }
    },

    // 전체 화면 상태 변경 핸들러
    handleFullscreenChange() {
      // document.fullscreenElement가 null이 아니면 전체 화면 상태임
      this.isFullScreenMode = !!document.fullscreenElement ||
        !!document.webkitFullscreenElement ||
        !!document.mozFullScreenElement ||
        !!document.msFullscreenElement;
    },

    // 8. 출력 음량 조절 (Subscriber 볼륨 제어)
    updateOutputVolume(volume) {
      // this.outputVolume이 v-model로 바인딩되므로, volume은 슬라이더의 새 값입니다.
      this.outputVolume = volume;

      // 모든 원격 참가자의 볼륨을 조절합니다.
      this.subscribers.forEach(sub => {
        // OpenVidu StreamManager의 property로 볼륨을 설정합니다.
        // 'volume'은 0에서 100 사이의 값으로 설정
        if (sub.videos && sub.videos.length > 0) {
          // StreamManager의 set
          try { sub.videos[0].video.volume = volume / 100; } catch (e) { /* ignore */ }
        }
      });

      // 메인 스트림이 원격일 경우에도 적용 (추가적인 안전 장치)
      if (this.mainStreamManager !== this.publisher &&
        this.mainStreamManager?.videos &&
        this.mainStreamManager.videos.length > 0) {
        try { this.mainStreamManager.videos[0].video.volume = volume / 100; } catch (e) { /* ignore */ }
      }

      // DOM fallback: VideoStream 컴포넌트가 직접 생성한 <video> 요소에 적용
      try {
        document.querySelectorAll('.video-stream > video').forEach(v => {
          try { v.volume = volume / 100; } catch (e) { }
        });
      } catch (e) { /* ignore */ }
    },
  },
};
</script>

<style scoped>
/* 일반 상태의 VUE.js 상위 컨테이너 초기화 및 마진 정렬 */
html,
body,
#app,
.v-application {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

.video-item :deep(video) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: black;
  border-radius: 8px;
}

.v-row {
  margin: 0;
  width: 100%;
  padding: 0;
}

/* 1. 컨테이너 전체 레이아웃 스타일 */
.openvidu-container {
  position: fixed;
  top: 83px;
  /* 헤더 높이 */
  left: 280px;
  /* 사이드바 너비 */
  right: 0;
  bottom: 0;
  width: calc(100vw - 280px);
  height: calc(100vh - 83px);
  max-width: none;
  padding: 0;
  margin: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

/* embedded 모드: 부모 컨테이너에 맞춤 */
.openvidu-container.embedded {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background-color: transparent;
  padding: 0;
  margin: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.openvidu-container.embedded .control-bar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
}

.openvidu-container.embedded .grid-container {
  width: 100%;
  height: auto;
  max-height: calc(100% - 96px);
  padding: 12px 16px 0;
  box-sizing: border-box;
}

.openvidu-container.embedded .main-video-row {
  width: 100%;
  height: 100%;
}

.openvidu-container.embedded .fullscreen-button-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.openvidu-container.embedded #main-video-container {
  border-radius: 12px;
}

.openvidu-container.embedded #main-video-container :deep(video) {
  border-radius: 12px;
}

.openvidu-container.embedded .video-item {
  border-radius: 8px;
}

.openvidu-container.embedded .video-item :deep(video) {
  border-radius: 8px;
}

/* 2. 메인 비디오 영역 및 화면 공유 스타일 */
.main-video-row {
  flex-grow: 1;
  height: 90%;
  max-height: 100%;
}

.main-video-area {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1;
  min-height: 0;
  overflow: hidden;
  height: 100%;
  max-width: 100%;
}

#main-video-container {
  /* (<-- 수정) 중앙 정렬을 위해 필요한 속성만 남기고 width/height는 제거 */
  position: relative;
  background-color: transparent;
  width: 90%;
  max-width: 800px;
  aspect-ratio: 16 / 9;
  margin: auto;
  /* ❗이 요소가 닉네임의 position: absolute 기준점 역할을 합니다. */
  border-radius: 12px;
  /* allow overlay to extend outside the container so the small camera preview
     can be dragged half-out (visual effect requested) */
  overflow: visible;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  transition: box-shadow 120ms ease, border-color 120ms ease;
}

/* OpenVidu <video-stream> 내부의 <video> 요소를 위한 스타일 */
/* (생략) */
#main-video-container :deep(video) {
  /* (<-- 수정) 비디오 스타일 유지 */
  width: 100%;
  height: 100%;
  object-fit: cover;
  background-color: transparent;
  display: block;
  border-radius: inherit;
}

/* 3. 썸네일 비디오 영역 스타일 */
.remote-videos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  padding: 8px 0;
  max-height: 12vh;
}

.publisher-video-area,
.subscriber-video-area {
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 4. 닉네임 스타일 */
.nickname {
  position: absolute;
  bottom: 5px;
  left: 5px;
  /* Ensure nickname is always rendered above overlays and controls */
  z-index: 10005;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.8em;
}

/* 5. 비디오 아이템 스타일 */
.video-item {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
  overflow: hidden;
  background-color: black;
  cursor: pointer;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: box-shadow 120ms ease, border-color 120ms ease;
}

/* 말하기 감지 시 하이라이트 (연두색) */
#main-video-container.speaking,
.video-item.speaking {
  box-shadow: 0 0 0 3px rgba(129, 199, 132, 0.95), 0 0 24px rgba(129, 199, 132, 0.6);
}

/* 비디오가 꺼진 상태 */
#main-video-container.video-off,
.video-item.video-off {
  background-color: #2A2828;
}

/* 비디오 플레이스홀더 */
.video-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #2A2828;
  border-radius: inherit;
}

.default-user-icon {
  width: 80px;
  height: 80px;
  opacity: 0.9;
}

/* camera overlay shown during screen share */
.camera-overlay {
  position: absolute;
  z-index: 30;
  right: auto;
  bottom: auto;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.2);
  cursor: grab;
  background: #000;
}
.camera-overlay:active { cursor: grabbing; }
.camera-overlay.speaking {
  box-shadow: 0 0 0 4px rgba(129, 199, 132, 0.95), 0 0 20px rgba(129, 199, 132, 0.5);
}
.camera-overlay :deep(video) {
  border-radius: 8px;
}

/* 6. 컨트롤바 스타일 */
.control-bar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 20px 0;
  z-index: 50;
  pointer-events: none;
  display: flex;
  justify-content: center;
}

/* 컨트롤 버튼 - 동그란 배경 */
.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.control-btn:active {
  background-color: rgba(255, 255, 255, 0.15);
  transform: scale(0.95);
}

/* 컨트롤 아이콘 스타일 */
.control-icon {
  width: 50px !important;
  height: 50px !important;
  min-width: 50px;
  min-height: 50px;
  max-width: 50px;
  max-height: 50px;
  pointer-events: none;
  user-select: none;
  display: block;
}

.control-bar {
  width: 100%;
  max-width: 1000px;
  position: relative;
  padding: 0 20px;
  background-color: rgba(0, 0, 0, 0);
  border-radius: 12px;
  pointer-events: auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 16px;
}

.controls-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.left-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}

/* 전체화면 버튼 - 오른쪽 하단 */
.fullscreen-button-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
  pointer-events: auto;
}

.fullscreen-icon {
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  user-select: none;
}

.fullscreen-icon:hover {
  transform: scale(1.1);
  opacity: 0.8;
}

.fullscreen-icon:active {
  transform: scale(0.95);
  opacity: 0.6;
}

/* === Zoom 스타일 그리드 컨테이너 === */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  width: 100%;
  height: 100%;
  padding: 12px 16px 96px;
  /* 하단 컨트롤 바와 겹치지 않게 여백 */
  box-sizing: border-box;
  justify-content: center;
  align-content: center;
}

/* ------------------------------------------------ */
/* === 전체화면 전용 스타일 === */
/* 기본 전체 화면 설정 */
html:fullscreen,
body:fullscreen,
#app:fullscreen,
.v-application:fullscreen {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 1. 최상위 컨테이너: 뷰포트 전체 점유 및 모든 패딩/마진 제거 */
:fullscreen .openvidu-container,
.openvidu-container:fullscreen,
:-webkit-full-screen .openvidu-container,
.openvidu-container:-webkit-full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  max-width: none;
  margin: 0;
  padding: 0;
  background-color: #0e0e10;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 전체 화면에서 썸네일 Row 숨기기 */
:fullscreen .remote-videos,
.openvidu-container:fullscreen .remote-videos {
  display: none;
}

/* 2. 메인 비디오 ROW : 뷰포트 전체를 덮도록 강제 확장 */
:fullscreen .main-video-row,
.openvidu-container:fullscreen .main-video-row {
  flex-grow: 1;
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

/* 3. 메인 비디오 영역 : transform 초기화 및 100% 확장 */
:fullscreen .main-video-area,
.openvidu-container:fullscreen .main-video-area,
:-webkit-full-screen .main-video-area,
.openvidu-container:-webkit-full-screen .main-video-area {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transform: none;
  flex: none;
  max-width: 100vw;
  width: 100vw;
  height: 100vh;
}

/* 4. 메인 비디오 컨테이너 : 부모 크기를 100% 채우도록 함 (Position Relative 기준점) */
:fullscreen #main-video-container,
.openvidu-container:fullscreen #main-video-container {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  position: relative;
  border-radius: 0;
  /* 전체화면에서는 곡률 제거 */
}

/* 5. 비디오 요소 최종 크기 및 비율 강제 설정 */
/* ::v-deep를 사용하여 VideoStream 컴포넌트 내부의 <video> 태그에 직접 적용 */
:fullscreen #main-video-container :deep(video),
.openvidu-container:fullscreen #main-video-container :deep(video),
:-webkit-full-screen #main-video-container :deep(video),
.openvidu-container:-webkit-full-screen #main-video-container :deep(video) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  min-width: 100%;
  min-height: 100%;
  background-color: black;
  margin: 0;
  padding: 0;
  z-index: 1;
}

/* 6. 전체화면 버튼 스타일 */
:fullscreen .fullscreen-button-overlay,
.openvidu-container:fullscreen .fullscreen-button-overlay {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 10010;
}

/* 7. 전체화면 닉네임 스타일 */
:fullscreen .nickname,
.openvidu-container:fullscreen .nickname {
  position: absolute;
  bottom: 10px;
  left: 10px;
  font-size: 1rem;
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 5px 10px;
  border-radius: 4px;
  /* Keep fullscreen nickname above overlays */
  z-index: 10005;
}

/* 8. 전체화면에서 비디오 꺼진 상태 */
:fullscreen #main-video-container.video-off,
.openvidu-container:fullscreen #main-video-container.video-off {
  background-color: #2A2828;
}

:fullscreen .default-user-icon,
.openvidu-container:fullscreen .default-user-icon {
  width: 120px;
  height: 120px;
}
</style>