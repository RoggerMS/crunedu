import type { Conversation, ConversationStatus, ConversationType, ParticipantStatus } from './types';

export function getConversationTypeLabel(type: ConversationType): string {
  const labels: Record<ConversationType, string> = {
    open: 'Conversación abierta',
    study: 'Sala de estudio',
    question: 'Pregunta para conversar',
    debate: 'Debate formal',
  };

  return labels[type];
}

export function getConversationStatusLabel(status: ConversationStatus): string {
  const labels: Record<ConversationStatus, string> = {
    waiting: 'En espera',
    live: 'En vivo',
    finished: 'Finalizada',
    recorded: 'Grabada',
  };

  return labels[status];
}

export function getParticipantStatusLabel(status: ParticipantStatus): string {
  const labels: Record<ParticipantStatus, string> = {
    speaking: 'Hablando',
    listening: 'Escuchando',
    handRaised: 'Mano levantada',
    host: 'Host',
  };

  return labels[status];
}

export function getSharedLinkDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'enlace inválido';
  }
}

export function getConversationActionLabel(conversation: Conversation): string {
  if (conversation.status === 'waiting') {
    return 'Unirme';
  }

  if (conversation.type === 'debate') {
    return 'Entrar al debate';
  }

  if (conversation.status === 'live') {
    return 'Entrar a conversar';
  }

  if (conversation.status === 'finished' || conversation.status === 'recorded') {
    return 'Ver grabación';
  }

  return 'Ver conversación';
}

export function getConversationStatusTone(status: ConversationStatus): string {
  const tones: Record<ConversationStatus, string> = {
    waiting: 'warning',
    live: 'success',
    finished: 'neutral',
    recorded: 'info',
  };

  return tones[status];
}

export function getConversationTypeTone(type: ConversationType): string {
  const tones: Record<ConversationType, string> = {
    open: 'sky',
    study: 'emerald',
    question: 'amber',
    debate: 'violet',
  };

  return tones[type];
}

export function formatParticipantSummary(conversation: Conversation): string {
  return `${conversation.talkingCount} hablando · ${conversation.listeningCount} escuchando`;
}


export function isLiveOrWaiting(conversation: Conversation): boolean {
  return conversation.status === 'live' || conversation.status === 'waiting';
}

export function isVisibleRecording(conversation: Conversation): boolean {
  if (conversation.status === 'finished' || conversation.status === 'recorded') return true;
  return !isLiveOrWaiting(conversation) && conversation.recording?.status === 'available';
}

export function getConversationRoute(conversation: Conversation): string {
  if (conversation.status === 'finished' || conversation.status === 'recorded') return `/app/conversar/${conversation.id}/finalizada`;
  if (conversation.type === 'debate') return `/app/conversar/${conversation.id}/debate`;
  return `/app/conversar/${conversation.id}`;
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
