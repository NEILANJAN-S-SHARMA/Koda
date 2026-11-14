import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

type CameraPreset = 'orbit' | 'master' | 'reels' | 'top';

const PRESET_LABELS: { id: CameraPreset; label: string }[] = [
  { id: 'orbit', label: '3D Orbit' },
  { id: 'master', label: '16:9 Master' },
  { id: 'reels', label: '9:16 Reels' },
  { id: 'top', label: 'Saliency Rings' },
];

// Pre-allocated math helpers (zero per-frame GC allocations)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _camTarget = new THREE.Vector3();
const _lookTarget = new THREE.Vector3(0, 0.15, 0);

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createMasterScreenTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Deep forest-sage studio backdrop
    const grad = ctx.createLinearGradient(0, 0, 1024, 576);
    grad.addColorStop(0, '#192418');
    grad.addColorStop(0.55, '#2C3D2B');
    grad.addColorStop(1, '#3B5239');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 576);

    // Subtle rule-of-thirds NLE framing guides
    ctx.strokeStyle = 'rgba(229, 232, 206, 0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 42, 928, 404);
    ctx.beginPath();
    ctx.moveTo(357, 42);
    ctx.lineTo(357, 446);
    ctx.moveTo(667, 42);
    ctx.lineTo(667, 446);
    ctx.moveTo(48, 176);
    ctx.lineTo(976, 176);
    ctx.moveTo(48, 311);
    ctx.lineTo(976, 311);
    ctx.stroke();

    // Stylized tension curve inside monitor frame
    ctx.beginPath();
    ctx.moveTo(64, 340);
    for (let x = 64; x <= 960; x += 18) {
      const t = (x - 64) / 896;
      const y =
        280 -
        Math.sin(t * Math.PI * 3.5) * 65 -
        Math.exp(-Math.pow((t - 0.68) * 6, 2)) * 95;
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#D4DAB4';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Active timeline track strip along bottom
    ctx.fillStyle = '#141E13';
    ctx.fillRect(48, 468, 928, 66);
    const barColors = ['#789575', '#D4DAB4', '#557053', '#789575', '#C5D1B8'];
    let bx = 64;
    for (let i = 0; i < 18; i++) {
      const bw = 28 + ((i * 17) % 34);
      if (bx + bw > 960) break;
      ctx.fillStyle = barColors[i % barColors.length];
      ctx.fillRect(bx, 484, bw, 34);
      bx += bw + 10;
    }

    // Minimal frame label
    ctx.fillStyle = '#D4DAB4';
    ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText('16:9 MASTER CUT · TENSION PEAK 94%', 68, 86);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

function createVerticalReelTexture(
  label: string,
  score: string,
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 640);
    grad.addColorStop(0, '#2C3D2B');
    grad.addColorStop(0.55, '#3B5239');
    grad.addColorStop(1, '#192418');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 360, 640);

    // Safe-zone frame guide
    ctx.strokeStyle = 'rgba(229, 232, 206, 0.25)';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 44, 312, 552);

    // Botanical / geometric subject silhouette
    ctx.fillStyle = 'rgba(229, 232, 206, 0.14)';
    ctx.beginPath();
    ctx.arc(180, 260, 88, 0, Math.PI * 2);
    ctx.fill();

    // Kinetic caption safe-zone bars
    ctx.fillStyle = '#D4DAB4';
    ctx.fillRect(46, 446, 268, 28);
    ctx.fillStyle = '#789575';
    ctx.fillRect(68, 486, 224, 22);

    ctx.fillStyle = '#D4DAB4';
    ctx.font = '600 20px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.fillText(label, 40, 86);

    ctx.fillStyle = '#C5D1B8';
    ctx.font = '500 17px "JetBrains Mono", monospace';
    ctx.fillText(score, 40, 118);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;
  texture.needsUpdate = true;
  return texture;
}

