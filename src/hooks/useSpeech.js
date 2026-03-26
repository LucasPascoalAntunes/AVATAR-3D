import { useCallback, useRef, useEffect } from 'react';
import useStore from '../store.js';

const VOWELS = /[aeiouáéíóúâêôãõ]/gi;
const MASCULINE_HINTS = /male|masculino|daniel|ricardo|marcos|carlos|paulo|felipe/i;
const FEMININE_HINTS = /female|feminino|maria|francisca|luciana|fernanda|vitória/i;

const CHAR_TO_VISEME = {
  'a': 'viseme_aa', 'á': 'viseme_aa', 'â': 'viseme_aa', 'ã': 'viseme_aa',
  'e': 'viseme_E',  'é': 'viseme_E',  'ê': 'viseme_E',
  'i': 'viseme_I',  'í': 'viseme_I',
  'o': 'viseme_O',  'ó': 'viseme_O',  'ô': 'viseme_O',  'õ': 'viseme_O',
  'u': 'viseme_U',  'ú': 'viseme_U',
  'p': 'viseme_PP', 'b': 'viseme_PP', 'm': 'viseme_PP',
  'f': 'viseme_FF', 'v': 'viseme_FF',
  't': 'viseme_DD', 'd': 'viseme_DD', 'l': 'viseme_DD',
  'n': 'viseme_nn', 'ñ': 'viseme_nn',
  's': 'viseme_SS', 'z': 'viseme_SS', 'ç': 'viseme_SS',
  'k': 'viseme_kk', 'g': 'viseme_kk', 'q': 'viseme_kk', 'c': 'viseme_kk',
  'r': 'viseme_RR',
  'x': 'viseme_CH', 'j': 'viseme_CH',
  'h': 'viseme_sil',
  ' ': 'viseme_sil', '.': 'viseme_sil', ',': 'viseme_sil',
  '!': 'viseme_sil', '?': 'viseme_sil', ':': 'viseme_sil',
  ';': 'viseme_sil', '-': 'viseme_sil',
};

export function useSpeech() {
  const utterRef = useRef(null);
  const animFrameRef = useRef(null);
  const textRef = useRef('');
  const charIndexRef = useRef(0);
  const keepAliveRef = useRef(null);

  const setSpeaking = useStore(s => s.setSpeaking);
  const setMouthOpen = useStore(s => s.setMouthOpen);
  const setViseme = useStore(s => s.setViseme);
  const speechRate = useStore(s => s.speechRate);
  const voicePitch = useStore(s => s.voicePitch);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    };
  }, []);

  const clearSpeechTimers = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
  }, []);

  const startMouthAnim = useCallback((text) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    textRef.current = text;
    charIndexRef.current = 0;
    const totalChars = text.length;
    const startTime = performance.now();

    const animate = () => {
      if (!utterRef.current) {
        setMouthOpen(0);
        setViseme('viseme_sil');
        return;
      }

      const elapsed = (performance.now() - startTime) / 1000;
      const charsPerSec = 12 * speechRate;
      const estimatedIdx = Math.floor(elapsed * charsPerSec);
      charIndexRef.current = Math.min(estimatedIdx, totalChars - 1);

      const windowSize = 3;
      const start = Math.max(0, charIndexRef.current - windowSize);
      const end = Math.min(totalChars, charIndexRef.current + windowSize);
      const window = text.substring(start, end);
      const vowelCount = (window.match(VOWELS) || []).length;
      const openness = Math.min(1, vowelCount / (windowSize * 1.2));

      const noise = Math.sin(elapsed * 25) * 0.08 + Math.sin(elapsed * 40) * 0.05;
      setMouthOpen(Math.max(0, Math.min(1, openness + noise)));

      const ch = text[charIndexRef.current]?.toLowerCase();
      setViseme(CHAR_TO_VISEME[ch] || 'viseme_sil');

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
  }, [speechRate, setMouthOpen, setViseme]);

  const speak = useCallback((text, onEnd) => {
    window.speechSynthesis.cancel();
    clearSpeechTimers();
    if (!text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'pt-BR';
    utter.rate = speechRate;
    utter.pitch = voicePitch;

    const voices = window.speechSynthesis.getVoices();
    const ptBR = voices.filter(v => v.lang.startsWith('pt') && v.lang.includes('BR'));
    const ptAny = voices.filter(v => v.lang.startsWith('pt'));
    const pool = ptBR.length ? ptBR : ptAny;
    const masculine = pool.find(v => MASCULINE_HINTS.test(v.name) && !FEMININE_HINTS.test(v.name));
    utter.voice = masculine || pool[0] || null;

    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 14000);

    utter.onstart = () => {
      setSpeaking(true);
      startMouthAnim(text);
    };

    utter.onend = () => {
      clearSpeechTimers();
      setSpeaking(false);
      setMouthOpen(0);
      setViseme('viseme_sil');
      utterRef.current = null;
      if (onEnd) onEnd();
    };

    utter.onerror = () => {
      clearSpeechTimers();
      setSpeaking(false);
      setMouthOpen(0);
      setViseme('viseme_sil');
      utterRef.current = null;
    };

    utterRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [clearSpeechTimers, speechRate, voicePitch, setSpeaking, setMouthOpen, setViseme, startMouthAnim]);

  const pause = useCallback(() => {
    clearSpeechTimers();
    window.speechSynthesis.pause();
    setSpeaking(false);
    setMouthOpen(0);
    setViseme('viseme_sil');
  }, [clearSpeechTimers, setSpeaking, setMouthOpen, setViseme]);

  const resume = useCallback(() => {
    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    window.speechSynthesis.resume();
    setSpeaking(true);
    if (utterRef.current && textRef.current) {
      startMouthAnim(textRef.current);
    }
    keepAliveRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 14000);
  }, [startMouthAnim, setSpeaking]);

  const stop = useCallback(() => {
    clearSpeechTimers();
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setMouthOpen(0);
    setViseme('viseme_sil');
    utterRef.current = null;
  }, [clearSpeechTimers, setSpeaking, setMouthOpen, setViseme]);

  return { speak, pause, resume, stop };
}
