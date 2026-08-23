import { useCallback } from 'react';

export const useSoundEffects = () => {
    const playTone = useCallback((freq: number, type: OscillatorType, duration: number) => {
        try {
            const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;

            const ctx = new AudioCtx();
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
