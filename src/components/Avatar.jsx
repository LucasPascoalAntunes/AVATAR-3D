import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import useStore from '../store.js';
import { AVATAR_CATALOG } from '../data/avatarCatalog.js';

const EMOTE_ANIM = {
  wave: 'Greeting',
  present: 'Talking_2',
  pointUp: 'Talking_0',
  openArms: 'Talking_1',
  nod: 'Talking_0',
  think: 'Talking_1',
  happy: 'Laughing',
  sad: 'Crying',
  surprised: 'Terrified',
  angry: 'Angry',
  dance: 'RumbaDancing',
};

const HIPS_POS = new THREE.Vector3(0, 1.01, 0.01);
const CORR_Q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

const VISEME_TO_ARKIT = {
  viseme_sil: {},
  viseme_aa: { jawOpen: 0.7, mouthSmileLeft: 0.1, mouthSmileRight: 0.1 },
  viseme_E:  { jawOpen: 0.3, mouthSmileLeft: 0.35, mouthSmileRight: 0.35 },
  viseme_I:  { jawOpen: 0.15, mouthSmileLeft: 0.5, mouthSmileRight: 0.5 },
  viseme_O:  { jawOpen: 0.5, mouthFunnel: 0.7 },
  viseme_U:  { jawOpen: 0.2, mouthFunnel: 0.5, mouthPucker: 0.4 },
  viseme_PP: { mouthClose: 0.8, mouthPucker: 0.3 },
  viseme_FF: { jawOpen: 0.1, mouthUpperUpLeft: 0.3, mouthUpperUpRight: 0.3 },
  viseme_TH: { jawOpen: 0.15, tongueOut: 0.3 },
  viseme_DD: { jawOpen: 0.25 },
  viseme_kk: { jawOpen: 0.2 },
  viseme_CH: { jawOpen: 0.15, mouthFunnel: 0.3, mouthPucker: 0.2 },
  viseme_SS: { jawOpen: 0.1, mouthSmileLeft: 0.2, mouthSmileRight: 0.2 },
  viseme_nn: { jawOpen: 0.15, mouthSmileLeft: 0.1, mouthSmileRight: 0.1 },
  viseme_RR: { jawOpen: 0.25 },
};
const ARKIT_MOUTH_KEYS = [...new Set(Object.values(VISEME_TO_ARKIT).flatMap(v => Object.keys(v)))];

const EXPRESSION_TO_ARKIT = {
  neutral: {},
  happy: { mouthSmileLeft: 0.7, mouthSmileRight: 0.7, cheekSquintLeft: 0.4, cheekSquintRight: 0.4 },
  sad: { mouthFrownLeft: 0.6, mouthFrownRight: 0.6, browInnerUp: 0.5 },
  angry: { browDownLeft: 0.7, browDownRight: 0.7, mouthFrownLeft: 0.4, mouthFrownRight: 0.4, jawForward: 0.3 },
  surprised: { eyeWideLeft: 0.8, eyeWideRight: 0.8, browOuterUpLeft: 0.6, browOuterUpRight: 0.6, jawOpen: 0.4 },
  think: { browInnerUp: 0.4, eyeSquintLeft: 0.5, mouthPucker: 0.3 },
};
const ARKIT_EXPR_KEYS = [...new Set(Object.values(EXPRESSION_TO_ARKIT).flatMap(v => Object.keys(v)))];

const COLOR_MESH_MAP = {
  skinColor:    ['Streamoji_Head', 'Streamoji_Body'],
  eyeColor:     ['EyeLeft', 'EyeRight'],
  hairColor:    ['Streamoji_Hair'],
  topColor:     ['Streamoji_Outfit_Top'],
  bottomColor:  ['Streamoji_Outfit_Bottom'],
  shoeColor:    ['Streamoji_Outfit_Footwear'],
};

