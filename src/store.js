import { create } from 'zustand';

const useStore = create((set, get) => ({
  currentSlide: 0,
  isPlaying: false,
  isSpeaking: false,
  mouthOpen: 0,
  currentViseme: 'viseme_sil',
  isPaused: false,
  speechRate: 1.0,
  autoAdvance: true,
  totalSlides: 5,

  gender: 'male',
  skinColor: '#c68642',
  eyeColor: '#4a90d9',
  hairColor: '#2a1a0e',
  hairStyle: 'medium',
  lipColor: '#c45b6e',
  bodyType: 'normal',
  outfitStyle: 'formal',
  topColor: '#1a1a2e',
  bottomColor: '#1a1a2e',
  shoeColor: '#1a1a1a',
  voicePitch: 1.0,
  activePresenter: 0,

  currentEmote: null,
  emoteVersion: 0,
  emoteTarget: 0,
  currentExpression: 'neutral',
  expressionIntensity: 1.0,
  emoteTimer: null,

  showCustomizer: false,
  isLoading: true,

  setSlide: (idx) => {
    const total = get().totalSlides;
    const clamped = Math.max(0, Math.min(idx, total - 1));
    set({ currentSlide: clamped });
  },
  nextSlide: () => {
    const { currentSlide, totalSlides } = get();
    if (currentSlide < totalSlides - 1) set({ currentSlide: currentSlide + 1 });
  },
  prevSlide: () => {
    const { currentSlide } = get();
    if (currentSlide > 0) set({ currentSlide: currentSlide - 1 });
  },

  setPlaying: (v) => set({ isPlaying: v }),
  setSpeaking: (v) => set({ isSpeaking: v }),
  setMouthOpen: (v) => set({ mouthOpen: v }),
  setViseme: (v) => set({ currentViseme: v }),
  setSpeechRate: (r) => set({ speechRate: r }),
  setAutoAdvance: (v) => set({ autoAdvance: v }),
  setPaused: (v) => set({ isPaused: v }),
  setActivePresenter: (v) => set({ activePresenter: v }),

  setAvatarProp: (key, value) => set({ [key]: value }),

  triggerEmote: (emoteKey, target = 0) => {
    const prev = get().emoteTimer;
    if (prev) clearTimeout(prev);
    set(s => ({ currentEmote: emoteKey, emoteTarget: target, emoteVersion: s.emoteVersion + 1 }));
    const timer = setTimeout(() => set({ currentEmote: null, emoteTimer: null }), 3000);
    set({ emoteTimer: timer });
  },
  setExpression: (name, intensity = 1.0) => set({ currentExpression: name, expressionIntensity: intensity }),

  toggleCustomizer: () => set(s => ({ showCustomizer: !s.showCustomizer })),
  setLoading: (v) => set({ isLoading: v }),
}));

export default useStore;
