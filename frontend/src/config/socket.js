import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL.replace("/api", "");

export const socket = io(SOCKET_URL, {
  autoConnect: false, 
  reconnection: true,
  transports: ["websocket"],
  withCredentials: true
});

export const connectSocket = (token) => {
  if (!socket.connected) {
    socket.auth = { token }; 
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;