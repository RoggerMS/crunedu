"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Room, RoomEvent, Track, ConnectionState, LocalParticipant, RemoteParticipant } from "livekit-client";
import { joinConversation, leaveConversation, type ConversationJoinResponse } from "@/lib/conversations-api";
import type { ConversationDetail, ConversationParticipantRole } from "@crunedu/shared";

export type RoomConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "failed";

export interface ParticipantInfo {
  identity: string;
  name: string;
  isSpeaking: boolean;
  hasMic: boolean;
  isMicEnabled: boolean;
  role: ConversationParticipantRole;
  isLocal: boolean;
  metadata: { userId?: number; role?: string; conversationId?: number };
}

interface UseLiveKitConversationOptions {
  conversationId: number;
  inviteToken?: string;
  autoJoin?: boolean;
}

export function useLiveKitConversation({ conversationId, inviteToken, autoJoin = false }: UseLiveKitConversationOptions) {
  const [connectionState, setConnectionState] = useState<RoomConnectionState>("idle");
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinResponse, setJoinResponse] = useState<ConversationJoinResponse | null>(null);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const roomRef = useRef<Room | null>(null);

  const canPublish = useMemo(() => {
    const role = joinResponse?.role;
    return role === "HOST" || role === "MODERATOR" || role === "SPEAKER";
  }, [joinResponse?.role]);

  const parseMetadata = (metadata?: string): ParticipantInfo["metadata"] => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  };

  const buildParticipant = (p: LocalParticipant | RemoteParticipant, isLocal: boolean, role?: ConversationParticipantRole): ParticipantInfo => {
    const meta = parseMetadata(p.metadata);
    const micTrack = isLocal
      ? (p as LocalParticipant).getTrackPublication(Track.Source.Microphone)
      : (p as RemoteParticipant).getTrackPublication(Track.Source.Microphone);
    return {
      identity: p.identity,
      name: p.name || p.identity,
      isSpeaking: p.isSpeaking,
      hasMic: Boolean(micTrack),
      isMicEnabled: micTrack?.isMuted === false,
      role: role ?? (meta.role as ConversationParticipantRole) ?? "LISTENER",
      isLocal,
      metadata: meta,
    };
  };

  const updateParticipantsList = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const local = room.localParticipant;
    const remote = Array.from(room.remoteParticipants.values());
    const all: ParticipantInfo[] = [buildParticipant(local, true, joinResponse?.role)];
    for (const p of remote) {
      all.push(buildParticipant(p, false));
    }
    setParticipants(all);
  }, [joinResponse?.role]);

  const join = useCallback(async () => {
    if (roomRef.current) return;
    setError(null);
    setConnectionState("connecting");
    try {
      const response = await joinConversation(conversationId, inviteToken);
      setJoinResponse(response);

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      roomRef.current = room;

      room
        .on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (state === ConnectionState.Connected) setConnectionState("connected");
          else if (state === ConnectionState.Reconnecting) setConnectionState("reconnecting");
          else if (state === ConnectionState.Disconnected) setConnectionState("disconnected");
        })
        .on(RoomEvent.ParticipantConnected, updateParticipantsList)
        .on(RoomEvent.ParticipantDisconnected, updateParticipantsList)
        .on(RoomEvent.TrackPublished, updateParticipantsList)
        .on(RoomEvent.TrackUnpublished, updateParticipantsList)
        .on(RoomEvent.TrackMuted, updateParticipantsList)
        .on(RoomEvent.TrackUnmuted, updateParticipantsList)
        .on(RoomEvent.ActiveSpeakersChanged, (speakers: Array<{ identity: string }>) => {
          setActiveSpeakerId(speakers[0]?.identity ?? null);
          updateParticipantsList();
        });

      await room.connect(response.livekitUrl, response.token);

      // Listener: do not publish mic automatically
      if (canPublish) {
        // Mic is NOT enabled by default; user must press the mic button
        setIsMicEnabled(false);
      }

      updateParticipantsList();
    } catch (err) {
      setConnectionState("failed");
      setError(err instanceof Error ? err.message : "No se pudo conectar a la conversación.");
    }
  }, [conversationId, inviteToken, canPublish, updateParticipantsList]);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || !canPublish) return;
    const local = room.localParticipant;
    const micTrack = local.getTrackPublication(Track.Source.Microphone);
    if (micTrack && !micTrack.isMuted) {
      await local.setMicrophoneEnabled(false);
      setIsMicEnabled(false);
    } else {
      await local.setMicrophoneEnabled(true);
      setIsMicEnabled(true);
    }
    updateParticipantsList();
  }, [canPublish, updateParticipantsList]);

  const leave = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.disconnect();
    roomRef.current = null;
    setConnectionState("disconnected");
    setParticipants([]);
    setIsMicEnabled(false);
    try {
      await leaveConversation(conversationId);
    } catch {
      // ignore
    }
  }, [conversationId]);

  useEffect(() => {
    if (autoJoin) join();
    return () => {
      const room = roomRef.current;
      if (room) {
        room.disconnect();
        roomRef.current = null;
      }
    };
  }, [autoJoin, join]);

  return {
    conversation: joinResponse?.conversation ?? null,
    role: joinResponse?.role ?? null,
    connectionState,
    participants,
    activeSpeakerId,
    isMicEnabled,
    canPublish,
    error,
    join,
    leave,
    toggleMic,
    room: roomRef.current,
  };
}
