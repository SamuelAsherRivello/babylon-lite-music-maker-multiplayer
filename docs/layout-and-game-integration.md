# Music stage integration

The Vite application root is `music-maker/`. `src/ui/App.jsx` composes accessible controls inside BrowserSurface's fixed landscape viewport, preserving title, repository, settings and version corner roles. Residual browser space becomes decorative gutters; fullscreen retains every primary control. Orientation switching is removed.

The logical resolution, internal render resolution and canvas backing resolution are 640×360. Babylon Lite renders original nearest-neighbor raster sprites through BabylonLiteAIEntry PixelPerfect2D with a fixed camera and integer positions. CSS display size fits the available 16:9 area independently of device pixel ratio or browser zoom. Integer display scales preserve uniform authored pixels; fractional CSS fits can have uneven physical pixel widths. The logical camera and musical clock never change with zoom. A smaller portrait screen displays the landscape stage with a rotation hint.

The renderer owns GPU resources and its animation lifecycle. React owns labels and input, Playback owns the musical rules, and Web Audio owns scheduling. Settings and mute affect only the local listener, without pausing the room. A suspended listener skips stale sounds on resume.
