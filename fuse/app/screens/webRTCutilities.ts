// import { RTCPeerConnection } from 'react-native-webrtc';

// const signalingServer = 'ws://172.20.10.2:8080';
// let socket: WebSocket | null = null;

// export function connectToSignalingServer(username: string) {
//   if (!username) {
//     console.error('Username is required to connect to the signaling server.');
//     return;
//   }

//   socket = new WebSocket(signalingServer);

//   socket.onopen = () => {
//     console.log('Connected to signaling server');
//     socket?.send(JSON.stringify({ type: 'register', username }));
//   };

//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     console.log('Received signaling message:', data);

//     if (data.type === 'match') {
//       console.log(`Matched with: ${data.targetUsername}`);
//     }
//   };

//   socket.onerror = (event) => {
//     console.error('WebSocket error:', event);
//   };

//   socket.onclose = () => {
//     console.log('Disconnected from signaling server');
//   };
// }

// export function sendSignal(message: object) {
//   if (socket && socket.readyState === WebSocket.OPEN) {
//     socket.send(JSON.stringify(message));
//   } else {
//     console.error('Cannot send signal: WebSocket is not open.');
//   }
// }
