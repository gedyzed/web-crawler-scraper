import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "./ThemeProvider";

// ─── Types ───────────────────────────────────────────────
interface Palette {
    bgColor: string;
    glyphColor: string;
    bracketColor: string;
    lineColor: string;
}

interface Node {
    row: number;
    col: number;
    x: number;
    y: number;
    glyph: string;
}

interface BracketFade {
    x: number;
    y: number;
    text: string;
    startTime: number;
    duration: number;
}

interface CanvasState {
    ctx: CanvasRenderingContext2D;
    dpr: number;
    width: number;
    height: number;
    nodes: Node[];
    cols: number;
    rows: number;
    bracketFades: BracketFade[];
    lastBracketTime: number;
}

// ─── Configuration ────────────────────────────────────────
const DARK: Palette = {
    bgColor: "#0a0e14",
    glyphColor: "rgba(180, 185, 195, ",
    bracketColor: "rgba(170, 178, 190, ",
    lineColor: "rgba(255, 255, 255, 0.025)",
};

const LIGHT: Palette = {
    bgColor: "hsl(210 20% 98%)",
    glyphColor: "rgba(60, 65, 75, ",
    bracketColor: "rgba(50, 55, 65, ",
    lineColor: "rgba(0, 0, 0, 0.04)",
};

const CONFIG = {
    cellSize: 64,
    glyphs: ["[ ]", "{ }", "< >", "( )", "[ ]", "{ }"],
    baseFontSize: 13,
    baseOpacity: 0.06,

    // Bracket fade
    bracketFadeInterval: 3500,
    bracketFadeDuration: 2800,
    bracketFadeCount: 2,
};

// ─── Utility ──────────────────────────────────────────────
function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Component ────────────────────────────────────────────
export default function CrawlerBackground() {
    const { resolvedTheme } = useTheme();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stateRef = useRef<CanvasState | null>(null);
    const rafRef = useRef<number | null>(null);
    const paletteRef = useRef<Palette>(resolvedTheme === "dark" ? DARK : LIGHT);

    // Keep paletteRef in sync with the current theme
    useEffect(() => {
        paletteRef.current = resolvedTheme === "dark" ? DARK : LIGHT;
    }, [resolvedTheme]);

    const palette = paletteRef.current;

    // Build grid nodes from canvas dimensions
    const buildGrid = useCallback((w: number, h: number) => {
        const cols = Math.ceil(w / CONFIG.cellSize) + 1;
        const rows = Math.ceil(h / CONFIG.cellSize) + 1;
        const nodes: Node[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                nodes.push({
                    row: r,
                    col: c,
                    x: c * CONFIG.cellSize + CONFIG.cellSize / 2,
                    y: r * CONFIG.cellSize + CONFIG.cellSize / 2,
                    glyph: CONFIG.glyphs[randomInt(0, CONFIG.glyphs.length - 1)],
                });
            }
        }
        return { nodes, cols, rows };
    }, []);

    // Initialize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;

        const state: CanvasState = {
            ctx,
            dpr,
            width: 0,
            height: 0,
            nodes: [],
            cols: 0,
            rows: 0,
            bracketFades: [],
            lastBracketTime: 0,
        };

        stateRef.current = state;

        // Resize handler
        const resize = () => {
            const parent = canvas.parentElement;
            if (!parent) return;
            const rect = parent.getBoundingClientRect();
            state.width = rect.width;
            state.height = rect.height;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + "px";
            canvas.style.height = rect.height + "px";
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const grid = buildGrid(rect.width, rect.height);
            state.nodes = grid.nodes;
            state.cols = grid.cols;
            state.rows = grid.rows;
        };

        const ro = new ResizeObserver(resize);
        if (canvas.parentElement) {
            ro.observe(canvas.parentElement);
        }
        resize();

        // Visibility pause
        const onVisibility = () => {
            if (!document.hidden && !rafRef.current) {
                state.lastBracketTime = performance.now();
                rafRef.current = requestAnimationFrame(loop);
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        // Animation loop
        const loop = (now: number) => {
            if (document.hidden) {
                rafRef.current = null;
                return;
            }
            update(state, now);
            draw(state, now);
            rafRef.current = requestAnimationFrame(loop);
        };

        state.lastBracketTime = performance.now();
        rafRef.current = requestAnimationFrame(loop);

        return () => {
            ro.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [buildGrid]);

    // paletteRef is already updated via the effect above,
    // so the animation loop's draw() will pick up the new palette automatically.

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 0,
                overflow: "hidden",
                pointerEvents: "none",
                background: palette.bgColor,
            }}
        >
            <canvas
                ref={canvasRef}
                style={{ display: "block", width: "100%", height: "100%" }}
            />
        </div>
    );

    // ─── Update ─────────────────────────────────────────────
    function update(state: CanvasState, now: number) {
        // Bracket fades
        if (now - state.lastBracketTime > CONFIG.bracketFadeInterval) {
            state.lastBracketTime = now;
            for (let i = 0; i < CONFIG.bracketFadeCount; i++) {
                const node = state.nodes[randomInt(0, state.nodes.length - 1)];
                state.bracketFades.push({
                    x: node.x,
                    y: node.y,
                    text: Math.random() > 0.5 ? "[ { } ]" : "{ [ ] }",
                    startTime: now,
                    duration: CONFIG.bracketFadeDuration,
                });
            }
        }

        // Clean up expired bracket fades
        state.bracketFades = state.bracketFades.filter(
            (bf) => now - bf.startTime < bf.duration
        );
    }

    // ─── Draw ───────────────────────────────────────────────
    function draw(state: CanvasState, now: number) {
        const { ctx, width, height } = state;
        const pal = paletteRef.current;

        // Clear
        ctx.fillStyle = pal.bgColor;
        ctx.fillRect(0, 0, width, height);

        // Grid lines (very subtle)
        ctx.strokeStyle = pal.lineColor;
        ctx.lineWidth = 0.5;
        for (let x = CONFIG.cellSize; x < width; x += CONFIG.cellSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = CONFIG.cellSize; y < height; y += CONFIG.cellSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Nodes (bracket glyphs)
        ctx.font = `${CONFIG.baseFontSize}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const node of state.nodes) {
            ctx.fillStyle = pal.glyphColor + CONFIG.baseOpacity + ")";
            ctx.fillText(node.glyph, node.x, node.y);
        }

        // Bracket fades
        ctx.font = `${CONFIG.baseFontSize + 2}px 'JetBrains Mono', monospace`;
        for (const bf of state.bracketFades) {
            const elapsed = now - bf.startTime;
            const t = elapsed / bf.duration;
            const alpha = Math.sin(t * Math.PI) * 0.2;
            ctx.fillStyle = pal.bracketColor + alpha + ")";
            ctx.fillText(bf.text, bf.x, bf.y);
        }
    }
}
