// WebGL shader backgrounds powered by Paper Shaders (https://github.com/paper-design/shaders, Apache-2.0).
// Progressive enhancement: if WebGL is unavailable or anything fails, the CSS backgrounds stay in place.
import {
  ShaderMount,
  defaultObjectSizing,
  ShaderFitOptions,
  meshGradientFragmentShader,
  grainGradientFragmentShader,
  GrainGradientShapes,
  pulsingBorderFragmentShader,
  PulsingBorderAspectRatios,
  getShaderColorFromString as color,
  getShaderNoiseTexture,
} from './vendor/paper-shaders/paper-shaders.min.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const smallScreen = window.matchMedia('(max-width: 720px)').matches;

// Render cheaper on phones; motion off entirely for people who ask for reduced motion.
const QUALITY = smallScreen ? { minPixelRatio: 1, maxPixelCount: 1280 * 720 } : { minPixelRatio: 2, maxPixelCount: undefined };
const speed = (s) => (reduceMotion ? 0 : s);

function sizing(overrides = {}) {
  const s = { ...defaultObjectSizing, ...overrides };
  return {
    u_fit: ShaderFitOptions[s.fit],
    u_scale: s.scale,
    u_rotation: s.rotation,
    u_originX: s.originX,
    u_originY: s.originY,
    u_offsetX: s.offsetX,
    u_offsetY: s.offsetY,
    u_worldWidth: s.worldWidth,
    u_worldHeight: s.worldHeight,
  };
}

function mount(el, shader, uniforms, s, frame = 0) {
  return new ShaderMount(el, shader, uniforms, undefined, speed(s), frame, QUALITY.minPixelRatio, QUALITY.maxPixelCount);
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

// Hero: a slow, flowing ember-and-violet mesh gradient behind the headline.
function heroShader() {
  const el = document.querySelector('.hero-shader');
  if (!el) return;
  const colors = ['#ff8a3d', '#5b21b6', '#0c0a10', '#f472b6', '#1d1925', '#a78bfa'];
  mount(el, meshGradientFragmentShader, {
    u_colors: colors.map(color),
    u_colorsCount: colors.length,
    u_distortion: 0.85,
    u_swirl: 0.45,
    u_grainMixer: 0.12,
    u_grainOverlay: 0.08,
    ...sizing({ fit: 'cover', rotation: 20 }),
  }, 0.25, 8000);
}

// Project cards: each card gets its own grainy animated gradient, sped up on hover.
function cardShaders(noise) {
  const looks = {
    v1: { shape: 'ripple', colors: ['#ff8a3d', '#9a3412', '#facc15'] },
    v2: { shape: 'corners', colors: ['#a78bfa', '#5b21b6', '#38bdf8'] },
    v3: { shape: 'wave', colors: ['#facc15', '#ff8a3d', '#5b21b6'] },
    v4: { shape: 'sphere', colors: ['#f472b6', '#9d174d', '#a78bfa'] },
  };
  document.querySelectorAll('.project-visual').forEach((el) => {
    const key = Object.keys(looks).find((k) => el.classList.contains(k));
    const look = looks[key] ?? looks.v1;
    const m = mount(el, grainGradientFragmentShader, {
      u_colorBack: color('#15121b'),
      u_colors: look.colors.map(color),
      u_colorsCount: look.colors.length,
      u_softness: 0.7,
      u_intensity: 0.25,
      u_noise: 0.3,
      u_shape: GrainGradientShapes[look.shape],
      u_noiseTexture: noise,
      ...sizing({ fit: 'cover' }),
    }, 0.35, 4000);
    el.classList.add('shader-on');
    if (!reduceMotion) {
      const card = el.closest('.project');
      card?.addEventListener('pointerenter', () => m.setSpeed(1.2));
      card?.addEventListener('pointerleave', () => m.setSpeed(0.35));
    }
  });
}

// Contact: a glowing animated border around the call to action.
function contactShader(noise) {
  const el = document.querySelector('.contact-shader');
  if (!el) return;
  const colors = ['#ff8a3d', '#a78bfa', '#f472b6'];
  mount(el, pulsingBorderFragmentShader, {
    u_colorBack: color('#00000000'),
    u_colors: colors.map(color),
    u_colorsCount: colors.length,
    u_roundness: 0.18,
    u_thickness: 0.035,
    u_softness: 0.85,
    u_marginLeft: 0,
    u_marginRight: 0,
    u_marginTop: 0,
    u_marginBottom: 0,
    u_aspectRatio: PulsingBorderAspectRatios.auto,
    u_intensity: 0.22,
    u_bloom: 0.35,
    u_spots: 3,
    u_spotSize: 0.45,
    u_pulse: 0.2,
    u_smoke: 0.35,
    u_smokeSize: 0.6,
    u_noiseTexture: noise,
    ...sizing({ fit: 'cover', scale: 1 }),
  }, 0.6, 2000);
}

// The noise texture is an image; it must finish loading before shaders that use it can start.
function loadNoise() {
  const img = getShaderNoiseTexture();
  if (img.complete && img.naturalWidth) return Promise.resolve(img);
  return new Promise((resolve, reject) => {
    img.addEventListener('load', () => resolve(img), { once: true });
    img.addEventListener('error', reject, { once: true });
  });
}

function attempt(name, fn) {
  try { fn(); return true; } catch (err) { console.warn(`Shader "${name}" disabled:`, err); return false; }
}

if (hasWebGL()) {
  if (attempt('hero', heroShader)) document.documentElement.classList.add('has-shader');
  loadNoise()
    .then((noise) => {
      attempt('cards', () => cardShaders(noise));
      attempt('contact', () => contactShader(noise));
    })
    .catch((err) => console.warn('Noise texture failed to load:', err));
}
