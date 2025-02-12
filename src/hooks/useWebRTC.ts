"use client";

import { useEffect, useRef, useState } from "react";
import { useSocket } from "./useSocket";

interface PeerConnection {
  userId: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const useWebRTC = (roomId: string, userId: string) => {
  const { socket } = useSocket();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, PeerConnection>>(new Map());
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const createPeerConnection = async (targetUserId: string) => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const peerConnection = new RTCPeerConnection(configuration);

    // Yerel medya akışını ekle
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // ICE adaylarını dinle ve gönder
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('ice-candidate', {
          candidate: event.candidate,
          targetUserId,
          roomId,
        });
      }
    };

    // Uzak medya akışını al
    peerConnection.ontrack = (event) => {
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.set(targetUserId, event.streams[0]);
        return newStreams;
      });
    };

    peerConnections.current.set(targetUserId, {
      userId: targetUserId,
      connection: peerConnection,
    });

    return peerConnection;
  };

  const startCall = async (type: 'audio' | 'video') => {
    console.log('Sesli/görüntülü görüşme başlatılıyor:', type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      console.log('Yerel medya akışı alındı:', stream);
      setLocalStream(stream);
      socket?.emit('join-call', { roomId, userId });
      console.log('Görüşmeye katılma isteği gönderildi:', { roomId, userId });
    } catch (error) {
      console.error('Medya erişimi hatası:', error);
    }
  };

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setIsScreenSharing(true);
      socket?.emit('join-screen-share', { roomId, userId });

      // Ekran paylaşımı bittiğinde
      stream.getVideoTracks()[0].onended = () => {
        stopCall();
      };
    } catch (error) {
      console.error('Ekran paylaşımı hatası:', error);
    }
  };

  const stopCall = () => {
    localStream?.getTracks().forEach((track) => track.stop());
    setLocalStream(null);
    setIsScreenSharing(false);

    peerConnections.current.forEach((peer) => {
      peer.connection.close();
    });
    peerConnections.current.clear();
    setRemoteStreams(new Map());

    socket?.emit('leave-call', { roomId, userId });
  };

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined-call', async ({ userId: joinedUserId }) => {
      const peerConnection = await createPeerConnection(joinedUserId);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      socket.emit('call-offer', {
        offer,
        targetUserId: joinedUserId,
        roomId,
      });
    });

    socket.on('call-offer', async ({ offer, userId: callerId }) => {
      const peerConnection = await createPeerConnection(callerId);
      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('call-answer', {
        answer,
        targetUserId: callerId,
        roomId,
      });
    });

    socket.on('call-answer', async ({ answer, userId: answererId }) => {
      const peerConnection = peerConnections.current.get(answererId)?.connection;
      if (peerConnection) {
        await peerConnection.setRemoteDescription(answer);
      }
    });

    socket.on('ice-candidate', async ({ candidate, userId: senderId }) => {
      const peerConnection = peerConnections.current.get(senderId)?.connection;
      if (peerConnection) {
        await peerConnection.addIceCandidate(candidate);
      }
    });

    socket.on('user-left-call', ({ userId: leftUserId }) => {
      const peer = peerConnections.current.get(leftUserId);
      if (peer) {
        peer.connection.close();
        peerConnections.current.delete(leftUserId);
      }
      setRemoteStreams((prev) => {
        const newStreams = new Map(prev);
        newStreams.delete(leftUserId);
        return newStreams;
      });
    });

    return () => {
      socket.off('user-joined-call');
      socket.off('call-offer');
      socket.off('call-answer');
      socket.off('ice-candidate');
      socket.off('user-left-call');
    };
  }, [socket, roomId, userId]);

  return {
    localStream,
    remoteStreams,
    startCall,
    stopCall,
    startScreenShare,
    isScreenSharing,
  };
}; 