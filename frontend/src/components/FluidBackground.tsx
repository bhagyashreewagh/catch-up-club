import { useEffect, useRef } from 'react';

const COLORS = [
  { r: 0.70, g: 0.32, b: 0.02 }, // strong burnt orange
  { r: 0.62, g: 0.24, b: 0.01 }, // deep orange
  { r: 0.48, g: 0.22, b: 0.08 }, // warm brown
  { r: 0.78, g: 0.38, b: 0.08 }, // copper orange
];

const VERT = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform vec2 texelSize;
  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const CLEAR_FRAG = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;
  void main () { gl_FragColor = value * texture2D(uTexture, vUv); }
`;

const SPLAT_FRAG = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  void main () {
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const ADVECTION_FRAG = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;
  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }
  void main () {
    vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
    vec4 result = bilerp(uSource, coord, dyeTexelSize);
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const DIVERGENCE_FRAG = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;
    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0) L = -C.x;
    if (vR.x > 1.0) R = -C.x;
    if (vT.y > 1.0) T = -C.y;
    if (vB.y < 0.0) B = -C.y;
    gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
  }
`;

const CURL_FRAG = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_FRAG = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform float curl;
  uniform float dt;
  void main () {
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture2D(uVelocity, vUv).xy;
    gl_FragColor = vec4(vel + force * dt, 0.0, 1.0);
  }
`;

const PRESSURE_FRAG = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_SUBTRACT_FRAG = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL; varying highp vec2 vR; varying highp vec2 vT; varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  void main () {
    float L = texture2D(uPressure, vL).x;
    float R = texture2D(uPressure, vR).x;
    float T = texture2D(uPressure, vT).x;
    float B = texture2D(uPressure, vB).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const DISPLAY_FRAG = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTexture;
  void main () {
    vec3 c = texture2D(uTexture, vUv).rgb;
    float a = max(c.r, max(c.g, c.b));
    gl_FragColor = vec4(c, a);
  }
`;

function mkShader(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    console.error('Shader error:', gl.getShaderInfoLog(s));
  return s;
}

function mkProgram(gl: WebGLRenderingContext, frag: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, mkShader(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(p, mkShader(gl, gl.FRAGMENT_SHADER, frag));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS))
    console.error('Program error:', gl.getProgramInfoLog(p));
  return p;
}

