import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store.js';
import { CloseIcon } from './Icons.jsx';

const VOICE_PRESETS = [
  { pitch: 0.8, label: 'Grave' },
  { pitch: 1.0, label: 'Normal' },
  { pitch: 1.2, label: 'Média' },
  { pitch: 1.5, label: 'Aguda' },
];

export default function CustomizerPanel() {
  const show = useStore(s => s.showCustomizer);
  const toggle = useStore(s => s.toggleCustomizer);
  const set = useStore(s => s.setAvatarProp);

  const voicePitch = useStore(s => s.voicePitch);
  const currentExpression = useStore(s => s.currentExpression);
  const expressionIntensity = useStore(s => s.expressionIntensity);

  const EXPRESSIONS = [
    { key: 'neutral', label: 'Neutro' },
    { key: 'happy', label: 'Feliz' },
    { key: 'sad', label: 'Triste' },
    { key: 'angry', label: 'Bravo' },
    { key: 'surprised', label: 'Surpreso' },
    { key: 'think', label: 'Pensando' },
  ];

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
            <h3>Controles do Avatar</h3>
            <button className="cust-close" onClick={toggle}><CloseIcon /></button>
          </div>

          <div className="cust-scroll">
            <div className="cust-row">
              <label className="cust-label">Modelo 3D</label>
              <p style={{ fontSize: '0.78rem', color: '#9898b0', lineHeight: 1.5, margin: 0 }}>
                Avatar 3D humanoid carregado via GLB (Three.js) com esqueleto Mixamo completo.
                Animações de gestos, expressões por bones e suporte pronto para visemes reais em avatares com blendshapes faciais.
              </p>
            </div>

            <div className="cust-row">
              <label className="cust-label">Voz</label>
              <div className="btn-group">
                {VOICE_PRESETS.map(vp => (
                  <button
                    key={vp.pitch}
                    className={`group-btn ${voicePitch === vp.pitch ? 'active' : ''}`}
                    onClick={() => set('voicePitch', vp.pitch)}
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="cust-row">
              <label className="cust-label">Expressão</label>
              <div className="btn-group">
                {EXPRESSIONS.map(ex => (
                  <button
                    key={ex.key}
                    className={`group-btn ${currentExpression === ex.key ? 'active' : ''}`}
                    onClick={() => {
                      set('currentExpression', ex.key);
                      set('expressionIntensity', 1.0);
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
                onChange={e => set('expressionIntensity', parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent)',
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
