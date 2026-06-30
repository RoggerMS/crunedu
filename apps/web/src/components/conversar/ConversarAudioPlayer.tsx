"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface ConversarAudioPlayerProps {
  src: string;
  title: string;
  durationSeconds?: number;
  onPlayCount?: () => void;
}

export function ConversarAudioPlayer({ src, title, durationSeconds, onPlayCount }: ConversarAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const countedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || durationSeconds || 0);
    const onEnd = () => setPlaying(false);
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    const onErr = () => {
      setError("No se pudo cargar el audio.");
      setLoading(false);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("error", onErr);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("error", onErr);
    };
  }, [durationSeconds]);

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    setError(null);
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
        if (!countedRef.current) {
          countedRef.current = true;
          onPlayCount?.();
        }
      }
    } catch {
      setError("No se pudo reproducir el audio.");
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value;
    setVolume(value);
    setMuted(value === 0);
  }

  function toggleMute() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  }

  function changeRate() {
    const rates = [1, 1.25, 1.5, 2];
    const next = rates[(rates.indexOf(rate) + 1) % rates.length];
    setRate(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }

  function restart() {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
  }

  function formatTime(s: number): string {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="flex items-center gap-3">
        <button onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproducir"} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700">
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-slate-500">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 1}
              value={currentTime}
              step={0.1}
              onChange={(e) => seek(Number(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600"
              aria-label="Progreso del audio"
            />
            <span className="text-xs text-slate-500">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      <div className="mt-3 flex items-center gap-2">
        <button onClick={toggleMute} aria-label={muted ? "Activar volumen" : "Silenciar"} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(e) => changeVolume(Number(e.target.value))} className="h-1.5 w-20 cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600" aria-label="Volumen" />
        <button onClick={changeRate} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50" aria-label="Velocidad de reproducción">
          {rate}x
        </button>
        <button onClick={restart} aria-label="Reiniciar" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
          <RotateCcw size={16} />
        </button>
      </div>
    </div>
  );
}
