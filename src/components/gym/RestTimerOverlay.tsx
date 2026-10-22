import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, X, BellRing } from 'lucide-react';
import { formatDuration } from '../../services/calculations';

interface RestTimerOverlayProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerOverlay: React.FC<RestTimerOverlayProps> = ({
  initialSeconds = 90,
  isOpen,
  onClose,
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [totalSeconds, setTotalSeconds] = useState<number>(initialSeconds);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setTotalSeconds(initialSeconds);
      setIsFinished(false);
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || isFinished) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsFinished(true);
          playNotificationBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isFinished]);

  const playNotificationBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);

      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      // AudioContext unavailable
    }
  };

  const addSeconds = (amt: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + amt));
    setTotalSeconds((prev) => Math.max(prev, secondsLeft + amt));
  };

  const progress = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-20 md:bottom-8 right-4 left-4 sm:left-auto md:right-8 z-50 bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-2xl sm:w-80 select-none text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                isFinished ? 'bg-amber-100 text-amber-800' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {isFinished ? <BellRing className="w-4 h-4" /> : <Timer className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isFinished ? 'Rest Complete!' : 'Resting Between Sets'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isFinished ? 'Ready for next set' : 'Replenishing energy'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              aria-label="Dismiss timer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Time Counter */}
          <div className="text-center py-2">
            <span className={`text-4xl font-black font-mono tracking-tight ${
              isFinished ? 'text-amber-600' : 'text-slate-900'
            }`}>
              {formatDuration(secondsLeft)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden my-3">
            <div
              className={`h-full transition-all duration-1000 ${
                isFinished ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Adjustment steppers */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex gap-1.5">
              <button
                onClick={() => addSeconds(-15)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold border border-slate-200"
              >
                -15s
              </button>
              <button
                onClick={() => addSeconds(30)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold border border-slate-200"
              >
                +30s
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
            >
              Skip
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
