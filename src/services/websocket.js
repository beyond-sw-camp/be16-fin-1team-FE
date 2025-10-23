let socket = null;
let messageCallback = null;

export const connectWebSocket = (documentId, onMessage) => {
  // 이미 연결되어 있다면 기존 연결 사용
  if (socket && socket.readyState === WebSocket.OPEN) {
    return;
  }

  // WebSocket 서버 주소
  socket = new WebSocket(`ws://localhost:8080/drive-service/ws/editor`);

  messageCallback = onMessage;

  // 연결이 성공적으로 이루어졌을 때
  socket.onopen = () => {
    console.log('WebSocket 연결 성공');
    
    // 서버에 JOIN 메시지 전송
    const joinMessage = {
      type: 'JOIN',
      documentId: documentId,
      senderId: 'user-' + Math.random().toString(36).substring(2, 9), // 임시 사용자 ID
      content: null,
    };
    socket.send(JSON.stringify(joinMessage));
  };

  // 서버로부터 메시지를 받았을 때
  socket.onmessage = (event) => {
    if (messageCallback) {
      const message = JSON.parse(event.data);
      messageCallback(message);
    }
  };

  // 에러 발생 시
  socket.onerror = (error) => {
    console.error('WebSocket 에러:', error);
  };

  // 연결 종료 시
  socket.onclose = () => {
    console.log('WebSocket 연결 종료');
    socket = null;
  };
};

// 서버로 메시지 전송
export const sendMessage = (message) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.error('WebSocket이 연결되어 있지 않습니다.');
  }
};

// 웹소켓 연결 해제
export const disconnectWebSocket = () => {
  if (socket) {
    socket.close();
  }
};