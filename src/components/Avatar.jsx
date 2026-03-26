import React, { useEffect, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useFBX, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store.js';

const MODEL_URL = '/models/646d9dcdc8a5f5bddbfac913.glb';

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
const IDENTITY_Q = new THREE.Quaternion();

export default function Avatar() {
  const group = useRef();
  const { scene } = useGLTF(MODEL_URL);

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

  const isSpeaking = useStore(s => s.isSpeaking);
  const currentViseme = useStore(s => s.currentViseme);
  const currentEmote = useStore(s => s.currentEmote);
  const emoteVersion = useStore(s => s.emoteVersion);

  useEffect(() => {
    const morphMeshes = [];
    const bones = {};
    scene.traverse(obj => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.frustumCulled = false;
      }
      if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
        morphMeshes.push(obj);
      }
      if (obj.isBone) bones[obj.name] = obj;
    });
    morphMeshesRef.current = morphMeshes;
    bonesRef.current = bones;

    const armature = scene.getObjectByName('Armature');
    if (armature) armature.quaternion.identity();

    if (actions['Idle']) actions['Idle'].reset().fadeIn(0.3).play();
  }, [scene, actions]);

  useEffect(() => {
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
  }, [currentEmote, emoteVersion, actions]);

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    const lerp = 1 - Math.pow(0.001, d);
    clockRef.current += d;
    const t = clockRef.current;

    const armature = scene.getObjectByName('Armature');
    if (armature) armature.quaternion.identity();

    const hips = bonesRef.current['Hips'];
    if (hips) hips.position.copy(HIPS_POS);

    if (isSpeaking) {
      const _q = new THREE.Quaternion();
      const _e = new THREE.Euler();

      const rArm = bonesRef.current['RightUpperArm'];
      if (rArm) {
        _e.set(Math.sin(t * 0.8) * 0.04, 0, -0.03 + Math.sin(t * 0.5) * -0.03);
        _q.setFromEuler(_e);
        rArm.quaternion.multiply(_q);
      }

      const lArm = bonesRef.current['LeftUpperArm'];
      if (lArm) {
        _e.set(Math.sin(t * 0.7 + 1) * 0.04, 0, 0.03 + Math.sin(t * 0.4 + 0.5) * 0.03);
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

    morphMeshesRef.current.forEach(mesh => {
      const dict = mesh.morphTargetDictionary;
      const inf = mesh.morphTargetInfluences;
      if (!dict || !inf) return;
      Object.keys(dict).forEach(key => {
        if (!key.startsWith('viseme_')) return;
        const idx = dict[key];
        const target = (isSpeaking && currentViseme === key) ? 1 : 0;
        inf[idx] = THREE.MathUtils.lerp(inf[idx], target, lerp);
      });
    });
  }, 1);

  return (
    <group ref={group} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL_URL);
