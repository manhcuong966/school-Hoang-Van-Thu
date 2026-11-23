import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteRtcSignal,
  RtcSignalDoc,
  sendRtcSignal,
  subscribeRtcSignals,
} from '../firebase';
import { PlayerPresence } from '../types/game';

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

interface UseVoiceChatOptions {
  myUid: string | null;
  remotePlayers: PlayerPresence[];
  isMicMutedByAdmin: boolean;
}

export function useVoiceChat({
  myUid,
  remotePlayers,
  isMicMutedByAdmin,
}: UseVoiceChatOptions) {
  const [micEnabled, setMicEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [connectedPeersCount, setConnectedPeersCount] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingIceRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const meterTimerRef = useRef<number | null>(null);
  const micEnabledRef = useRef(false);
  micEnabledRef.current = micEnabled;

  const myUidRef = useRef(myUid);
  myUidRef.current = myUid;

  const cleanupPeer = useCallback((peerUid: string) => {
    const pc = peersRef.current.get(peerUid);
    if (pc) {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peersRef.current.delete(peerUid);
    }
    const audioEl = audioElsRef.current.get(peerUid);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      audioElsRef.current.delete(peerUid);
    }
    pendingIceRef.current.delete(peerUid);
    setConnectedPeersCount(peersRef.current.size);
  }, []);

  const stopLocalMic = useCallback(() => {
    if (meterTimerRef.current) {
      window.clearInterval(meterTimerRef.current);
      meterTimerRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    peersRef.current.forEach((_pc, peerUid) => cleanupPeer(peerUid));
    setMicEnabled(false);
    setIsSpeaking(false);
  }, [cleanupPeer]);

  // Immediately force-stop microphone if Admin or Teacher mutes this user
  useEffect(() => {
    if (isMicMutedByAdmin && micEnabled) {
      stopLocalMic();
      setMicError('Mic của bạn đã bị Quản lý / Giáo viên tắt.');
    }
  }, [isMicMutedByAdmin, micEnabled, stopLocalMic]);

  useEffect(() => {
    return () => {
      stopLocalMic();
    };
  }, [stopLocalMic]);

  const getOrCreatePeer = useCallback(
    (peerUid: string): RTCPeerConnection => {
      const existing = peersRef.current.get(peerUid);
      if (existing) return existing;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      pc.onicecandidate = (event) => {
        const uid = myUidRef.current;
        if (event.candidate && uid) {
          sendRtcSignal(uid, peerUid, 'ice', JSON.stringify(event.candidate.toJSON())).catch(() => {});
        }
      };

      pc.ontrack = (event) => {
        let audioEl = audioElsRef.current.get(peerUid);
        if (!audioEl) {
          audioEl = document.createElement('audio');
          audioEl.autoplay = true;
          audioEl.setAttribute('playsinline', 'true');
          document.body.appendChild(audioEl);
          audioElsRef.current.set(peerUid, audioEl);
        }
        if (event.streams[0]) {
          audioEl.srcObject = event.streams[0];
          audioEl.play().catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          cleanupPeer(peerUid);
        }
      };

      peersRef.current.set(peerUid, pc);
      setConnectedPeersCount(peersRef.current.size);
      return pc;
    },
    [cleanupPeer]
  );

  // Initiate WebRTC offers cleanly using deterministic UID ordering
  useEffect(() => {
    if (!myUid) return;
    const onlineSet = new Set(remotePlayers.map((p) => p.uid));

    // Close disconnected peers
    Array.from(peersRef.current.keys()).forEach((peerUid) => {
      if (!onlineSet.has(peerUid)) {
        cleanupPeer(peerUid);
      }
    });

    if (!micEnabled) return;

    remotePlayers.forEach(async (peer) => {
      if (peer.uid === myUid) return;
      if (peersRef.current.has(peer.uid)) return;
      if (myUid < peer.uid) {
        try {
          const pc = getOrCreatePeer(peer.uid);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendRtcSignal(myUid, peer.uid, 'offer', JSON.stringify(offer));
        } catch {
          // Ignore transient signaling error
        }
      }
    });
  }, [myUid, remotePlayers, micEnabled, getOrCreatePeer, cleanupPeer]);

  // Listen for incoming WebRTC signaling packets from Firestore
  useEffect(() => {
    if (!myUid) return;
    const handledIds = new Set<string>();

    const unsub = subscribeRtcSignals(
      myUid,
      async (signals: RtcSignalDoc[]) => {
        for (const sig of signals) {
          if (handledIds.has(sig.id)) continue;
          handledIds.add(sig.id);
          deleteRtcSignal(sig.id).catch(() => {});

          try {
            const pc = getOrCreatePeer(sig.fromUid);
            const parsed = JSON.parse(sig.payload);

            if (sig.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(parsed));
              const queued = pendingIceRef.current.get(sig.fromUid) || [];
              for (const c of queued) {
                await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
              }
              pendingIceRef.current.delete(sig.fromUid);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await sendRtcSignal(myUid, sig.fromUid, 'answer', JSON.stringify(answer));
            } else if (sig.type === 'answer') {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(parsed));
                const queued = pendingIceRef.current.get(sig.fromUid) || [];
                for (const c of queued) {
                  await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
                }
                pendingIceRef.current.delete(sig.fromUid);
              }
            } else if (sig.type === 'ice') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(parsed)).catch(() => {});
              } else {
                const list = pendingIceRef.current.get(sig.fromUid) || [];
                list.push(parsed);
                pendingIceRef.current.set(sig.fromUid, list);
              }
            }
          } catch {
            // Ignore malformed or stale signal
          }
        }
      },
      () => {}
    );

    return () => unsub();
  }, [myUid, getOrCreatePeer]);

  const toggleMic = useCallback(async () => {
    setMicError(null);
    if (isMicMutedByAdmin) {
      setMicError('Bạn đang bị Quản lý / Giáo viên tắt mic.');
      return;
    }
    if (micEnabledRef.current) {
      stopLocalMic();
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Trình duyệt không hỗ trợ micro.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false,
      });
      localStreamRef.current = stream;

      // Attach local audio track to any existing peer connections
      peersRef.current.forEach((pc, peerUid) => {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
        if (myUidRef.current) {
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer).then(() => offer))
            .then((offer) =>
              sendRtcSignal(myUidRef.current!, peerUid, 'offer', JSON.stringify(offer))
            )
            .catch(() => {});
        }
      });

      // Audio speaking meter
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const buf = new Uint8Array(analyser.frequencyBinCount);
        meterTimerRef.current = window.setInterval(() => {
          analyser.getByteFrequencyData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i++) sum += buf[i];
          const avg = sum / buf.length;
          setIsSpeaking(avg > 12);
        }, 180);
      }

      setMicEnabled(true);
    } catch {
      setMicError('Không thể bật micro. Vui lòng cấp quyền microphone cho trình duyệt.');
    }
  }, [isMicMutedByAdmin, stopLocalMic]);

  return {
    micEnabled,
    isSpeaking,
    micError,
    connectedPeersCount,
    toggleMic,
    stopLocalMic,
  };
}
