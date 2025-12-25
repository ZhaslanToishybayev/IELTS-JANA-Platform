'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface AudioPlayerProps {
    src: string;
    title?: string;
    duration?: number;
    onEnded?: () => void;
    autoPlay?: boolean;
}

export default function AudioPlayer({
    src,
    title,
    duration: initialDuration,
    onEnded,
    autoPlay = false
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(initialDuration || 0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleLoadedMetadata = () => {
            setDuration(audio.duration);
            setIsLoading(false);
            if (autoPlay) {
                audio.play();
                setIsPlaying(true);
            }
        };

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
            onEnded?.();
        };

        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('waiting', handleWaiting);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('waiting', handleWaiting);
            audio.removeEventListener('canplay', handleCanPlay);
        };
    }, [autoPlay, onEnded]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const time = parseFloat(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const vol = parseFloat(e.target.value);
        audio.volume = vol;
        setVolume(vol);
    };

    const handleSpeedChange = (speed: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.playbackRate = speed;
        setPlaybackRate(speed);
    };

    const skip = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Title */}
            {title && (
                <h3 className="text-lg font-semibold text-white mb-4 truncate">
                    🎧 {title}
                </h3>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                        className="absolute h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.1 }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                {/* Skip Back */}
                <button
                    onClick={() => skip(-10)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Назад 10 сек"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.5 3C17.15 3 21.08 6.03 22.47 10.22L20.1 11C19.05 7.81 16.04 5.5 12.5 5.5C10.54 5.5 8.77 6.22 7.38 7.38L10 10H3V3L5.6 5.6C7.45 4 9.85 3 12.5 3M10 12L8 14H14L12 12L12 12M3.53 13.78L5.9 13C6.95 16.19 9.96 18.5 13.5 18.5C15.46 18.5 17.23 17.78 18.62 16.62L16 14H23V21L20.4 18.4C18.55 20 16.15 21 13.5 21C8.85 21 4.92 17.97 3.53 13.78Z" />
                    </svg>
                </button>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    disabled={isLoading}
                    className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isLoading ? (
                        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Skip Forward */}
                <button
                    onClick={() => skip(10)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Вперёд 10 сек"
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.5 3C6.85 3 2.92 6.03 1.53 10.22L3.9 11C4.95 7.81 7.96 5.5 11.5 5.5C13.46 5.5 15.23 6.22 16.62 7.38L14 10H21V3L18.4 5.6C16.55 4 14.15 3 11.5 3M14 12L16 14H10L12 12L12 12M20.47 13.78L18.1 13C17.05 16.19 14.04 18.5 10.5 18.5C8.54 18.5 6.77 17.78 5.38 16.62L8 14H1V21L3.6 18.4C5.45 20 7.85 21 10.5 21C15.15 21 19.08 17.97 20.47 13.78Z" />
                    </svg>
                </button>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-between mt-6">
                {/* Volume */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleVolumeChange({ target: { value: volume === 0 ? '1' : '0' } } as any)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                {/* Playback Speed */}
                <div className="flex items-center gap-2">
                    {[0.75, 1, 1.25, 1.5].map(speed => (
                        <button
                            key={speed}
                            onClick={() => handleSpeedChange(speed)}
                            className={`px-2 py-1 text-xs rounded ${playbackRate === speed
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-400 hover:text-white'
                                } transition-colors`}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
