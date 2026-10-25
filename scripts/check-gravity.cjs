// Exercises the actual Playground effect, including event wiring and timers.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync(require.resolve('../src/components/hero/Playground.tsx'), 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true
  }
}).outputText;
let now = 0,
  id = 0,
  timers = new Map(),
  gravity,
  attract = false,
  effects = [],
  cleanup = [];
const body = new EventTarget(),
  win = new EventTarget();
win.location = {
  hash: ''
};
const sphere = {
  userData: {},
  scale: {}
};
let stateIndex = 0;
const react = {
  useMemo: fn => fn(),
  useRef: () => ({
    current: sphere
  }),
  useEffect: fn => effects.push(fn),
  useState: initial => {
    const i = stateIndex++;
    return [initial, value => {
      if (i === 1) gravity = value;else attract = value;
    }];
  }
};
const imports = name => name === '@react-three/fiber' ? {
  useFrame: () => {}
} : name === 'react' ? react : name === 'three' ? require('three') : name === 'react/jsx-runtime' ? {
  jsx: () => null,
  jsxs: () => null
} : {};
const exportsObj = {};
new Function('require', 'exports', 'window', 'document', 'setTimeout', 'clearTimeout', source)(imports, exportsObj, win, {
  body
}, (fn, delay) => {
  timers.set(++id, {
    t: now + delay,
    fn
  });
  return id;
}, i => timers.delete(i));
function advance(ms) {
  const end = now + ms;
  while (true) {
    const due = [...timers].filter(([, v]) => v.t <= end).sort((a, b) => a[1].t - b[1].t)[0];
    if (!due) break;
    now = due[1].t;
    timers.delete(due[0]);
    due[1].fn();
  }
  now = end;
}
function mount() {
  stateIndex = 0;
  effects = [];
  exportsObj.Playground();
  cleanup = effects.map(fn => fn()).filter(Boolean);
}
function right() {
  body.dispatchEvent(new Event('contextmenu', {
    cancelable: true
  }));
}
mount();
advance(1000);
right();
assert.deepEqual(gravity, [0, -100, 0]);
advance(6000);
assert.deepEqual(gravity, [0, -100, 0], 'intro must not override an explicit toggle');
right();
advance(5);
right();
advance(100);
assert.deepEqual(gravity, [0, -100, 0], 'stale off timers must not override a later on');
body.dispatchEvent(Object.assign(new Event('pointerdown'), {
  buttons: 1
}));
assert.equal(attract, true);
win.dispatchEvent(new Event('blur'));
assert.equal(attract, false, 'blur releases attraction');
cleanup.forEach(fn => fn());
assert.equal(timers.size, 0, 'unmount cancels timers');
const previous = gravity;
right();
advance(6000);
assert.equal(gravity, previous, 'unmount removes listeners');
mount();
advance(6000);
right();
assert.deepEqual(gravity, [0, -100, 0]);
right();
advance(100);
assert.deepEqual(gravity, [0, -.2, 0]);
cleanup.forEach(fn => fn());
console.log('PASS: early toggle, rapid off/on, blur, unmount and remount');
