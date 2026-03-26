import React, { useCallback } from 'react';
import useStore from '../store.js';
import { TCC_SLIDES } from '../data/tccContent.js';
import { useSpeech } from '../hooks/useSpeech.js';
import { EMOTE_CATEGORIES } from '../engine/EmoteLibrary.js';
import {
  PlayIcon, PauseIcon, StopIcon,
  ChevronLeftIcon, ChevronRightIcon,
  SmileIcon, EmoteIcon,
} from './Icons.jsx';

export default function ControlBar() {
  const currentSlide = useStore(s => s.currentSlide);
  const isSpeaking = useStore(s => s.isSpeaking);
  const isPaused = useStore(s => s.isPaused);
  const speechRate = useStore(s => s.speechRate);
  const autoAdvance = useStore(s => s.autoAdvance);
  const setPlaying = useStore(s => s.setPlaying);
  const setPaused = useStore(s => s.setPaused);
  const nextSlide = useStore(s => s.nextSlide);
  const prevSlide = useStore(s => s.prevSlide);
  const setSpeechRate = useStore(s => s.setSpeechRate);
  const setAutoAdvance = useStore(s => s.setAutoAdvance);
  const triggerEmote = useStore(s => s.triggerEmote);
  const totalSlides = useStore(s => s.totalSlides);

  const { speak, pause, resume, stop } = useSpeech();

  const onSpeechEnd = useCallback(() => {
    setPlaying(false);
    setPaused(false);
    if (autoAdvance && currentSlide < totalSlides - 1) {
      setTimeout(() => {
        nextSlide();
        setTimeout(() => {
          const nextIdx = useStore.getState().currentSlide;
          const nextContent = TCC_SLIDES[nextIdx];
          if (nextContent) {
            setPlaying(true);
            speak(nextContent.speech, onSpeechEnd);
          }
        }, 600);
      }, 800);
    }
  }, [autoAdvance, currentSlide, totalSlides, nextSlide, setPlaying, setPaused, speak]);

  const handlePlayPause = useCallback(() => {
    if (isSpeaking && !isPaused) {
      pause();
      setPaused(true);
      return;
    }
    if (isPaused) {
      resume();
      setPaused(false);
      return;
    }
    const slide = TCC_SLIDES[currentSlide];
    if (slide) {
      setPlaying(true);
      setPaused(false);
      speak(slide.speech, onSpeechEnd);
    }
  }, [isSpeaking, isPaused, currentSlide, setPlaying, setPaused, speak, pause, resume, onSpeechEnd]);

  const handleStop = useCallback(() => {
    stop();
    setPlaying(false);
    setPaused(false);
  }, [stop, setPlaying, setPaused]);

  const handlePrev = useCallback(() => {
    handleStop();
    prevSlide();
  }, [handleStop, prevSlide]);

  const handleNext = useCallback(() => {
    handleStop();
    nextSlide();
  }, [handleStop, nextSlide]);

  const speeds = [0.75, 1.0, 1.25, 1.5];
  const [showEmotes, setShowEmotes] = React.useState(false);

  return (
    <div className="control-bar">
      <div className="control-bar-inner">
        <div className="control-group">
          <button className="ctrl-btn" onClick={handlePrev} title="Anterior" disabled={currentSlide === 0}>
            <ChevronLeftIcon />
          </button>
          <span className="slide-counter">{currentSlide + 1} / {totalSlides}</span>
          <button className="ctrl-btn" onClick={handleNext} title="Proximo" disabled={currentSlide >= totalSlides - 1}>
            <ChevronRightIcon />
          </button>
        </div>

        <div className="control-group">
          <button className="ctrl-btn play-btn" onClick={handlePlayPause} title="Play / Pause">
            {isSpeaking && !isPaused ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className="ctrl-btn" onClick={handleStop} title="Parar">
            <StopIcon />
          </button>
        </div>

        <div className="control-group">
          <label className="ctrl-label">Velocidade</label>
          <div className="speed-btns">
            {speeds.map(s => (
              <button
                key={s}
                className={`speed-btn ${speechRate === s ? 'active' : ''}`}
                onClick={() => setSpeechRate(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label className="ctrl-label">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={e => setAutoAdvance(e.target.checked)}
            />
            Auto
          </label>
        </div>

        <div className="control-group emote-group">
          <button
            className="ctrl-btn"
            onClick={() => setShowEmotes(!showEmotes)}
            disabled={isSpeaking}
            title={isSpeaking ? 'Pause a fala para usar emotes' : 'Emotes'}
          >
            <SmileIcon size={16} /> Emotes
          </button>
          {showEmotes && !isSpeaking && (
            <div className="emote-dropdown">
              {Object.entries(EMOTE_CATEGORIES).map(([catKey, cat]) => (
                <div key={catKey} className="emote-category">
                  <div className="emote-cat-label">{cat.label}</div>
                  <div className="emote-items">
                    {cat.items.map(em => (
                      <button
                        key={em.key}
                        className="emote-btn"
                        onClick={() => { triggerEmote(em.key); setShowEmotes(false); }}
                      >
                        <EmoteIcon name={em.icon} size={14} /> {em.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
