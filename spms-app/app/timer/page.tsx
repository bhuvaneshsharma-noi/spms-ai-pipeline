"use client";

import { useEffect, useState } from 'react';

const TimerPage = () => {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes
  const [breakTimeLeft, setBreakTimeLeft] = useState(300); // 5 minutes
  const [sessionCount, setSessionCount] = useState(0);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (isActive) {
      timer = setInterval(() => {
        if (timeLeft > 0) {
          setTimeLeft((prev) => prev - 1);
        } else if (!isBreak) {
          setSessionCount((prev) => prev + 1);
          setIsBreak(true);
          setBreakTimeLeft(300);
        } else if (breakTimeLeft > 0) {
          setBreakTimeLeft((prev) => prev - 1);
        } else {
          setIsBreak(false);
          setTimeLeft(1500);
          setBreakTimeLeft(300);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, breakTimeLeft, isBreak]);

  const handleStart = () => setIsActive(true);
  const handlePause = () => setIsActive(false);
  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(1500);
    setBreakTimeLeft(300);
    setSessionCount(0);
    setIsBreak(false);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-4">Pomodoro Timer</h1>
      <div className="text-6xl font-mono mb-4">
        {isBreak ? 'Break Time' : 'Study Time'}: {formatTime(isBreak ? breakTimeLeft : timeLeft)}
      </div>
      <div className="flex space-x-4 mb-4">
        <button onClick={handleStart} className="bg-blue-500 text-white px-4 py-2 rounded">Start</button>
        <button onClick={handlePause} className="bg-yellow-500 text-white px-4 py-2 rounded">Pause</button>
        <button onClick={handleReset} className="bg-red-500 text-white px-4 py-2 rounded">Reset</button>
      </div>
      <div className="text-xl">Sessions Completed: {sessionCount}</div>
    </div>
  );
};

export default TimerPage;
