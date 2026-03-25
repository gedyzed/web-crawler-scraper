export type PixelSnowOptions = {
  density?: number;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  drift?: number;
  color?: string;
  zIndex?: number;
};

type Flake = {
  x: number;
  y: number;
  size: number;
  velocityY: number;
  velocityX: number;
};

export function mountPixelSnow(container: HTMLElement, options: PixelSnowOptions = {}): () => void {
  const {
    density = 60,
    minSize = 1,
    maxSize = 3,
    speed = 0.45,
    drift = 0.2,
    color = "rgba(255,255,255,0.9)",
    zIndex = 0,
  } = options;

  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = String(zIndex);

  container.appendChild(canvas);

  const context = canvas.getContext("2d");
  if (!context) {
    canvas.remove();
    return () => {};
  }

  let width = 0;
  let height = 0;
  let rafId = 0;
  const flakeCount = Math.max(10, Math.floor(density));
  const flakes: Flake[] = [];

  const randomRange = (min: number, max: number) => min + Math.random() * (max - min);

  const resize = () => {
    width = container.clientWidth;
    height = container.clientHeight;
    canvas.width = Math.max(1, Math.floor(width * window.devicePixelRatio));
    canvas.height = Math.max(1, Math.floor(height * window.devicePixelRatio));
    context.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  const resetFlake = (flake: Flake, initial = false) => {
    flake.size = randomRange(minSize, maxSize);
    flake.x = randomRange(0, width || 1);
    flake.y = initial ? randomRange(0, height || 1) : -flake.size - randomRange(0, 24);
    flake.velocityY = speed * randomRange(0.8, 1.45) + flake.size * 0.06;
    flake.velocityX = randomRange(-drift, drift);
  };

  for (let i = 0; i < flakeCount; i += 1) {
    const flake: Flake = {
      x: 0,
      y: 0,
      size: 0,
      velocityY: 0,
      velocityX: 0,
    };
    flakes.push(flake);
  }

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = color;

    for (const flake of flakes) {
      flake.x += flake.velocityX;
      flake.y += flake.velocityY;

      if (flake.y - flake.size > height || flake.x < -8 || flake.x > width + 8) {
        resetFlake(flake);
      }

      const size = Math.max(1, Math.round(flake.size));
      context.fillRect(Math.round(flake.x), Math.round(flake.y), size, size);
    }

    rafId = window.requestAnimationFrame(draw);
  };

  resize();
  for (const flake of flakes) {
    resetFlake(flake, true);
  }
  rafId = window.requestAnimationFrame(draw);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);

  return () => {
    window.cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    canvas.remove();
  };
}
