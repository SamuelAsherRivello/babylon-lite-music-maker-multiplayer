import { useEffect, useRef, useState, useCallback } from "react";
import versionText from "../../../version.txt?raw";
import { BrowserSurface } from "./BrowserSurface.jsx";
import { Content } from "../content/Content.jsx";
import { SOUNDS } from "../music/rules.js";
export function Corner({ position, children }) {
  return <div className={`corner corner_${position}`}>{children}</div>;
}
const repository =
    "https://github.com/SamuelAsherRivello/babylon-lite-music-maker-multiplayer",
  labels = ["Kick", "Snare", "Hi-hat", "Tone"];
const idle = {
  status: "idle",
  players: [],
  step: 0,
  phase: 0,
  active: false,
  queued: [],
  notice: "Create a room. Make a little noise.",
};
export function App() {
  const [session, setSession] = useState(null),
    [state, setState] = useState(idle),
    [code, setCode] = useState(
      new URLSearchParams(location.search).get("room") || "",
    ),
    [frame, setFrame] = useState({ scale: 1, left: 0, top: 0 }),
    [sound, setSound] = useState(false),
    [muted, setMuted] = useState(
      new URLSearchParams(location.search).get("mute") === "true",
    ),
    [settings, setSettings] = useState(false),
    [ready, setReady] = useState(false);
  const viewRef = useRef(state);
  viewRef.current = state;
  const onReady = useCallback((value) => setReady(value), []),
    resize = useCallback((rect) => {
      const scale = Math.min(rect.width / 640, rect.height / 360);
      setFrame({
        scale,
        left: (rect.width - 640 * scale) / 2,
        top: (rect.height - 360 * scale) / 2,
      });
    }, []);
  useEffect(() => {
    if (!session) return;
    return session.subscribe(setState);
  }, [session]);
  useEffect(() => () => session?.dispose(), [session]);
  const tap = useCallback(
    (i) => {
      if (ready) session?.tap(SOUNDS[i]);
    },
    [session, ready],
  );
  useEffect(() => {
    const down = (e) => {
      if (
        e.repeat ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      )
        return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < 4) {
        e.preventDefault();
        tap(i);
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [tap]);
  async function enter(create, automatic = false) {
    setState((s) => ({
      ...s,
      status: "connecting",
      notice: "Connecting to relay…",
    }));
    try {
      const { MusicSession } = await import("../music/session.js");
      session?.dispose();
      const next = new MusicSession();
      setSession(next);
      if (!automatic) {
        await next.audio.enable();
        setSound(true);
        next.audio.setMuted(muted);
      }
      await next.connect(create, code);
    } catch (e) {
      setState((s) => ({ ...s, status: "error", notice: e.message }));
    }
  }
  useEffect(() => {
    if (ready && new URLSearchParams(location.search).get("room"))
      void enter(false, true);
  }, [ready]);
  async function enable() {
    await session?.audio.enable();
    setSound(true);
    session?.resume();
  }
  async function copy() {
    try {
      const url = new URL(location.href);
      url.search = "";
      url.searchParams.set("room", state.code);
      await navigator.clipboard.writeText(url.href);
      session?.notice("Invite copied");
    } catch {
      session?.notice("Copy the room code above to invite a friend");
    }
  }
  const connected = state.status === "connected";
  const stage = (
    <div
      className="stage"
      style={{
        transform: `scale(${frame.scale})`,
        left: frame.left,
        top: frame.top,
      }}
    >
      <Content viewRef={viewRef} onReady={onReady} />
      <Corner position="top_left">
        <div className="eyebrow">A SHARED LITTLE RHYTHM MACHINE</div>
        <h1>
          Music Maker<span>Multiplayer</span>
        </h1>
      </Corner>
      <Corner position="top_right">
        <a href={repository} target="_blank" rel="noopener noreferrer">
          ↗ Repository
        </a>
        <div className="room-code">
          {state.code ? `ROOM ${state.code}` : "UP TO 4 PLAYERS"}
        </div>
        {connected && (
          <div>
            <button onClick={copy}>Copy invite</button>
            <button
              onClick={() => {
                session.dispose();
                setSession(null);
                setState(idle);
              }}
            >
              Leave
            </button>
          </div>
        )}
      </Corner>
      <aside>
        <div className="eyebrow">PLAYERS · {state.players.length}/4</div>
        {Array.from({ length: 4 }, (_, i) => {
          const p = state.players.find((p) => p.number === i + 1);
          return (
            <div className={`player ${p ? "occupied" : ""}`} key={i}>
              <b style={{ color: p?.color }}>{i + 1}</b>
              <div>
                <strong>{p?.name || "Open seat"}</strong>
                <small>
                  {p
                    ? `${p.id === state.id ? "You · " : ""}${p.host ? "Host" : "Connected"}`
                    : "Waiting for a friend"}
                </small>
              </div>
            </div>
          );
        })}
        <div className="roster-note">
          One room.
          <br />
          Four voices.
          <br />
          No wrong notes.
        </div>
      </aside>
      <main>
        <div className="clock-heading">
          <span>EIGHT-STEP CLOCK</span>
          <b>
            {connected
              ? `CYCLE ${Math.floor(state.step / 8) + 1}`
              : "500 MS / STEP"}
          </b>
        </div>
        <div className="numbers">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className={connected && state.step % 8 === i ? "lit" : ""}
            >
              {i + 1}
            </span>
          ))}
        </div>
        <div className="legend">
          <span>● Live step</span>
          <span className="remote">◌ Remote source · −3 sec</span>
        </div>
        <div className="pad-heading">
          <span>YOUR SOUNDS</span>
          <small>Tap once. Hear it on the next step.</small>
        </div>
        <div className="pads">
          {labels.map((label, i) => (
            <button
              key={label}
              disabled={
                !connected || !state.active || !state.audioReady || !ready
              }
              className={state.queued.includes(SOUNDS[i]) ? "queued" : ""}
              onPointerDown={(e) => {
                if (e.button === 0) {
                  e.preventDefault();
                  tap(i);
                }
              }}
              onClick={(e) => {
                if (e.detail === 0) tap(i);
              }}
              aria-label={`Play ${label}`}
            >
              <span className={`pad-icon icon-${i}`}>
                {["▂▆▂", "▥", "╱╱", "∿"][i]}
              </span>
              {label}
              <kbd>{i + 1}</kbd>
            </button>
          ))}
        </div>
        <div className="status" role="status">
          {state.notice}
        </div>
      </main>
      <Corner position="bottom_left">
        <button onClick={() => setSettings(!settings)}>⚙ Settings</button>
        {connected && (!sound || !state.audioReady) && (
          <button onClick={enable}>Enable sound</button>
        )}
      </Corner>
      <div className="timing-note">
        YOU: NEXT STEP <span>·</span> OTHERS: +3 SEC
      </div>
      <Corner position="bottom_right">
        <span className={connected ? "connection connected" : "connection"}>
          {state.status}
        </span>
        <small>v{versionText.trim().replace("version=", "")}</small>
      </Corner>
      {!connected && state.status !== "connecting" && (
        <div className="entry">
          <div className="entry-card">
            <div className="eyebrow">LET’S MAKE SOME NOISE</div>
            <h2>
              {state.status === "ended"
                ? "Host disconnected"
                : state.status === "full"
                  ? "This room is full"
                  : "A tiny multiplayer jam."}
            </h2>
            <p>
              {state.status === "ended"
                ? "This session has ended. Start a fresh room."
                : "Four sounds. Eight steps. Friends welcome."}
            </p>
            <div className="join-row">
              <input
                aria-label="Room code"
                placeholder="CODE"
                maxLength={4}
                value={code}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""),
                  )
                }
              />
              <button
                onClick={() => enter(false)}
                disabled={code.length !== 4 || !ready}
              >
                Join room
              </button>
            </div>
            <button
              className="primary"
              onClick={() => enter(true)}
              disabled={!ready}
            >
              Create room →
            </button>
            {["error", "full"].includes(state.status) && (
              <p role="alert">{state.notice}</p>
            )}
            <small>Sound starts when you enter. Headphones recommended.</small>
          </div>
        </div>
      )}
      {state.status === "connecting" && (
        <div className="entry">
          <div className="entry-card">Connecting to relay…</div>
        </div>
      )}
      {settings && (
        <div className="settings">
          <b>LOCAL SETTINGS</b>
          <label>
            <input
              type="checkbox"
              checked={muted}
              onChange={(e) => {
                setMuted(e.target.checked);
                session?.audio.setMuted(e.target.checked);
              }}
            />
            Mute sound
          </label>
          <button
            onClick={() =>
              document.fullscreenElement
                ? document.exitFullscreen()
                : document.getElementById("viewport").requestFullscreen()
            }
          >
            Toggle fullscreen
          </button>
          <p>
            Keys 1–4 or tap pads.
            <br />
            Your sound plays next step.
            <br />
            Friends hear it 3 seconds later.
          </p>
          <button onClick={() => setSettings(false)}>Close</button>
        </div>
      )}
    </div>
  );
  return (
    <>
      <BrowserSurface onViewportResize={resize} ui={stage} />
      <div className="rotate-hint">
        Turn your device sideways for a larger music stage.
      </div>
    </>
  );
}
