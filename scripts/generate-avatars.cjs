/**
 * Streamoji Avatar Generator
 * Downloads diverse avatars for the TCC presentation.
 * Run: node scripts/generate-avatars.cjs
 */
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
const env = {};
envText.split('\n').forEach(line => {
  const [k, v] = line.split('=');
  if (k && v) env[k.trim()] = v.trim();
});

const CLIENT_ID = env.STREAMOJI_CLIENT_ID;
const CLIENT_SECRET = env.STREAMOJI_CLIENT_SECRET;
const OUT_DIR = path.join(__dirname, '..', 'public', 'models');
const META_PATH = path.join(OUT_DIR, 'avatars.json');

async function getAuthToken(userId) {
  const res = await fetch(
    'https://us-central1-streamoji-265f4.cloudfunctions.net/getAuthToken',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Secret': CLIENT_SECRET,
        'Client-Id': CLIENT_ID,
      },
      body: JSON.stringify({
        userId: userId || 'avatar-realista-main',
        userName: 'Lucas',
        maxAvatarsCreations: 10,
      }),
    }
  );
  const data = await res.json();
  if (!data.authToken) throw new Error('Auth failed: ' + JSON.stringify(data));
  return data.authToken;
}

async function fetchAssets(token, type) {
  const params = new URLSearchParams({
    limit: '100', page: '1',
    filter: 'viewable-by-user-and-app',
    filterApplicationId: CLIENT_ID,
    type,
  });
  const res = await fetch(`https://glb.streamoji.com/api/assets?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  return json.data || [];
}

async function getSavedAvatars(token) {
  const res = await fetch(
    'https://us-central1-streamoji-265f4.cloudfunctions.net/getSavedAvatarsForUser',
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );
  const json = await res.json();
  return json.data?.avatarIds || [];
}

async function saveAvatar(token, avatarConfig) {
  const res = await fetch(
    'https://us-central1-streamoji-265f4.cloudfunctions.net/saveAvatarConfig',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        Origin: 'https://avatars.streamoji.com',
        Referer: 'https://avatars.streamoji.com/',
      },
      body: JSON.stringify({ data: { avatarConfig } }),
    }
  );
  const result = await res.json();
  if (result.data?.avatarId) return result.data.avatarId;
  throw new Error('Save failed: ' + JSON.stringify(result));
}

async function downloadAvatar(avatarId, outPath) {
  const res = await fetch(`https://glb.streamoji.com/api/process?avatarId=${avatarId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Download ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(outPath, buf);
  return buf.length;
}

function pick(arr, idx) { return arr[idx % arr.length]; }

async function main() {
  console.log('=== Streamoji Avatar Generator ===\n');
  const token = await getAuthToken();
  console.log('Auth OK');

  // Check what already exists
  const existing = await getSavedAvatars(token);
  console.log(`Already saved: ${existing.length} avatar(s)`);

  // Fetch required asset types
  const REQUIRED_TYPES = ['faceShape', 'eyeShape', 'noseShape', 'lipShape', 'hairStyle'];
  const OPTIONAL_TYPES = ['eyeColor', 'top', 'bottom', 'footwear', 'glasses', 'headwear', 'shirt'];
  const assets = {};
  for (const type of [...REQUIRED_TYPES, ...OPTIONAL_TYPES]) {
    assets[type] = await fetchAssets(token, type);
    console.log(`  ${type}: ${assets[type].length}`);
  }

  // 10 avatar definitions (diverse mix)
  const avatarDefs = [
    { name: 'Lucas',     gender: 'male',   face: 0, eye: 0, nose: 0, lip: 0, hair: 0 },
    { name: 'Ana',       gender: 'female', face: 1, eye: 1, nose: 1, lip: 1, hair: 1 },
    { name: 'Christian', gender: 'male',   face: 2, eye: 2, nose: 2, lip: 2, hair: 2 },
    { name: 'Maria',     gender: 'female', face: 3, eye: 3, nose: 3, lip: 3, hair: 3 },
    { name: 'Pedro',     gender: 'male',   face: 4, eye: 4, nose: 4, lip: 4, hair: 4 },
    { name: 'Julia',     gender: 'female', face: 5, eye: 0, nose: 2, lip: 0, hair: 0 },
    { name: 'Rafael',    gender: 'male',   face: 6, eye: 1, nose: 3, lip: 1, hair: 1 },
    { name: 'Camila',    gender: 'female', face: 7, eye: 2, nose: 4, lip: 2, hair: 2 },
    { name: 'Carlos',    gender: 'male',   face: 8, eye: 3, nose: 0, lip: 3, hair: 3 },
    { name: 'Beatriz',   gender: 'female', face: 9, eye: 4, nose: 1, lip: 4, hair: 4 },
  ];

  const metadata = [];

  // Download existing avatars first (if any we already have)
  for (const id of existing) {
    const idx = metadata.length;
    const filename = `avatar_${idx}.glb`;
    const outPath = path.join(OUT_DIR, filename);
    if (!fs.existsSync(outPath)) {
      try {
        console.log(`Downloading existing ${id}...`);
        const size = await downloadAvatar(id, outPath);
        console.log(`  -> ${filename} (${(size/1024/1024).toFixed(2)} MB)`);
      } catch (e) {
        console.error(`  Failed: ${e.message}`);
        continue;
      }
    } else {
      console.log(`${filename} already exists, skipping download`);
    }
    metadata.push({ id, filename, name: `Existente ${idx + 1}`, gender: 'unknown' });
  }

  // Create new avatars up to 10 total
  const toCreate = 10 - existing.length;
  for (let i = 0; i < Math.min(toCreate, avatarDefs.length); i++) {
    const def = avatarDefs[i + existing.length] || avatarDefs[i];
    const idx = metadata.length;
    const filename = `avatar_${idx}.glb`;
    const outPath = path.join(OUT_DIR, filename);

    console.log(`\nCreating ${idx + 1}/10: ${def.name} (${def.gender})`);

    const config = {
      gender: def.gender,
      faceShape: pick(assets.faceShape, def.face).id,
      eyeShape: pick(assets.eyeShape, def.eye).id,
      noseShape: pick(assets.noseShape, def.nose).id,
      lipShape: pick(assets.lipShape, def.lip).id,
      hairStyle: pick(assets.hairStyle, def.hair).id,
    };

    // Add optional assets with some variety
    if (assets.eyeColor.length) config.eyeColor = pick(assets.eyeColor, i).id;
    if (assets.top.length) config.top = pick(assets.top, i * 3).id;
    if (assets.bottom.length) config.bottom = pick(assets.bottom, i * 2).id;
    if (assets.footwear.length) config.footwear = pick(assets.footwear, i * 2).id;

    try {
      const avatarId = await saveAvatar(token, config);
      console.log(`  Saved: ${avatarId}`);
      const size = await downloadAvatar(avatarId, outPath);
      console.log(`  -> ${filename} (${(size/1024/1024).toFixed(2)} MB)`);
      metadata.push({ id: avatarId, filename, name: def.name, gender: def.gender });
    } catch (e) {
      console.error(`  FAILED: ${e.message}`);
    }
  }

  // Save metadata
  fs.writeFileSync(META_PATH, JSON.stringify(metadata, null, 2));
  console.log(`\n=== Done! ${metadata.length} avatars. Metadata: public/models/avatars.json ===`);
}

main().catch(e => console.error('FATAL:', e));
