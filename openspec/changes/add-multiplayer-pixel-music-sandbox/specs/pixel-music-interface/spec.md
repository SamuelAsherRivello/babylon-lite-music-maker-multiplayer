# Pixel Music Interface

## Purpose

Make the shared music sandbox legible and operable through a compact pixel-perfect landscape interface that exposes local and buffered remote timing honestly.

## ADDED Requirements

### Requirement: Fixed landscape music surface
The game SHALL present original pixel graphics on a fixed landscape surface with sharp authored pixels at supported integer scales, without scrolling the game world. Primary controls and status SHALL remain visible in fullscreen.

#### Scenario: Resize and fullscreen
- **WHEN** the viewport is resized or fullscreen is entered
- **THEN** the roster, eight-step timeline, four pads and room status stay usable inside the play area and the logical step arrangement does not change.

### Requirement: Roster and room information
The interface SHALL show four numbered roster slots at the side, server-assigned names/colors for occupied slots, local and host indicators, occupancy, room code and a copyable invite.

#### Scenario: Two-player room
- **WHEN** two players are connected
- **THEN** both see the same two occupied slots and two empty slots and can identify themselves and the host.

### Requirement: Readable clock and remote playback
The interface SHALL show eight horizontally arranged circles with the same live cursor for every player and a separate remote source-step marker. The live step SHALL temporarily enlarge and change from blue to bright blue. Buffered remote playback SHALL identify its original step distinctly without creating a second sequencer.

#### Scenario: Remote event across cycle boundary
- **WHEN** a remote note from circle 4 plays three seconds after its source deadline while the live clock shows circle 2
- **THEN** the interface identifies circle 4 as that remote event's source and circle 2 as the live input step.

### Requirement: Operable sound pads
The interface SHALL provide four labeled local sound pads operable by pointer, touch and keyboard 1 through 4, show which sounds are queued, and avoid browser key repeat generating extra sounds.

#### Scenario: Mixed input
- **WHEN** a player activates kick by keyboard and snare by touch before the same step
- **THEN** both pads show queued feedback and both distinct sounds target the next step once.

#### Scenario: Focus loss
- **WHEN** the browser loses focus or a pointer is cancelled
- **THEN** held visual/input state is released without leaving stuck pads or producing repeated sounds.

### Requirement: Local sound activation and mute
The interface SHALL provide audio activation when the browser requires a gesture, a local mute toggle and a documented silent-test URL option. Local muting/settings SHALL NOT stop the room clock or change other players' sound output.

#### Scenario: Autoplay blocked
- **WHEN** a browser suspends audio on entry
- **THEN** the clock remains visible, Enable Sound is available, and activation resumes current playback without elapsed-history replay.

#### Scenario: Local mute
- **WHEN** one player mutes their client
- **THEN** their local output becomes silent while the room clock and other players' audible accepted events continue.

### Requirement: Useful initialization failure
Unsupported graphics or initialization failure SHALL produce a readable recovery message instead of a blank game surface.

#### Scenario: Unsupported browser
- **WHEN** required graphics capabilities are unavailable
- **THEN** the page explains the requirement and offers a retry or supported-browser direction.
