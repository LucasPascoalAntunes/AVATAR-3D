import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from './store.js';
import Scene3D from './components/Scene3D.jsx';
import SlidePanel from './components/SlidePanel.jsx';
import ControlBar from './components/ControlBar.jsx';
import CustomizerPanel from './components/CustomizerPanel.jsx';
import { SettingsIcon } from './components/Icons.jsx';

export default function App() {
  const isLoading = useStore(s => s.isLoading);
  const toggle = useStore(s => s.toggleCustomizer);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    const onVoices = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
  }, []);

  return (
    <div className="app-root">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="loading-content">
              <div className="loading-spinner" />
              <h2>Carregando Avatar 3D</h2>
              <p>Preparando a apresentação...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Scene3D />

      <div className="ui-overlay">
        <header className="app-header">
          <div className="header-left">
            <h1 className="header-title">Inteligência Artificial na Saúde Pública</h1>
            <p className="header-authors">Lucas Pascoal Antunes &bull; Christian Santos de Oliveira &mdash; Prof. Cupido &mdash; UNIP 2026</p>
          </div>
          <button className="customizer-toggle" onClick={toggle} title="Personalizar Avatar">
            <SettingsIcon size={22} />
            <span>Personalizar</span>
          </button>
        </header>

        <SlidePanel />
        <ControlBar />
        <CustomizerPanel />
      </div>
    </div>
  );
}
