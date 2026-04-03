import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store.js';
import { CloseIcon } from './Icons.jsx';

const VOICE_PRESETS = [
  { pitch: 0.8, label: 'Grave' },
  { pitch: 1.0, label: 'Normal' },
  { pitch: 1.2, label: 'Média' },
  { pitch: 1.5, label: 'Aguda' },
];

const COLOR_FIELDS = [
  { key: 'skinColor',  label: 'Pele' },
  { key: 'eyeColor',   label: 'Olhos' },
  { key: 'hairColor',  label: 'Cabelo' },
  { key: 'topColor',   label: 'Roupa (topo)' },
  { key: 'bottomColor', label: 'Roupa (baixo)' },
  { key: 'shoeColor',  label: 'Sapato' },
];

const EXPRESSIONS = [
  { key: 'neutral', label: 'Neutro' },
  { key: 'happy', label: 'Feliz' },
  { key: 'sad', label: 'Triste' },
  { key: 'angry', label: 'Bravo' },
  { key: 'surprised', label: 'Surpreso' },
  { key: 'think', label: 'Pensando' },
];

export default function CustomizerPanel() {
  const show = useStore(s => s.showCustomizer);
  const toggle = useStore(s => s.toggleCustomizer);
  const setProp = useStore(s => s.setAvatarProp);
  const avatarProps = useStore(s => s.avatarProps);
  const currentExpression = useStore(s => s.currentExpression);
  const expressionIntensity = useStore(s => s.expressionIntensity);

  const [tab, setTab] = useState(0);
  const props = avatarProps[tab] || {};

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="customizer-panel"
          initial={{ opacity: 0, x: -320 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -320 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="cust-header">
            <h3>Personalizar</h3>
            <button className="cust-close" onClick={toggle}><CloseIcon /></button>
          </div>

          <div className="cust-avatar-tabs">
            <button className={`cust-tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>
              Avatar 1 (Masc.)
            </button>
            <button className={`cust-tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
              Avatar 2 (Fem.)
            </button>
          </div>

          <div className="cust-scroll">
            <div className="cust-row">
              <label className="cust-label">Voz</label>
              <div className="btn-group">
                {VOICE_PRESETS.map(vp => (
                  <button
                    key={vp.pitch}
                    className={`group-btn ${props.voicePitch === vp.pitch ? 'active' : ''}`}
                    onClick={() => setProp(tab, 'voicePitch', vp.pitch)}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
            </div>

            {COLOR_FIELDS.map(cf => (
              <div className="cust-row" key={cf.key}>
                <label className="cust-label">{cf.label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="color"
                    value={props[cf.key] || '#888888'}
                    onChange={e => setProp(tab, cf.key, e.target.value)}
                    style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{props[cf.key]}</span>
                </div>
              </div>
            ))}

            <div className="cust-row">
              <label className="cust-label">Expressão</label>
              <div className="btn-group">
                {EXPRESSIONS.map(ex => (
                  <button
                    key={ex.key}
                    className={`group-btn ${currentExpression === ex.key ? 'active' : ''}`}
                    onClick={() => {
                      useStore.getState().setExpression(ex.key, 1.0);
                    }}
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cust-row">
              <label className="cust-label">Intensidade: {Math.round(expressionIntensity * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={expressionIntensity}
                onChange={e => useStore.getState().setExpression(currentExpression, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