export default function Avatar({ avatarId = 0, position = [0, 0, 0] }) {
  const group = useRef();
  const selectedIdx = useStore(s => s.selectedAvatars[avatarId]);
  const entry = AVATAR_CATALOG[selectedIdx] || AVATAR_CATALOG[0];
  const modelUrl = `/models/${entry.filename}`;
  const { scene: originalScene } = useGLTF(modelUrl);
  const avatarPropsForMe = useStore(s => s.avatarProps[avatarId]);

  const avatarScene = useMemo(() => {
    return SkeletonUtils.clone(originalScene);
  }, [originalScene]);

  useEffect(() => {
    if (!avatarPropsForMe) return;
    avatarScene.traverse(obj => {
      if (!obj.isMesh || !obj.material) return;
      for (const [propKey, meshNames] of Object.entries(COLOR_MESH_MAP)) {
        if (meshNames.includes(obj.name) && avatarPropsForMe[propKey]) {
          if (!obj.userData._clonedMat) {
            obj.material = obj.material.clone();
            obj.userData._clonedMat = true;
          }
          obj.material.color.set(avatarPropsForMe[propKey]);
        }
      }
    });
  }, [avatarScene, avatarPropsForMe]);

  const { animations: idleAnim } = useFBX('/animations/Idle.fbx');
  const { animations: greetAnim } = useFBX('/animations/StandingGreeting.fbx');
  const { animations: angryAnim } = useFBX('/animations/AngryGesture.fbx');
  const { animations: cryingAnim } = useFBX('/animations/Crying.fbx');
  const { animations: laughAnim } = useFBX('/animations/Laughing.fbx');
  const { animations: rumbaAnim } = useFBX('/animations/RumbaDancing.fbx');
  const { animations: talk0Anim } = useFBX('/animations/Talking_0.fbx');
  const { animations: talk1Anim } = useFBX('/animations/Talking_1.fbx');
  const { animations: talk2Anim } = useFBX('/animations/Talking_2.fbx');
  const { animations: terrAnim } = useFBX('/animations/Terrified.fbx');

  const clips = useMemo(() => {
    const all = [
      { anim: idleAnim[0], name: 'Idle' },
      { anim: greetAnim[0], name: 'Greeting' },
      { anim: angryAnim[0], name: 'Angry' },
      { anim: cryingAnim[0], name: 'Crying' },
      { anim: laughAnim[0], name: 'Laughing' },
      { anim: rumbaAnim[0], name: 'RumbaDancing' },
      { anim: talk0Anim[0], name: 'Talking_0' },
      { anim: talk1Anim[0], name: 'Talking_1' },
      { anim: talk2Anim[0], name: 'Talking_2' },
      { anim: terrAnim[0], name: 'Terrified' },
    ];

    return all.map(({ anim, name }) => {
      const clip = anim.clone();
      clip.name = name;

      clip.tracks.forEach(track => {
        track.name = track.name.replace(/mixamorig:/g, '');
      });

      const hipsQTrack = clip.tracks.find(t => t.name === 'Hips.quaternion');
      const isZUp = hipsQTrack && hipsQTrack.values[0] > 0.5;

      if (isZUp && hipsQTrack) {
        const v = hipsQTrack.values;
        const tmpQ = new THREE.Quaternion();
        for (let i = 0; i < v.length; i += 4) {
          tmpQ.set(v[i], v[i + 1], v[i + 2], v[i + 3]);
          tmpQ.premultiply(CORR_Q);
          v[i] = tmpQ.x;
          v[i + 1] = tmpQ.y;
          v[i + 2] = tmpQ.z;
          v[i + 3] = tmpQ.w;
        }
      }

      clip.tracks = clip.tracks.filter(track => {
        if (track.name === 'Hips.position') return false;
        if (track.name === 'Armature.quaternion') return false;
        if (track.name === 'Armature.position') return false;
        if (track.name === 'Armature.scale') return false;
        return true;
      });

      return clip;
    });
  }, [idleAnim, greetAnim, angryAnim, cryingAnim, laughAnim, rumbaAnim, talk0Anim, talk1Anim, talk2Anim, terrAnim]);

  const { actions } = useAnimations(clips, group);

  const morphMeshesRef = useRef([]);
  const currentAnimRef = useRef('Idle');
  const timeoutRef = useRef(null);
  const bonesRef = useRef({});
  const clockRef = useRef(0);
  const isArkitRef = useRef(false);

  const currentEmote = useStore(s => s.currentEmote);
  const emoteVersion = useStore(s => s.emoteVersion);

  useEffect(() => {
    const morphMeshes = [];
    const bones = {};
    const boneNames = new Set();
    avatarScene.traverse(obj => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
      if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
        morphMeshes.push(obj);
      }
      if (obj.isBone) {
        bones[obj.name] = obj;
        boneNames.add(obj.name);
      }
    });
    morphMeshesRef.current = morphMeshes;
    bonesRef.current = bones;
    isArkitRef.current = morphMeshes.some(m => 'jawOpen' in (m.morphTargetDictionary || {}));

    if (boneNames.size > 0) {
      Object.values(actions).forEach(action => {
        const clip = action.getClip();
        clip.tracks = clip.tracks.filter(track => {
          const boneName = track.name.split('.')[0];
          return boneNames.has(boneName);
        });
      });
    }

    const armature = avatarScene.getObjectByName('Armature');
    if (armature) armature.quaternion.identity();

    if (actions['Idle']) actions['Idle'].reset().fadeIn(0.3).play();
  }, [avatarScene, actions]);

  useEffect(() => {
    if (useStore.getState().emoteTarget !== avatarId) return;
    if (!currentEmote || emoteVersion === 0) return;
    const animName = EMOTE_ANIM[currentEmote];
    if (!animName || !actions[animName]) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const current = currentAnimRef.current;
    if (current && actions[current]) actions[current].fadeOut(0.4);

    const next = actions[animName];
    next.reset().fadeIn(0.4).play();

    if (currentEmote === 'dance') {
      next.setLoop(THREE.LoopRepeat, Infinity);
    } else {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    }
    currentAnimRef.current = animName;

    const dur = currentEmote === 'dance' ? 6000 : next.getClip().duration * 1000;
    timeoutRef.current = setTimeout(() => {
      next.fadeOut(0.4);
      if (actions['Idle']) {
        actions['Idle'].reset().fadeIn(0.4).play();
        currentAnimRef.current = 'Idle';
      }
    }, dur);
  }, [currentEmote, emoteVersion, actions, avatarId]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const lerp = 1 - Math.pow(0.001, d);
    clockRef.current += d;
    const t = clockRef.current;

    const { isSpeaking, activePresenter, currentViseme, currentExpression, expressionIntensity } = useStore.getState();
    const isThisSpeaking = isSpeaking && activePresenter === avatarId;

    const armature = avatarScene.getObjectByName('Armature');
    if (armature) armature.quaternion.identity();

    const hips = bonesRef.current['Hips'];
    if (hips) hips.position.copy(HIPS_POS);

    {
      const _q = new THREE.Quaternion();
      const _e = new THREE.Euler();

      const rArm = bonesRef.current['RightArm'];
      if (rArm) {
        _e.set(0.05, 0, -0.25);
        _q.setFromEuler(_e);
        rArm.quaternion.multiply(_q);
      }

      const lArm = bonesRef.current['LeftArm'];
      if (lArm) {
        _e.set(0.05, 0, 0.25);
        _q.setFromEuler(_e);
        lArm.quaternion.multiply(_q);
      }

      const rForeIdle = bonesRef.current['RightForeArm'];
      if (rForeIdle) {
        _e.set(0, -0.05, -0.08);
        _q.setFromEuler(_e);
        rForeIdle.quaternion.multiply(_q);
      }

      const lForeIdle = bonesRef.current['LeftForeArm'];
      if (lForeIdle) {
        _e.set(0, 0.05, 0.08);
        _q.setFromEuler(_e);
        lForeIdle.quaternion.multiply(_q);
      }

      if (isThisSpeaking) {
        if (rArm) {
          _e.set(Math.sin(t * 0.8) * 0.04, 0, Math.sin(t * 0.5) * -0.03);
          _q.setFromEuler(_e);
          rArm.quaternion.multiply(_q);
        }
        if (lArm) {
          _e.set(Math.sin(t * 0.7 + 1) * 0.04, 0, Math.sin(t * 0.4 + 0.5) * 0.03);
          _q.setFromEuler(_e);
          lArm.quaternion.multiply(_q);
        }

        const rFore = bonesRef.current['RightForeArm'];
        if (rFore) {
          _e.set(Math.sin(t * 1.2) * 0.06, Math.sin(t * 0.9) * 0.03, 0);
          _q.setFromEuler(_e);
          rFore.quaternion.multiply(_q);
        }

        const lFore = bonesRef.current['LeftForeArm'];
        if (lFore) {
          _e.set(Math.sin(t * 1.0 + 0.8) * 0.06, Math.sin(t * 0.7 + 1.2) * 0.03, 0);
          _q.setFromEuler(_e);
          lFore.quaternion.multiply(_q);
        }
      }
    }

    morphMeshesRef.current.forEach(mesh => {
      const dict = mesh.morphTargetDictionary;
      const inf = mesh.morphTargetInfluences;
      if (!dict || !inf) return;

      if (isArkitRef.current) {
        const targets = isThisSpeaking ? (VISEME_TO_ARKIT[currentViseme] || {}) : {};
        ARKIT_MOUTH_KEYS.forEach(key => {
          const idx = dict[key];
          if (idx === undefined) return;
          const goal = targets[key] || 0;
          inf[idx] = THREE.MathUtils.lerp(inf[idx], goal, lerp);
        });

        const exprTargets = EXPRESSION_TO_ARKIT[currentExpression] || {};
        ARKIT_EXPR_KEYS.forEach(key => {
          if (ARKIT_MOUTH_KEYS.includes(key) && isThisSpeaking) return;
          const idx = dict[key];
          if (idx === undefined) return;
          const goal = (exprTargets[key] || 0) * expressionIntensity;
          inf[idx] = THREE.MathUtils.lerp(inf[idx], goal, lerp);
        });
      } else {
        Object.keys(dict).forEach(key => {
          if (!key.startsWith('viseme_')) return;
          const idx = dict[key];
          const target = (isThisSpeaking && currentViseme === key) ? 1 : 0;
          inf[idx] = THREE.MathUtils.lerp(inf[idx], target, lerp);
        });
      }
    });
  }, 1);

  return (
    <group ref={group} dispose={null} position={position}>
      <primitive object={avatarScene} />
    </group>
  );
}

useGLTF.preload('/models/avatar_1.glb');
useGLTF.preload('/models/avatar_2.glb');
