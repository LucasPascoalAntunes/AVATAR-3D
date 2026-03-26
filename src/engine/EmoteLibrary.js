const EXPRESSIONS = {
  neutral: {},
  happy: { headTilt: -0.03 },
  sad: { headTilt: 0.06, spineTilt: 0.03 },
  angry: { headTilt: 0.02 },
  surprised: { headTilt: -0.05 },
  think: { headTilt: -0.04, headRoll: 0.06 },
};

export const EMOTE_CATEGORIES = {
  gestures: {
    label: 'Gestos',
    items: [
      { key: 'wave', label: 'Acenar', icon: 'hand', clip: 'Greeting' },
      { key: 'present', label: 'Apresentar', icon: 'mic', clip: 'Talking_2' },
      { key: 'pointUp', label: 'Apontar', icon: 'arrowUp', clip: 'Talking_0' },
      { key: 'openArms', label: 'Abrir Bracos', icon: 'expand', clip: 'Talking_1' },
      { key: 'nod', label: 'Concordar', icon: 'thumbsUp', clip: 'Talking_0' },
      { key: 'think', label: 'Pensar', icon: 'brain', clip: 'Talking_1' },
    ],
  },
  dance: {
    label: 'Danca',
    items: [
      { key: 'dance', label: 'Dançar', icon: 'music', clip: 'RumbaDancing' },
    ],
  },
  expressions: {
    label: 'Expressoes',
    items: [
      { key: 'happy', label: 'Feliz', icon: 'smile', clip: 'Laughing' },
      { key: 'sad', label: 'Triste', icon: 'frown', clip: 'Crying' },
      { key: 'surprised', label: 'Surpreso', icon: 'alert', clip: 'Terrified' },
      { key: 'angry', label: 'Bravo', icon: 'zap', clip: 'Angry' },
    ],
  },
};

export function getEmote(key) {
  for (const cat of Object.values(EMOTE_CATEGORIES)) {
    const found = cat.items.find(e => e.key === key);
    if (found) return found;
  }
  return null;
}

export function getExpression(name) {
  return EXPRESSIONS[name] || EXPRESSIONS.neutral;
}
