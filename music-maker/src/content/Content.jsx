import { useEffect, useRef, useState } from "react";
import {
  createEngine,
  createGridSpriteAtlas,
  createSprite2DLayer,
  createSpriteRenderer,
  loadTexture2D,
  registerSpriteRenderer,
  startEngine,
  disposeEngine,
  disposeSpriteRenderer,
  disposeSpriteAtlas,
  releaseTexture,
} from "@babylonjs/lite";
import {
  BabylonLiteAIEntry as Entry,
  BabylonLiteMode,
} from "./babylon/pixel-grid-entry.js";
import { getInitializationMessage } from "./babylon/initialization.js";
function artwork() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const c = canvas.getContext("2d");
  for (let f = 0; f < 4; f++)
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const r = Math.hypot(x - 15.5, y - 15.5);
        if (
          f === 2
            ? r > 11 && r < 14 && (x + y) % 3 !== 0
            : r < (f === 1 ? 15 : 12)
        ) {
          c.fillStyle =
            f === 2
              ? "#ffc77c"
              : f === 1
                ? r > 12
                  ? "#b7f3ff"
                  : "#48ceff"
                : r > 10
                  ? "#3488bb"
                  : "#143b62";
          c.fillRect(f * 32 + x, y, 1, 1);
        }
      }
  return canvas.toDataURL();
}
export function Content({ viewRef, onReady }) {
  const ref = useRef(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let stopped = false,
      engine,
      texture,
      atlas,
      renderer,
      raf,
      canvas;
    const dispose = () => {
      cancelAnimationFrame(raf);
      if (renderer) disposeSpriteRenderer(renderer);
      if (atlas) disposeSpriteAtlas(atlas);
      if (texture) releaseTexture(texture);
      if (engine) disposeEngine(engine);
      renderer = atlas = texture = engine = undefined;
      canvas?.remove();
    };
    (async () => {
      try {
        if (!navigator.gpu) throw Error("WebGPU unsupported");
        canvas = document.createElement("canvas");
        canvas.width = 640;
        canvas.height = 360;
        canvas.setAttribute("aria-label", "Eight pixel clock circles");
        ref.current.append(canvas);
        Entry.configure({ mode: BabylonLiteMode.PixelPerfect2D });
        engine = await createEngine(canvas.transferControlToOffscreen(), {
          msaaSamples: 1,
        });
        if (stopped) {
          dispose();
          return;
        }
        texture = await loadTexture2D(engine, artwork(), {
          minFilter: "nearest",
          magFilter: "nearest",
          mipMaps: false,
          addressModeU: "clamp-to-edge",
          addressModeV: "clamp-to-edge",
        });
        if (stopped) {
          dispose();
          return;
        }
        atlas = createGridSpriteAtlas(texture, {
          cellWidthPx: 32,
          cellHeightPx: 32,
          columns: 4,
          rows: 1,
          pivot: [0.5, 0.5],
        });
        const layer = createSprite2DLayer(atlas, { pivot: [0.5, 0.5] });
        const sprites = Array.from({ length: 8 }, (_, i) =>
          Entry.addSprite(layer, {
            positionPx: [214 + i * 52, 147],
            sizePx: [32, 32],
            frame: 0,
          }),
        );
        const remote = Entry.addSprite(layer, {
          positionPx: [214, 147],
          sizePx: [32, 32],
          frame: 2,
          visible: false,
        });
        Entry.updateView(layer, { zoom: 1, rotation: 0 });
        Entry.centerView(layer, 320, 180, 640, 360);
        renderer = createSpriteRenderer(engine, {
          layers: [layer],
          clear: true,
          clearValue: { r: 0.026, g: 0.045, b: 0.09, a: 1 },
        });
        registerSpriteRenderer(renderer);
        await startEngine(engine);
        if (stopped) {
          dispose();
          return;
        }
        onReady(true);
        function tick() {
          if (stopped) return;
          const v = viewRef.current;
          for (let i = 0; i < 8; i++)
            Entry.update(sprites[i], {
              frame: v.active && v.step % 8 === i && v.phase < 0.32 ? 1 : 0,
            });
          Entry.update(remote, {
            visible: v.active && v.step >= 6,
          });
          Entry.move(remote, [214 + ((v.step - 6 + 8) % 8) * 52, 147]);
          raf = requestAnimationFrame(tick);
        }
        tick();
      } catch (e) {
        if (!stopped) {
          console.error(e);
          setError(getInitializationMessage(!!navigator.gpu, e));
          onReady(false);
        }
        dispose();
      }
    })();
    return () => {
      stopped = true;
      dispose();
    };
  }, [viewRef, onReady]);
  return (
    <>
      <div ref={ref} className="pixel-surface" />
      {error && (
        <div className="render-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
