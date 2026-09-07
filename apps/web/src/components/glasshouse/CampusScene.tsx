'use client';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  GlasshouseAssetId as AssetId,
  GlasshouseSession as Session,
} from '@gsoc-decision-ops/core';
type Point = [number, number, number];
type Props = {
  selected: AssetId;
  onSelect: (asset: AssetId) => void;
  motion: boolean;
  onFallback: () => void;
  state?: Session;
};
type Projection = {
  guardAssigned: boolean;
  manualChecks: boolean;
  guardLabel: string;
  isolated: boolean;
  connectorPending: boolean;
  connectorLabel: string;
  dispatchPaused: boolean;
  dispatchPending: boolean;
  dispatchLabel: string;
};
const palette = {
  ground: '#30372f',
  paving: '#5d645a',
  road: '#414840',
  wall: '#cecaba',
  roof: '#888e7e',
  glass: '#526d65',
  frame: '#aeb9ab',
  amber: '#d7ad60',
  quiet: '#85907f',
  selected: '#efd096',
};
const time = (minute: number) =>
  `${String(Math.floor((370 + minute) / 60)).padStart(2, '0')}:${String((370 + minute) % 60).padStart(2, '0')}`;

/** This adapter reads only recorded actions/events and public commitments, never hidden world truth. */
function projectCommitments(state?: Session): Projection {
  if (!state)
    return {
      guardAssigned: false,
      manualChecks: false,
      guardLabel: 'No recorded guard assignment.',
      isolated: false,
      connectorPending: false,
      connectorLabel: 'Shared vendor identity dependency; integrity is not implied.',
      dispatchPaused: false,
      dispatchPending: false,
      dispatchLabel: 'Shipment route shown. No recorded hold.',
    };
  const completed = (id: string) =>
    state.events.some(
      (event) => event.type === 'action.completed' && event.payload.actionId === id
    );
  const pending = (control: string) =>
    state.actions.find(
      (action) =>
        action.control === control && ['requested', 'approved', 'started'].includes(action.status)
    );
  const live = (control: string) =>
    state.actions.find(
      (action) =>
        action.control === control &&
        action.status === 'completed' &&
        completed(action.id) &&
        (action.expiresAt === undefined || action.expiresAt > state.tick)
    );
  const guard = state.actions.find((action) => action.id === state.resources.guard);
  const manual = live('manual-access');
  const hold = live('pause-dispatch');
  const pendingHold = pending('pause-dispatch');
  const pendingConnector = pending('isolate-connector') ?? pending('restore-connector');
  let isolated = false;
  let restored = false;
  for (const event of state.events) {
    if (event.type !== 'action.completed') continue;
    if (event.payload.control === 'isolate-connector') {
      isolated = true;
      restored = false;
    }
    if (event.payload.control === 'restore-connector') {
      isolated = false;
      restored = true;
    }
  }
  return {
    guardAssigned: Boolean(guard),
    manualChecks: Boolean(manual),
    guardLabel: guard
      ? manual
        ? `Guard at manual checks until ${time(manual.expiresAt!)}. Mobile patrol coverage is displaced.`
        : `Guard ${guard.control === 'manual-access' ? 'setting up manual checks' : 'committed to entrance verification'}; update ${time(guard.expectedUpdate)}. Mobile patrol coverage is displaced.`
      : 'Guard available; no current mobile-patrol commitment.',
    isolated,
    connectorPending: Boolean(pendingConnector),
    connectorLabel: `${isolated ? 'Vendor path isolated; cached local badges remain usable.' : restored ? 'Vendor path restored after recorded validation.' : 'Shared vendor identity dependency; integrity is not implied.'}${pendingConnector ? ` ${pendingConnector.status === 'requested' ? 'Approval pending' : 'Work in progress'}; update ${time(pendingConnector.expectedUpdate)}.` : ''}`,
    dispatchPaused: Boolean(hold),
    dispatchPending: Boolean(pendingHold),
    dispatchLabel: hold
      ? `Bounded shipment hold until ${time(hold.expiresAt!)}; receiving deadline still applies.`
      : pendingHold
        ? `${pendingHold.status === 'requested' ? 'Approval requested' : 'Hold being implemented'}; no completed hold yet. Update ${time(pendingHold.expectedUpdate)}.`
        : 'No active shipment hold. The route does not establish that delivery will succeed.',
  };
}

