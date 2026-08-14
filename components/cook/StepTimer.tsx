"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, BellRing } from "lucide-react";
import { formatSeconds } from "@/lib/cookingSteps";

export default function StepTimer({ seconds }: { seconds: number }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(false);
    setDone(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setDone(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const reset = () => {
    setRemaining(seconds);
    setRunning(false);
    setDone(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card p-5">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div
            key="done"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-1 text-citrus-600"
          >
            <BellRing size={32} />
            <p className="text-sm font-semibold">Time's up!</p>
          </motion.div>
        ) : (
          <motion.span
            key="time"
            animate={running ? { scale: [1, 1.03, 1] } : {}}
            transition={{ repeat: running ? Infinity : 0, duration: 1 }}
            className="text-5xl font-semibold tabular-nums text-foreground"
          >
            {formatSeconds(remaining)}
          </motion.span>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={reset}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-full bg-muted"
          aria-label="Reset"
        >
          <RotateCcw size={20} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (done) {
              setRemaining(seconds);
              setDone(false);
              setRunning(true);
              return;
            }
            setRunning((r) => !r);
          }}
          className="tap-target flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground"
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause size={26} /> : <Play size={26} className="ml-0.5" />}
        </motion.button>
        <div className="h-12 w-12" />
      </div>
    </div>
  );
}
