import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store.js';
import { TCC_SLIDES } from '../data/tccContent.js';
import { SlideIcon } from './Icons.jsx';

export default function SlidePanel() {
  const currentSlide = useStore(s => s.currentSlide);
  const slide = TCC_SLIDES[currentSlide];

  if (!slide) return null;

  return (
    <div className="slide-panel">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="slide-content"
        >
          <div className="slide-section" style={{ color: slide.themeColor }}>
            <SlideIcon name={slide.icon} size={18} color={slide.themeColor} />
            <span>{slide.section}</span>
          </div>

          <h2 className="slide-title" style={{ borderLeftColor: slide.themeColor }}>
            {slide.title}
          </h2>

          {slide.subtitle && (
            <p className="slide-subtitle">{slide.subtitle}</p>
          )}

          <ul className="slide-bullets">
            {slide.bullets.map((bullet, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
              >
                <span className="bullet-dot" style={{ background: slide.themeColor }} />
                {bullet}
              </motion.li>
            ))}
          </ul>

          {slide.stats && (
            <div className="slide-stats">
              {slide.stats.map((stat, i) => (
                <div key={i} className="stat-item" style={{ borderColor: slide.themeColor + '44' }}>
                  <span className="stat-value" style={{ color: slide.themeColor }}>{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="slide-indicator">
            {TCC_SLIDES.map((_, i) => (
              <div
                key={i}
                className={`indicator-dot ${i === currentSlide ? 'active' : ''}`}
                style={i === currentSlide ? { background: slide.themeColor } : {}}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