// Three.js owns only this optional projection. It does not use a second React renderer.
function disposeCampus(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((object) => {
    const drawable = object as THREE.Mesh;
    if (drawable.geometry) geometries.add(drawable.geometry);
    if (drawable.material)
      for (const material of Array.isArray(drawable.material)
        ? drawable.material
        : [drawable.material])
        materials.add(material);
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
}

function buildCampus(selected: AssetId, projection: Projection): THREE.Group {
  const campus = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const material = (color: string, roughness = 0.8, metalness = 0) => {
    const key = `${color}/${roughness}/${metalness}`;
    if (!materials.has(key))
      materials.set(key, new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    return materials.get(key)!;
  };
  const block = (
    parent: THREE.Group,
    at: Point,
    size: Point,
    color: string,
    roughness = 0.8,
    metalness = 0
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      material(color, roughness, metalness)
    );
    mesh.position.set(...at);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const group = (at: Point, asset?: AssetId) => {
    const result = new THREE.Group();
    result.position.set(...at);
    if (asset) result.userData.assetId = asset;
    campus.add(result);
    return result;
  };
  const path = (points: Point[], color = palette.amber) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(
      points.map((point) => new THREE.Vector3(...point))
    );
    const line = new THREE.Line(
      geometry,
      new THREE.LineDashedMaterial({ color, dashSize: 0.16, gapSize: 0.1 })
    );
    line.computeLineDistances();
    campus.add(line);
  };
  const plinth = (parent: THREE.Group, size: [number, number], asset: AssetId) => {
    block(
      parent,
      [0, 0.035, 0],
      [size[0] + 0.36, 0.07, size[1] + 0.36],
      selected === asset ? '#786744' : palette.paving
    );
    if (selected !== asset) return;
    for (const sign of [-1, 1]) {
      block(
        parent,
        [0, 0.08, sign * (size[1] / 2 + 0.18)],
        [size[0] + 0.36, 0.035, 0.055],
        palette.selected
      );
      block(
        parent,
        [sign * (size[0] / 2 + 0.18), 0.08, 0],
        [0.055, 0.035, size[1] + 0.36],
        palette.selected
      );
    }
  };
  block(campus, [0, -0.17, -0.2], [12.5, 0.25, 8.2], '#242b23');
  block(campus, [0, -0.025, -0.2], [12.25, 0.07, 8.02], palette.ground);
  block(campus, [0, 0.025, 2.14], [12.1, 0.06, 1.28], palette.road);
  block(campus, [3.18, 0.025, 0.18], [2.77, 0.06, 3.22], palette.road);
  block(campus, [-4.03, 0.03, 2.12], [1.2, 0.07, 3.56], palette.paving);
  for (let index = 0; index < 13; index++)
    block(campus, [-5.56 + index * 0.9, 0.064, 2.15], [0.4, 0.012, 0.035], '#afb197');
  for (const x of [-4.55, -4.33, -4.11, -3.89, -3.67, -3.45])
    block(campus, [x, 0.076, 2.1], [0.09, 0.012, 0.72], '#dedaca');
  block(campus, [0, 0.035, 0.93], [5.5, 0.065, 0.64], '#7a8170');
  path(
    [
      [-1.45, 0.13, -0.45],
      [-1.45, 0.13, 0.42],
      [-3.94, 0.13, 0.42],
    ],
    projection.isolated ? '#717765' : palette.amber
  );
  path(
    [
      [0.38, 0.13, -0.45],
      [0.38, 0.13, 0.42],
      [3.1, 0.13, 0.42],
      [3.1, 0.13, -0.32],
    ],
    projection.isolated ? '#717765' : palette.amber
  );
  if (!projection.isolated)
    path([
      [-1.45, 0.13, -0.45],
      [0.38, 0.13, -0.45],
    ]);
  else
    for (const x of [-0.92, -0.15])
      block(campus, [x, 0.17, -0.45], [0.075, 0.2, 0.2], palette.amber);
  if (projection.guardAssigned)
    path(
      [
        [-4.03, 0.13, 3.14],
        [-4.03, 0.13, 1.42],
      ],
      palette.selected
    );
  if (projection.dispatchPaused) {
    block(campus, [3.2, 0.36, 1.13], [2.7, 0.09, 0.11], palette.amber);
    for (const x of [2, 4.4]) block(campus, [x, 0.24, 1.13], [0.11, 0.47, 0.11], '#ddd2b0');
  }
  // Main research building: glazed facade, mullions, recessed door, canopy and roof lightwell.
  const research = group([-0.75, 0, -1.8], 'connector');
  plinth(research, [3.9, 2.25], 'connector');
  block(research, [-0.65, 0.87, 0], [2.55, 1.7, 2.1], palette.wall);
  block(research, [1.05, 0.58, 0.02], [0.92, 1.12, 2.06], '#bbbda9');
  block(research, [-0.65, 1.73, 0], [2.7, 0.12, 2.25], palette.roof);
  block(research, [1.06, 1.17, 0.02], [1.08, 0.1, 2.18], palette.roof);
  block(research, [-0.68, 0.92, 1.064], [2.15, 1.26, 0.035], palette.glass, 0.28, 0.24);
  for (const x of [-1.58, -1.12, -0.66, -0.2, 0.26])
    block(research, [x, 0.92, 1.09], [0.042, 1.31, 0.055], palette.frame);
  for (const y of [0.27, 0.9, 1.57])
    block(research, [-0.67, y, 1.09], [2.22, 0.042, 0.06], palette.frame);
  block(research, [1.53, 0.66, 0.02], [0.03, 0.73, 1.64], palette.glass, 0.28, 0.24);
  for (const z of [-0.63, -0.2, 0.22, 0.64])
    block(research, [1.55, 0.66, z], [0.04, 0.81, 0.045], palette.frame);
  block(research, [0.57, 0.53, 1.08], [0.34, 1.02, 0.065], '#263e36');
  block(research, [0.57, 1.2, 1.32], [0.83, 0.08, 0.64], palette.wall);
  block(research, [-0.65, 1.8, -0.08], [1.42, 0.16, 0.86], '#62776d', 0.35, 0.15);
  block(research, [-0.65, 1.91, -0.08], [1.18, 0.07, 0.64], '#81988c', 0.25, 0.2);
  const checkpoint = group([-4.03, 0, 0.72], 'entrance');
  plinth(checkpoint, [1.36, 1.35], 'entrance');
  block(checkpoint, [-0.38, 0.46, -0.12], [0.66, 0.84, 1.13], palette.wall);
  block(checkpoint, [-0.38, 0.92, -0.1], [0.81, 0.11, 1.29], palette.roof);
  block(checkpoint, [-0.035, 0.58, -0.06], [0.025, 0.36, 0.79], palette.glass, 0.3, 0.25);
  block(checkpoint, [-0.38, 0.59, 0.459], [0.46, 0.33, 0.025], palette.glass, 0.3, 0.25);
  block(checkpoint, [0.36, 1.08, 0], [1.15, 0.1, 1.48], palette.wall);
  for (const [x, z] of [
    [-0.04, -0.61],
    [0.84, -0.61],
    [0.84, 0.61],
  ])
    block(checkpoint, [x, 0.56, z], [0.044, 1.1, 0.044], palette.frame);
  block(
    checkpoint,
    [0.56, 0.27, 0.38],
    [0.12, 0.48, 0.12],
    projection.manualChecks ? palette.amber : '#657f70'
  );
  if (projection.guardAssigned) {
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.1, 0.22, 3, 6),
      material(palette.amber)
    );
    body.position.set(0.4, 0.36, -0.25);
    body.castShadow = true;
    checkpoint.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), material('#ddd3b5'));
    head.position.set(0.4, 0.63, -0.25);
    head.castShadow = true;
    checkpoint.add(head);
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(0.19, 0.25, 18),
      material(palette.selected)
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0.4, 0.09, -0.25);
    checkpoint.add(marker);
  }
  const dispatch = group([3.13, 0, -1.47], 'dispatch');
  plinth(dispatch, [2.7, 2.36], 'dispatch');
  block(dispatch, [0, 0.63, -0.1], [2.54, 1.22, 2.13], '#c5c3ad');
  block(dispatch, [0, 1.28, -0.1], [2.75, 0.1, 2.35], palette.roof);
  block(dispatch, [0, 1.04, 0.98], [2.4, 0.16, 0.08], '#d7d4c5');
  for (const x of [-0.8, 0, 0.8]) {
    block(
      dispatch,
      [x, 0.47, 0.982],
      [0.57, 0.77, 0.035],
      projection.dispatchPaused ? '#917a49' : '#5a6a5e'
    );
    for (const y of [0.22, 0.38, 0.54, 0.7])
      block(
        dispatch,
        [x, y, 1.005],
        [0.53, 0.024, 0.022],
        projection.dispatchPaused ? '#b19a68' : '#84917d'
      );
    block(dispatch, [x, 0.11, 1.16], [0.68, 0.15, 0.38], '#969b88');
  }
  block(dispatch, [-0.8, 0.24, 1.79], [0.58, 0.47, 1.04], '#d6d2be');
  block(dispatch, [-0.8, 0.2, 2.43], [0.58, 0.39, 0.36], '#8a957d');
  block(dispatch, [-0.8, 0.36, 2.48], [0.48, 0.12, 0.035], palette.glass, 0.3);
  for (const x of [-1.12, -0.48])
    for (const z of [1.53, 2.35]) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.06, 8),
        material('#30382f')
      );
      wheel.position.set(x, 0.13, z);
      wheel.rotation.z = Math.PI / 2;
      dispatch.add(wheel);
    }
  for (const [index, [x, z]] of [
    [-5.28, -2.5],
    [-5.28, -1.25],
    [5.3, -2.67],
    [5.3, -1.25],
  ].entries()) {
    const tree = group([x, 0, z]);
    block(tree, [0, 0.08, 0], [0.76, 0.16, 0.76], '#59654d');
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.06, 0.88, 6),
      material('#797560')
    );
    trunk.position.y = 0.49;
    trunk.castShadow = true;
    tree.add(trunk);
    const canopy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.44, 0),
      material(index % 2 ? '#8d9b6f' : '#758763')
    );
    canopy.position.y = 1.04;
    canopy.castShadow = true;
    tree.add(canopy);
  }
  return campus;
}

