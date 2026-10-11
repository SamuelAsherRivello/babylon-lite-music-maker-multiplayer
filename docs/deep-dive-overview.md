# Music runtime contracts

`MusicSession` adapts the released shared multiplayer client. It manages room entry, identity, clock requests, connection status and planned free-plan transport renewals. The host browser retains its epoch and event ledger while the relay connection changes. Unexpected host loss cancels audio and ends the jam. The relay validates bounded messages and publication permissions; it does not simulate music.

`Playback` owns musical time and event identity. The next absolute step is `floor((hostTime - start) / 500) + 1`. A tap schedules local audio immediately for that boundary, then sends its intent. Host acceptance preserves the source deadline. Other listeners schedule the accepted event at source deadline +3000 ms. Epoch/origin/step/sound identifies each one-shot across eight-circle wraps; snapshots merge without echoes. Large snapshots travel in bounded chunks. Late packets drop instead of shifting to another beat.

`MusicAudio` maps canonical deadlines to AudioContext time and creates original instrument voices. It owns gain/mute, gesture activation, scheduled-node cancellation and bounded timing traces. Rendering never triggers note playback. Suspension and resume skip stale history.

React owns accessible pads, roster and room controls inside the fixed landscape viewport. `Content` owns the Babylon Lite WebGPU engine, procedural nearest-neighbor atlas, fixed camera and animation teardown. It reads presentation state from Playback and draws integer-aligned sprites through BabylonLiteAIEntry. The backing raster remains 640×360 while CSS fits the display. See [layout contracts](layout-and-game-integration.md), [hosting limits](hosting.md) and [verification evidence](music-implementation.md).