function u(gl: WebGLRenderingContext, p: WebGLProgram, name: string) {
  return gl.getUniformLocation(p, name);
}

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const onResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', onResize);

    // Get WebGL context -- prefer WebGL2
    const glRaw = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false, depth: false, stencil: false, antialias: false })
      || canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, depth: false, stencil: false, antialias: false });
    if (!glRaw) return;
    const gl = glRaw as WebGLRenderingContext;
    const isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

    // Float texture support -- required for the simulation to store velocity correctly
    let texType: number;
    let internalFmt: number;
    let filterLinear: boolean;

    if (isGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      gl2.getExtension('EXT_color_buffer_float');
      filterLinear = !!gl2.getExtension('OES_texture_float_linear');
      texType = 0x140B; // HALF_FLOAT
      internalFmt = 0x881A; // RGBA16F
    } else {
      const hfExt = gl.getExtension('OES_texture_half_float');
      if (hfExt) {
        texType = hfExt.HALF_FLOAT_OES;
        internalFmt = gl.RGBA;
        filterLinear = !!gl.getExtension('OES_texture_half_float_linear');
      } else {
        // Last resort: float textures
        gl.getExtension('OES_texture_float');
        texType = gl.FLOAT;
        internalFmt = gl.RGBA;
        filterLinear = !!gl.getExtension('OES_texture_float_linear');
      }
    }

    const filter = filterLinear ? gl.LINEAR : gl.NEAREST;

    const SIM = 128;
    const DYE = 512;
    const PRESSURE_ITERS = 20;
    const DENSITY_DISS = 3.8;
    const VELOCITY_DISS = 0.992;
    const CURL_STRENGTH = 4;
    const SPLAT_RADIUS = 0.0045;
    const SPLAT_FORCE = 350;

    type FBO = {
      tex: WebGLTexture; fb: WebGLFramebuffer; w: number; h: number;
      bind: (slot: number) => number;
    };

    function makeFBO(w: number, h: number): FBO {
      gl.activeTexture(gl.TEXTURE0);
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFmt, w, h, 0, gl.RGBA, texType, null);
      const fb = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
      return { tex, fb, w, h, bind(slot) { gl.activeTexture(gl.TEXTURE0 + slot); gl.bindTexture(gl.TEXTURE_2D, tex); return slot; } };
    }

    function makeDouble(w: number, h: number) {
      let r = makeFBO(w, h), wr = makeFBO(w, h);
      return { get read() { return r; }, get write() { return wr; }, swap() { [r, wr] = [wr, r]; } };
    }

    const vel = makeDouble(SIM, SIM);
    const dye = makeDouble(DYE, DYE);
    const pres = makeDouble(SIM, SIM);
    const div = makeFBO(SIM, SIM);
    const curl = makeFBO(SIM, SIM);

    const pClear = mkProgram(gl, CLEAR_FRAG);
    const pSplat = mkProgram(gl, SPLAT_FRAG);
    const pAdvect = mkProgram(gl, ADVECTION_FRAG);
    const pDiv = mkProgram(gl, DIVERGENCE_FRAG);
    const pCurl = mkProgram(gl, CURL_FRAG);
    const pVort = mkProgram(gl, VORTICITY_FRAG);
    const pPres = mkProgram(gl, PRESSURE_FRAG);
    const pGrad = mkProgram(gl, GRADIENT_SUBTRACT_FRAG);
    const pDisplay = mkProgram(gl, DISPLAY_FRAG);

    // Fullscreen quad
    const vbuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,-1,1,1,1,1,-1]), gl.STATIC_DRAW);
    const ibuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0,1,2,0,2,3]), gl.STATIC_DRAW);

    function useProgram(p: WebGLProgram) {
      gl.useProgram(p);
      const loc = gl.getAttribLocation(p, 'aPosition');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    function blit(target: FBO | null) {
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fb);
        gl.viewport(0, 0, target.w, target.h);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    function splat(x: number, y: number, dx: number, dy: number, col: typeof COLORS[0]) {
      const aspect = canvas.width / canvas.height;
      useProgram(pSplat);
      gl.uniform2f(u(gl, pSplat, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pSplat, 'uTarget'), vel.read.bind(0));
      gl.uniform1f(u(gl, pSplat, 'aspectRatio'), aspect);
      gl.uniform2f(u(gl, pSplat, 'point'), x, 1 - y);
      gl.uniform3f(u(gl, pSplat, 'color'), dx, -dy, 0);
      gl.uniform1f(u(gl, pSplat, 'radius'), SPLAT_RADIUS);
      blit(vel.write); vel.swap();

      gl.uniform1i(u(gl, pSplat, 'uTarget'), dye.read.bind(0));
      gl.uniform2f(u(gl, pSplat, 'texelSize'), 1/DYE, 1/DYE);
      gl.uniform3f(u(gl, pSplat, 'color'), col.r, col.g, col.b);
      blit(dye.write); dye.swap();
    }

    let lastT = performance.now();
    let prevX = -1, prevY = -1;
    let colorIdx = 0;

    function onMove(e: MouseEvent) {
      const x = e.clientX / canvas.width;
      const y = e.clientY / canvas.height;
      if (prevX < 0) { prevX = x; prevY = y; return; }
      const dx = (x - prevX) * SPLAT_FORCE;
      const dy = (y - prevY) * SPLAT_FORCE;
      if (Math.abs(dx) + Math.abs(dy) > 0.001) {
        splat(x, y, dx, dy, COLORS[colorIdx++ % COLORS.length]);
      }
      prevX = x; prevY = y;
    }
    function onLeave() { prevX = -1; prevY = -1; }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);

    // Ambient splats so the background feels alive without cursor movement
    const ambientInterval = setInterval(() => {
      const x = Math.random();
      const y = Math.random() * 0.7;
      splat(
        x, y,
        (Math.random() - 0.5) * 250,
        (Math.random() - 0.5) * 250,
        COLORS[Math.floor(Math.random() * COLORS.length)]
      );
    }, 1800);

    function step(dt: number) {
      gl.disable(gl.BLEND);

      // Curl
      useProgram(pCurl);
      gl.uniform2f(u(gl, pCurl, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pCurl, 'uVelocity'), vel.read.bind(0));
      blit(curl);

      // Vorticity
      useProgram(pVort);
      gl.uniform2f(u(gl, pVort, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pVort, 'uVelocity'), vel.read.bind(0));
      gl.uniform1i(u(gl, pVort, 'uCurl'), curl.bind(1));
      gl.uniform1f(u(gl, pVort, 'curl'), CURL_STRENGTH);
      gl.uniform1f(u(gl, pVort, 'dt'), dt);
      blit(vel.write); vel.swap();

      // Divergence
      useProgram(pDiv);
      gl.uniform2f(u(gl, pDiv, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pDiv, 'uVelocity'), vel.read.bind(0));
      blit(div);

      // Clear pressure
      useProgram(pClear);
      gl.uniform1i(u(gl, pClear, 'uTexture'), pres.read.bind(0));
      gl.uniform1f(u(gl, pClear, 'value'), 0.8);
      blit(pres.write); pres.swap();

      // Pressure solve
      useProgram(pPres);
      gl.uniform2f(u(gl, pPres, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pPres, 'uDivergence'), div.bind(0));
      for (let i = 0; i < PRESSURE_ITERS; i++) {
        gl.uniform1i(u(gl, pPres, 'uPressure'), pres.read.bind(1));
        blit(pres.write); pres.swap();
      }

      // Gradient subtract
      useProgram(pGrad);
      gl.uniform2f(u(gl, pGrad, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pGrad, 'uPressure'), pres.read.bind(0));
      gl.uniform1i(u(gl, pGrad, 'uVelocity'), vel.read.bind(1));
      blit(vel.write); vel.swap();

      // Advect velocity
      useProgram(pAdvect);
      gl.uniform2f(u(gl, pAdvect, 'texelSize'), 1/SIM, 1/SIM);
      gl.uniform2f(u(gl, pAdvect, 'dyeTexelSize'), 1/SIM, 1/SIM);
      gl.uniform1i(u(gl, pAdvect, 'uVelocity'), vel.read.bind(0));
      gl.uniform1i(u(gl, pAdvect, 'uSource'), vel.read.bind(0));
      gl.uniform1f(u(gl, pAdvect, 'dt'), dt);
      gl.uniform1f(u(gl, pAdvect, 'dissipation'), VELOCITY_DISS);
      blit(vel.write); vel.swap();

      // Advect dye
      gl.uniform2f(u(gl, pAdvect, 'dyeTexelSize'), 1/DYE, 1/DYE);
      gl.uniform1i(u(gl, pAdvect, 'uVelocity'), vel.read.bind(0));
      gl.uniform1i(u(gl, pAdvect, 'uSource'), dye.read.bind(1));
      gl.uniform1f(u(gl, pAdvect, 'dissipation'), DENSITY_DISS);
      blit(dye.write); dye.swap();
    }

    function render() {
      const now = performance.now();
      const dt = Math.min((now - lastT) / 1000, 0.016);
      lastT = now;

      step(dt);

      // Draw to screen
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      useProgram(pDisplay);
      gl.uniform1i(u(gl, pDisplay, 'uTexture'), dye.read.bind(0));
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }

    let rafId: number;
    function loop() { rafId = requestAnimationFrame(loop); render(); }
    loop();

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(ambientInterval);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.14,
      }}
    />
  );
}