export const StudioRig3D: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [preset, setPreset] = useState<CameraPreset>('orbit');
  const [exploded, setExploded] = useState<boolean>(false);
  const [contextLost, setContextLost] = useState<boolean>(false);

  const presetRef = useRef<CameraPreset>('orbit');
  const explodedRef = useRef<boolean>(false);
  const dragRotationRef = useRef<{ yaw: number; pitch: number }>({
    yaw: 0.35,
    pitch: 0.14,
  });
  const isDraggingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    const width = container.clientWidth || 720;
    const height = container.clientHeight || 460;

    renderer.setSize(width, height);
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvasEl = renderer.domElement;
    canvasEl.style.width = '100%';
    canvasEl.style.height = '100%';
    canvasEl.style.display = 'block';
    container.innerHTML = '';
    container.appendChild(canvasEl);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x192418);
    scene.fog = new THREE.FogExp2(0x192418, 0.042);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 1.35, 7.2);

    // Three-point warm/cool studio lighting
    const keyLight = new THREE.DirectionalLight(0xf6f7e6, 2.2);
    keyLight.position.set(5, 7, 6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0xc5d1b8, 0x141e13, 1.15);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x9bb498, 1.4);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);

    // Grounded contact shadow disc
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 256;
    shadowCanvas.height = 256;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const sGrad = sCtx.createRadialGradient(128, 128, 14, 128, 128, 124);
      sGrad.addColorStop(0, 'rgba(10, 16, 10, 0.65)');
      sGrad.addColorStop(1, 'rgba(10, 16, 10, 0)');
      sCtx.fillStyle = sGrad;
      sCtx.fillRect(0, 0, 256, 256);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowGeo = new THREE.PlaneGeometry(7.5, 7.5);
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.75;
    scene.add(shadowPlane);

    // Materials (varied roughness & metalness across sub-assemblies)
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const brushedChassisMat = new THREE.MeshPhysicalMaterial({
      color: 0x2c3d2b,
      metalness: 0.88,
      roughness: 0.24,
      anisotropy: 0.7,
    });
    const sageBezelMat = new THREE.MeshStandardMaterial({
      color: 0x789575,
      metalness: 0.55,
      roughness: 0.48,
    });
    const ivoryAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe5e8ce,
      metalness: 0.15,
      roughness: 0.35,
    });
    const darkAnodizedMat = new THREE.MeshStandardMaterial({
      color: 0x141e13,
      metalness: 0.9,
      roughness: 0.2,
    });

    const masterTex = createMasterScreenTexture(maxAniso);
    const masterScreenMat = new THREE.MeshStandardMaterial({
      map: masterTex,
      roughness: 0.22,
      metalness: 0.08,
      emissive: new THREE.Color(0x2c3d2b),
      emissiveMap: masterTex,
      emissiveIntensity: 0.32,
    });

    const reelTextures = [
      createVerticalReelTexture('REEL 01 · HOOK', 'TENSION 96%', maxAniso),
      createVerticalReelTexture('REEL 02 · CLUTCH', 'TENSION 92%', maxAniso),
      createVerticalReelTexture('REEL 03 · RECAP', 'TENSION 89%', maxAniso),
    ];
    const reelScreenMats = reelTextures.map(
      (tex) =>
        new THREE.MeshStandardMaterial({
          map: tex,
          roughness: 0.2,
          metalness: 0.1,
          emissive: new THREE.Color(0x2c3d2b),
          emissiveMap: tex,
          emissiveIntensity: 0.3,
        })
    );

    // Composite Studio Rig Group
    const rigGroup = new THREE.Group();
    scene.add(rigGroup);

    // 1. Pedestal base assembly (grounded on shadow plane)
    const pedestalGroup = new THREE.Group();
    const basePlinthGeo = new THREE.CylinderGeometry(1.45, 1.65, 0.16, 48);
    const basePlinth = new THREE.Mesh(basePlinthGeo, darkAnodizedMat);
    basePlinth.position.y = -1.67;
    basePlinth.receiveShadow = true;

    const collarGeo = new THREE.CylinderGeometry(0.95, 1.15, 0.12, 48);
    const collar = new THREE.Mesh(collarGeo, sageBezelMat);
    collar.position.y = -1.53;

    const spineGeo = new THREE.CylinderGeometry(0.08, 0.11, 1.35, 24);
    const spine = new THREE.Mesh(spineGeo, brushedChassisMat);
    spine.position.y = -0.82;
    pedestalGroup.add(basePlinth, collar, spine);
    rigGroup.add(pedestalGroup);

    // 2. Central 16:9 Master Frame Assembly
    const masterGroup = new THREE.Group();
    masterGroup.position.set(0, 0.25, 0);

    const frameOuterGeo = new THREE.BoxGeometry(3.36, 1.98, 0.12);
    const frameOuter = new THREE.Mesh(frameOuterGeo, brushedChassisMat);
    frameOuter.castShadow = !isSoftwareGl;

    const trimBezelGeo = new THREE.BoxGeometry(3.2, 1.82, 0.14);
    const trimBezel = new THREE.Mesh(trimBezelGeo, sageBezelMat);

    const screenGeo = new THREE.PlaneGeometry(3.04, 1.71);
    const screenFront = new THREE.Mesh(screenGeo, masterScreenMat);
    screenFront.position.z = 0.075;

    const screenBack = new THREE.Mesh(screenGeo, ivoryAccentMat);
    screenBack.rotation.y = Math.PI;
    screenBack.position.z = -0.075;

    masterGroup.add(frameOuter, trimBezel, screenFront, screenBack);
    rigGroup.add(masterGroup);

    // 3. Three Orbiting 9:16 Vertical Reel Frames
    const reelsCluster = new THREE.Group();
    const reelGeoChassis = new THREE.BoxGeometry(0.84, 1.46, 0.08);
    const reelGeoScreen = new THREE.PlaneGeometry(0.74, 1.32);
    const reelNodes: { group: THREE.Group; baseAngle: number }[] = [];

    for (let i = 0; i < 3; i++) {
      const reelWrap = new THREE.Group();
      const chassis = new THREE.Mesh(reelGeoChassis, brushedChassisMat);
      const faceFront = new THREE.Mesh(reelGeoScreen, reelScreenMats[i]);
      faceFront.position.z = 0.044;
      const faceBack = new THREE.Mesh(reelGeoScreen, sageBezelMat);
      faceBack.rotation.y = Math.PI;
      faceBack.position.z = -0.044;
      reelWrap.add(chassis, faceFront, faceBack);

      const angle = (i / 3) * Math.PI * 2 + 0.45;
      reelNodes.push({ group: reelWrap, baseAngle: angle });
      reelsCluster.add(reelWrap);
    }
    rigGroup.add(reelsCluster);

    // 4. Dual Saliency Gimbal Rings
    const outerRingGeo = new THREE.TorusGeometry(2.35, 0.025, 16, 96);
    const outerRing = new THREE.Mesh(outerRingGeo, sageBezelMat);
    outerRing.rotation.x = Math.PI * 0.42;

    const innerRingGeo = new THREE.TorusGeometry(1.92, 0.02, 16, 84);
    const innerRing = new THREE.Mesh(innerRingGeo, ivoryAccentMat);
    innerRing.rotation.x = -Math.PI * 0.36;
    innerRing.rotation.y = 0.45;
    rigGroup.add(outerRing, innerRing);

    // 5. Instanced 3D Audio Waveform Ring (36 bars)
    const waveCount = 36;
    const waveBarGeo = new THREE.BoxGeometry(0.055, 1, 0.055);
    const waveBarMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.45,
    });
    const waveMesh = new THREE.InstancedMesh(waveBarGeo, waveBarMat, waveCount);
    waveMesh.frustumCulled = false;
    for (let i = 0; i < waveCount; i++) {
      _color.set(i % 3 === 0 ? 0xe5e8ce : 0x789575);
      waveMesh.setColorAt(i, _color);
    }
    if (waveMesh.instanceColor) waveMesh.instanceColor.needsUpdate = true;
    rigGroup.add(waveMesh);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Smooth ResizeObserver for exact aspect match
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 720;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let frameId = 0;
    let disposed = false;
    let explodeProgress = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync?.(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      if (!sync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      gl.flush();
      const poll = () => {
        if (disposed) {
          gl.deleteSync(sync);
          return;
        }
        const state = gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      if (disposed) return;
      const rawDelta = clock.getDelta();
      const delta = Math.min(rawDelta, 0.08);
      const elapsed = prefersReducedMotion ? 0 : clock.getElapsedTime();

      // Damped exploded separation
      const targetExplode = explodedRef.current ? 1 : 0;
      explodeProgress = THREE.MathUtils.damp(
        explodeProgress,
        targetExplode,
        6.5,
        delta
      );

      // Master 16:9 gentle hover & exploded lift
      masterGroup.position.y =
        0.25 + explodeProgress * 0.45 + Math.sin(elapsed * 1.1) * 0.04;
      masterGroup.rotation.y = Math.sin(elapsed * 0.45) * 0.08;

      // Orbiting 9:16 vertical reels
      const radius = 2.45 + explodeProgress * 0.72;
      for (let i = 0; i < reelNodes.length; i++) {
        const node = reelNodes[i];
        const theta = node.baseAngle + elapsed * 0.24;
        node.group.position.set(
          Math.cos(theta) * radius,
          0.15 + Math.sin(elapsed * 1.4 + i * 2.1) * 0.14 - explodeProgress * 0.15,
          Math.sin(theta) * radius * 0.75
        );
        node.group.lookAt(0, node.group.position.y, 0);
        node.group.rotateY(Math.PI);
      }

      // Rotating gimbal rings
      outerRing.rotation.z = elapsed * 0.18;
      outerRing.scale.setScalar(1 + explodeProgress * 0.18);
      innerRing.rotation.z = -elapsed * 0.26;
      innerRing.scale.setScalar(1 + explodeProgress * 0.12);

      // Instanced 3D audio waveform ring
      const waveRadius = 1.48 + explodeProgress * 0.2;
      for (let i = 0; i < waveCount; i++) {
        const angle = (i / waveCount) * Math.PI * 2;
        const amp =
          0.22 +
          0.26 * Math.abs(Math.sin(elapsed * 2.6 + i * 0.55)) +
          0.12 * Math.cos(elapsed * 4.1 - i * 0.3);
        _dummy.position.set(
          Math.cos(angle) * waveRadius,
          -1.25 + amp * 0.5,
          Math.sin(angle) * waveRadius
        );
        _dummy.rotation.set(0, -angle, 0);
        _dummy.scale.set(1, amp, 1);
        _dummy.updateMatrix();
        waveMesh.setMatrixAt(i, _dummy.matrix);
      }
      waveMesh.instanceMatrix.needsUpdate = true;

      // Smooth camera target by selected preset + user drag rotation
      const activePreset = presetRef.current;
      const yaw = dragRotationRef.current.yaw;
      const pitch = dragRotationRef.current.pitch;
      const mobileZoomOut = camera.aspect < 1.05 ? 1.38 : 1.0;

      if (activePreset === 'master') {
        _camTarget.set(
          Math.sin(yaw * 0.35) * 1.1,
          0.55 + pitch * 0.4,
          5.2 * mobileZoomOut
        );
        _lookTarget.set(0, 0.3, 0);
      } else if (activePreset === 'reels') {
        _camTarget.set(
          3.4 * mobileZoomOut * Math.sin(yaw + 0.6),
          0.75 + pitch,
          5.4 * mobileZoomOut * Math.cos(yaw + 0.6)
        );
        _lookTarget.set(0, 0.1, 0);
      } else if (activePreset === 'top') {
        _camTarget.set(
          Math.sin(yaw) * 1.4,
          5.6 * mobileZoomOut,
          3.6 * mobileZoomOut
        );
        _lookTarget.set(0, 0, 0);
      } else {
        const autoYaw = isDraggingRef.current ? yaw : yaw + elapsed * 0.08;
        _camTarget.set(
          Math.sin(autoYaw) * 6.8 * mobileZoomOut,
          1.25 + pitch * 2.2,
          Math.cos(autoYaw) * 6.8 * mobileZoomOut
        );
        _lookTarget.set(0, 0.1, 0);
      }

      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        _camTarget.x,
        5,
        delta
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        _camTarget.y,
        5,
        delta
      );
      camera.position.z = THREE.MathUtils.damp(
        camera.position.z,
        _camTarget.z,
        5,
        delta
      );
      camera.lookAt(_lookTarget);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

      // Dispose geometries, materials, textures, and renderer cleanly
      [
        shadowGeo,
        basePlinthGeo,
        collarGeo,
        spineGeo,
        frameOuterGeo,
        trimBezelGeo,
        screenGeo,
        reelGeoChassis,
        reelGeoScreen,
        outerRingGeo,
        innerRingGeo,
        waveBarGeo,
      ].forEach((g) => g.dispose());

      [
        shadowMat,
        brushedChassisMat,
        sageBezelMat,
        ivoryAccentMat,
        darkAnodizedMat,
        masterScreenMat,
        waveBarMat,
        ...reelScreenMats,
      ].forEach((m) => m.dispose());

      [shadowTex, masterTex, ...reelTextures, envRT.texture].forEach((t) =>
        t.dispose()
      );
      renderer.dispose();
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    if (e.pointerType !== 'touch') {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    dragRotationRef.current.yaw -= dx * 0.008;
    if (e.pointerType !== 'touch') {
      dragRotationRef.current.pitch = THREE.MathUtils.clamp(
        dragRotationRef.current.pitch + dy * 0.005,
        -0.35,
        0.55
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    if (e.pointerType !== 'touch' && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] lg:h-[520px] rounded-lg border border-[#789575] bg-[#192418] overflow-hidden select-none">
      {/* Top-Left Minimal Spec Label */}
      <div className="pointer-events-none absolute top-3.5 left-4 right-4 z-10 flex items-center justify-between gap-2 text-[11px] sm:text-xs font-mono text-[#C5D1B8]">
        <span className="truncate">Interactive 3D Multi-Cut Rig</span>
        <span className="text-[#D4DAB4] shrink-0">Swipe to rotate</span>
      </div>

      {/* Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: 'pan-y' }}
        role="region"
        aria-label="Interactive 3D Koda post-production scene"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {contextLost && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#192418] text-[#D4DAB4] p-6 text-center">
          <p className="text-sm font-semibold">3D Studio Preview</p>
          <p className="text-xs text-[#C5D1B8] mt-1">
            WebGL context paused; hardware acceleration resumes automatically when available.
          </p>
        </div>
      )}

      {/* Unified Bottom Control Dock (Solid dark sage surface, zero backdrop-blur over WebGL) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[calc(100%-24px)] sm:w-auto max-w-[94%] bg-[#243323]/95 border border-[#789575]/75 rounded-lg px-2 py-1.5 sm:px-2.5 sm:py-2 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 shadow-lg">
        {PRESET_LABELS.map((item) => {
          const active = preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreset(item.id)}
              className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#D4DAB4] text-[#192418]'
                  : 'text-[#C7CFA3] hover:text-[#D4DAB4] hover:bg-[#3B5239]'
              }`}
            >
              {item.label}
            </button>
          );
        })}

        <span
          aria-hidden="true"
          className="h-4 w-px bg-[#789575]/50 mx-1 hidden sm:inline-block"
        />

        <button
          type="button"
          onClick={() => setExploded((prev) => !prev)}
          className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
            exploded
              ? 'bg-[#789575] text-[#192418] border-[#D4DAB4]/40'
              : 'bg-[#192418] text-[#D4DAB4] border-[#789575] hover:bg-[#2C3D2B]'
          }`}
        >
          {exploded ? 'Collapse Layers' : 'Explode Layers'}
        </button>
      </div>
    </div>
  );
};
