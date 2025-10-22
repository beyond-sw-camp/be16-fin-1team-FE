import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client/dist/sockjs.min.js';

let client = null;
let subscription = null;

/**
 * STOMP 클라이언트 연결
 * @param {string} documentId - 문서 ID
 * @param {string} userId - 현재 사용자 ID
 * @param {function} onMessageCallback - 메시지 수신 콜백
 * @param {function} onConnectCallback - 연결 성공 콜백
 */
export const connectStomp = (documentId, userId, onMessageCallback, onConnectCallback) => {
  // 이미 연결되어 있으면 재연결 시도 안함
  if (client && client.active) {
    console.log('STOMP is already connected');
    return;
  }
  
  // 기존 클라이언트가 있다면 정리
  if (client) {
    try {
      client.deactivate();
    } catch (error) {
      console.warn('Error deactivating existing client:', error);
    }
  }
  
  client = new Client({
    webSocketFactory: () => {
      return new SockJS('http://localhost:8080/drive-service/ws/editor');
    },
    reconnectDelay: 5000,
    debug: (str) => {
      // 개발 모드에서만 디버그 로그 출력
      if (import.meta.env.DEV) {
        console.log('STOMP Debug:', str);
      }
    },
  });

  client.onConnect = (frame) => {
    console.log('✅ STOMP 연결 성공');
    
    // 기존 구독 정리
    if (subscription) {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    }
    
    // 서버로부터 메시지를 수신하기 위해 토픽 구독 (헤더 없이)
    subscription = client.subscribe(`/topic/document/${documentId}`, (message) => {
      try {
        const parsedMessage = JSON.parse(message.body);
        if (onMessageCallback) {
          onMessageCallback(parsedMessage);
        }
      } catch (error) {
        console.error('메시지 파싱 에러:', error, message.body);
      }
    });
    
    console.log(`📡 구독 완료: /topic/document/${documentId}`);

    // 연결 성공 후 입장 메시지 전송
    sendStompMessage({
      destination: '/publish/editor/join',
      body: {
        documentId: documentId,
        senderId: userId,
      }
    });
    
    // 연결 성공 콜백 실행
    if (onConnectCallback) {
      onConnectCallback();
    }
  };

  client.onStompError = (frame) => {
    console.error('❌ STOMP Error:', frame.headers['message']);
    console.error('Details:', frame.body);
  };
  
  client.onWebSocketError = (error) => {
    console.error('❌ WebSocket Error:', error);
  };
  
  client.onDisconnect = () => {
    console.log('🔌 STOMP 연결 해제됨');
    subscription = null;
  };

  // 클라이언트 활성화
  client.activate();
};

/**
 * 서버로 메시지 전송
 * @param {object} params - 전송 파라미터
 * @param {string} params.destination - 목적지 경로
 * @param {object} params.body - 전송할 데이터
 */
export const sendStompMessage = ({ destination, body }) => {
  if (!client) {
    console.warn('⚠️ STOMP client not initialized');
    return false;
  }
  
  if (!client.active) {
    console.warn('⚠️ STOMP is not connected. Message not sent.');
    return false;
  }
  
  try {
    client.publish({
      destination,
      body: JSON.stringify(body),
    });
    return true;
  } catch (error) {
    console.error('❌ Error sending message:', error);
    return false;
  }
};

/**
 * STOMP 연결 해제
 * @param {string} documentId - 현재 문서 ID
 * @param {string} userId - 현재 사용자 ID
 */
export const disconnectStomp = (documentId, userId) => {
  if (client && client.active) {
    console.log(`STOMP: Attempting to disconnect for user ${userId}...`);

    // 구독이 활성화되어 있으면 퇴장 메시지를 보내고 구독을 취소합니다.
    if (subscription) {
      // 퇴장 메시지를 전송합니다.
      client.publish({
        destination: '/publish/editor/leave',
        body: JSON.stringify({
          documentId: documentId,
          senderId: userId,
        }),
      });

      try {
        subscription.unsubscribe();
        console.log('STOMP subscription unsubscribed.');
        subscription = null; // 구독 객체를 null로 설정
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    }

    // publish 메시지가 전송될 시간을 확보하기 위해 짧은 지연 후 deactivate를 호출합니다.
    setTimeout(() => {
      if (client && client.active) {
        client.deactivate();
        console.log('STOMP client deactivated after a short delay.');
      }
    }, 100);

  } else {
    console.log('STOMP: Client not active or not initialized, cannot disconnect.');
  }
};

/**
 * 현재 연결 상태 확인
 * @returns {boolean} 연결 여부
 */
export const isConnected = () => {
  return client && client.active;
};
