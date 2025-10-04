import React, { useState, useEffect } from 'react';

interface OtpTimerProps {
  expiresAt: number; // timestamp
  onExpired?: () => void;
  className?: string;
}

export const OtpTimer: React.FC<OtpTimerProps> = ({ 
  expiresAt, 
  onExpired, 
  className = "" 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = expiresAt - now;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
        onExpired?.();
        return;
      }
      
      setTimeLeft(remaining);
      setIsExpired(false);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    if (isExpired) return 'text-red-600';
    if (timeLeft < 60000) return 'text-orange-500'; // Less than 1 minute
    return 'text-green-600';
  };

  if (isExpired) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-red-600 font-medium">OTP Expired</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 bg-current rounded-full ${getTimerColor()}`}></div>
      <span className={`font-mono font-medium ${getTimerColor()}`}>
        Expires in: {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default OtpTimer;