type SceneRuntime = {
  scene: THREE.Scene;
  world: THREE.Group;
  controls: OrbitControls;
  invalidate: () => void;
};
const tags: Array<{ asset: AssetId; number: string; label: string; position: Point }> = [
  { asset: 'entrance', number: '01', label: 'ENTRANCE', position: [-4.03, 1.6, 0.72] },
  { asset: 'connector', number: '02', label: 'IDENTITY', position: [-1.3, 2.35, -1.7] },
  { asset: 'dispatch', number: '03', label: 'DISPATCH', position: [3.13, 1.8, -1.59] },
];

export default function CampusScene({ selected, onSelect, motion, onFallback, state }: Props) {
  const host = useRef<HTMLDivElement | null>(null);
  const labels = useRef<Partial<Record<AssetId, HTMLSpanElement>>>({});
  const runtime = useRef<SceneRuntime | null>(null);
  const callbacks = useRef({ onSelect, onFallback });
  const [failed, setFailed] = useState(false);
  const projection = useMemo(() => projectCommitments(state), [state]);
  useEffect(() => {
    callbacks.current = { onSelect, onFallback };
  }, [onSelect, onFallback]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer | undefined;
    let controls: OrbitControls | undefined;
    let observer: ResizeObserver | undefined;
    let disposed = false;
    let lost = false;
    let animationFrame = 0;
    let measuredFrames = 0;
    let slowFrames = 0;
    const cleanups: Array<() => void> = [];
    const fail = () => {
      if (disposed || lost) return;
      lost = true;
      setFailed(true);
      callbacks.current.onFallback();
    };
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'low-power',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor('#252d24');
      const canvas = renderer.domElement;
      canvas.style.display = 'block';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.touchAction = 'none';
      element.appendChild(canvas);
      const scene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-7, 7, 5, -5, 0.1, 60);
      camera.position.set(7.7, 7.7, 10.4);
      camera.lookAt(0, 0.2, -0.3);
      scene.add(
        new THREE.HemisphereLight('#e7eddd', '#57624e', 1.3),
        new THREE.AmbientLight('#ffffff', 0.55)
      );
      const sun = new THREE.DirectionalLight('#fff0ce', 2.9);
      sun.position.set(-3.5, 8, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      sun.shadow.camera.left = -9;
      sun.shadow.camera.right = 9;
      sun.shadow.camera.top = 7;
      sun.shadow.camera.bottom = -7;
      sun.shadow.normalBias = 0.04;
      scene.add(sun);
      const fill = new THREE.DirectionalLight('#cadbcf', 0.7);
      fill.position.set(5, 4, -5);
      scene.add(fill);
      const world = new THREE.Group();
      scene.add(world);
      const invalidate = () => {
        if (disposed || lost || animationFrame) return;
        animationFrame = requestAnimationFrame(() => {
          animationFrame = 0;
          if (disposed || lost) return;
          try {
            const started = performance.now();
            renderer!.render(scene, camera);
            const elapsed = performance.now() - started;
            for (const tag of tags) {
              const label = labels.current[tag.asset];
              if (!label) continue;
              const position = new THREE.Vector3(...tag.position).project(camera);
              label.style.left = `${((position.x + 1) * element.clientWidth) / 2}px`;
              label.style.top = `${((1 - position.y) * element.clientHeight) / 2}px`;
              label.style.visibility = position.z < 1 && position.z > -1 ? 'visible' : 'hidden';
            }
            // Assess render cost only, never the idle time between demand frames. Skip shader warm-up.
            measuredFrames++;
            if (measuredFrames > 5 && elapsed > 70) slowFrames++;
            if (measuredFrames >= 29) {
              if (slowFrames >= 16) fail();
              measuredFrames = 5;
              slowFrames = 0;
            }
          } catch {
            fail();
          }
        });
      };
      controls = new OrbitControls(camera, canvas);
      controls.target.set(0, 0.2, -0.3);
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.minZoom = 1;
      controls.maxZoom = 2.4;
      controls.minPolarAngle = 0.45;
      controls.maxPolarAngle = 1.18;
      controls.minAzimuthAngle = -0.95;
      controls.maxAzimuthAngle = 1.1;
      controls.addEventListener('change', invalidate);
      controls.update();
      runtime.current = { scene, world, controls, invalidate };
      const resize = () => {
        if (disposed) return;
        const width = Math.max(1, element.clientWidth),
          height = Math.max(1, element.clientHeight),
          aspect = width / height,
          viewWidth = Math.max(13.8, 8.6 * aspect),
          viewHeight = viewWidth / aspect;
        camera.left = -viewWidth / 2;
        camera.right = viewWidth / 2;
        camera.top = viewHeight / 2;
        camera.bottom = -viewHeight / 2;
        camera.updateProjectionMatrix();
        renderer!.setSize(width, height, false);
        invalidate();
      };
      observer = new ResizeObserver(resize);
      observer.observe(element);
      resize();
      const contextLost = (event: Event) => {
        event.preventDefault();
        fail();
      };
      canvas.addEventListener('webglcontextlost', contextLost);
      cleanups.push(() => canvas.removeEventListener('webglcontextlost', contextLost));
      let down: { x: number; y: number } | null = null;
      const pointerDown = (event: PointerEvent) => {
        down = { x: event.clientX, y: event.clientY };
      };
      const pointerUp = (event: PointerEvent) => {
        if (!down || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) {
          down = null;
          return;
        }
        down = null;
        const rect = canvas.getBoundingClientRect();
        const point = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(point, camera);
        let target: THREE.Object3D | null =
          raycaster.intersectObject(runtime.current!.world, true)[0]?.object ?? null;
        while (target) {
          const asset = target.userData.assetId;
          if (asset === 'entrance' || asset === 'connector' || asset === 'dispatch') {
            callbacks.current.onSelect(asset);
            break;
          }
          target = target.parent;
        }
      };
      canvas.addEventListener('pointerdown', pointerDown);
      canvas.addEventListener('pointerup', pointerUp);
      cleanups.push(() => {
        canvas.removeEventListener('pointerdown', pointerDown);
        canvas.removeEventListener('pointerup', pointerUp);
      });
    } catch {
      fail();
    }
    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer?.disconnect();
      cleanups.forEach((cleanup) => cleanup());
      controls?.dispose();
      if (runtime.current) {
        disposeCampus(runtime.current.world);
        runtime.current.scene.traverse((object) => {
          if (object instanceof THREE.DirectionalLight) object.shadow.dispose();
        });
        runtime.current = null;
      }
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, []);
  useEffect(() => {
    const current = runtime.current;
    if (!current) return;
    try {
      const next = buildCampus(selected, projection);
      current.scene.remove(current.world);
      disposeCampus(current.world);
      current.world = next;
      current.scene.add(next);
      current.controls.enableRotate = motion;
      current.controls.enableZoom = motion;
      current.invalidate();
    } catch {
      setFailed(true);
      callbacks.current.onFallback();
    }
  }, [selected, projection, motion]);
  const legend = [
    {
      id: '01',
      label: 'Service entrance',
      detail: projection.guardLabel,
      active: projection.guardAssigned,
    },
    {
      id: '02',
      label: 'Identity dependency',
      detail: projection.connectorLabel,
      active: projection.isolated || projection.connectorPending,
    },
    {
      id: '03',
      label: 'Dispatch route',
      detail: projection.dispatchLabel,
      active: projection.dispatchPaused || projection.dispatchPending,
    },
  ];
  return (
    <>
      <div className="gh-scene" style={{ height: 330 }} aria-hidden="true">
        <div ref={host} style={{ position: 'absolute', inset: 0 }} />
        {!failed &&
          tags.map((tag) => (
            <span
              key={tag.asset}
              ref={(element) => {
                if (element) labels.current[tag.asset] = element;
                else delete labels.current[tag.asset];
              }}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                visibility: 'hidden',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                userSelect: 'none',
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui,sans-serif',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 7px',
                border: `1px solid ${selected === tag.asset ? '#e5c27b' : '#9aab936b'}`,
                background: selected === tag.asset ? '#e6c584' : '#263128ed',
                color: selected === tag.asset ? '#282c25' : '#f0eddf',
                borderRadius: 3,
                boxShadow: '0 2px 8px #10150f55',
              }}
            >
              {tag.number} {tag.label}
            </span>
          ))}
        <span
          style={{
            position: 'absolute',
            top: 10,
            left: 12,
            fontSize: 12,
            letterSpacing: 1.4,
            color: '#c2ccb5',
            pointerEvents: 'none',
          }}
        >
          GLASSHOUSE / {time(state?.tick ?? 0)}
        </span>
        <span
          className="gh-scene-caption"
          style={{
            fontSize: 12,
            color: '#d5ddc9',
            background: '#252d24de',
            padding: '4px 6px',
            borderRadius: 3,
          }}
        >
          {failed
            ? 'Architecture unavailable. The complete schematic is preserved.'
            : motion
              ? 'Drag to inspect · select a building or use the asset buttons'
              : 'Fixed camera · select an asset below'}
          <br />
          Dashed amber: identity dependency · gap: recorded isolation
        </span>
      </div>
      <div
        aria-label="Campus commitments shown in the architectural view"
        style={{ padding: '13px 0 8px', borderBottom: '1px solid #cecec4' }}
      >
        <p style={{ margin: '0 0 10px', fontSize: 14, color: '#565a50', lineHeight: 1.5 }}>
          Recorded commitments only. The schematic and evidence record contain the same decision
          information.
        </p>
        <dl style={{ margin: 0, display: 'grid', gap: 12 }}>
          {legend.map((item) => (
            <div key={item.id}>
              <dt
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 14,
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: '#4b5146',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 25,
                    height: 25,
                    border: `1px solid ${item.active ? '#ab8649' : '#b7bcad'}`,
                    background: item.active ? '#e5d6b7' : '#e6e7df',
                    color: '#575949',
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 14,
                  }}
                >
                  {item.id}
                </span>
                {item.label}
              </dt>
              <dd
                style={{ margin: '2px 0 0 33px', fontSize: 14, lineHeight: 1.65, color: '#646a5e' }}
              >
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
