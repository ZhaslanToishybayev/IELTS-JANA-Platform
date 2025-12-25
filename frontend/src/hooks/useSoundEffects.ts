import { useCallback } from 'react';

// Short, efficient base64 sound effects (created via bfxr/jsfxr or standard UI packs)
const SOUNDS = {
    click: 'data:audio/wav;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', // Placeholder (too long to inline real wavs here effectively without bloat, using meaningful short blips in implementation)
    // For the purpose of this demo, I will use very short, synthesized-like placeholders or reliable public URLs if base64 is too large. 
    // Actually, for a reliable experience without 10KB strings, let's use a very simple approach:
    // Short pure tone generation using Web Audio API is better and lighter!
};

export const useSoundEffects = () => {
    const playTone = useCallback((freq: number, type: OscillatorType, duration: number) => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;

            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + duration);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    }, []);

    const playClick = useCallback(() => playTone(800, 'sine', 0.1), [playTone]);
    const playSuccess = useCallback(() => {
        playTone(600, 'sine', 0.1);
        setTimeout(() => playTone(800, 'sine', 0.2), 100);
    }, [playTone]);
    const playError = useCallback(() => playTone(150, 'sawtooth', 0.3), [playTone]);
    const playLevelUp = useCallback(() => {
        [400, 500, 600, 800].forEach((freq, i) => {
            setTimeout(() => playTone(freq, 'triangle', 0.2), i * 100);
        });
    }, [playTone]);

    return {
        playClick,
        playSuccess,
        playError,
        playLevelUp
    };
};
