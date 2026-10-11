# Music Room Session

## Purpose

Let up to four anonymous players share a private host-simulated music session through a bounded relay while preserving other games' multiplayer contracts.

## ADDED Requirements

### Requirement: Private coded admission
The system SHALL offer create and join flows with a shareable room code/link, admit at most four connected players, and allow the creator to participate alone.

#### Scenario: Create and invite
- **WHEN** a player creates a music room
- **THEN** they become its host, receive a shareable code/link, and enter the running session without a ready-up requirement.

#### Scenario: Join through link
- **WHEN** another player opens a valid room link with capacity available
- **THEN** they join that existing room and receive its current roster and timing state.

#### Scenario: Full or expired room
- **WHEN** a fifth player joins a full room or a player supplies an expired code
- **THEN** they see the appropriate error and a usable retry/create path without silently entering a different room.

### Requirement: Server-assigned roster
The relay SHALL assign each admitted player a number from 1 through 4, a generated fictional name, and a distinct active color. Connected players SHALL retain their assigned numbers when another player departs.

#### Scenario: Two people join
- **WHEN** two players share a room
- **THEN** both rosters display matching server-assigned numbers, names, colors and host identity.

#### Scenario: Guest departs and a new guest joins
- **WHEN** a guest seat is freed and another guest joins while the host remains connected
- **THEN** existing players keep their numbers and the new guest receives an available number with a server-generated identity.

### Requirement: Host simulation through relay
The host browser SHALL own the musical session clock and accepted-event ledger. The server SHALL relay bounded inputs and host outputs, enforce message ownership and host-only publishing, and SHALL NOT simulate musical progression.

#### Scenario: Guest sends a sound
- **WHEN** a guest submits a valid next-step sound intent
- **THEN** the relay attaches its authenticated origin and forwards it to the host for acceptance and distribution.

#### Scenario: Forged publication
- **WHEN** a guest claims another origin or attempts to publish host state
- **THEN** the relay rejects that unauthorized operation and other players' state remains unchanged.

### Requirement: Isolated additive protocol
Music room traffic SHALL be isolated from other rooms and games. Adding music support SHALL preserve existing games' message contracts and admission behavior.

#### Scenario: Parallel rooms
- **WHEN** two music rooms and an existing game are active
- **THEN** music intents and commits reach only their intended room and the existing game's normal actions still work.

### Requirement: Host loss ends the session
The system SHALL end the session when the host leaves or loses connection, cancel queued audio, show Host disconnected and offer create/join again. It SHALL NOT migrate hosting or reserve a host reconnect grace period.

#### Scenario: Host leaves or disconnects
- **WHEN** host connection loss is detected by transport or liveness checks
- **THEN** the relay ends the session and guests stop playback, discard queued events and can create or join a new room.

### Requirement: Guest connection recovery
The client SHALL show connecting, connected, full, retrying and unavailable states as applicable. A disconnected guest SHALL stop submitting musical inputs and discard stale audio before resynchronizing with a still-active host. The client SHALL NOT claim persistent identity or uninterrupted recovery after room loss.

#### Scenario: Guest reconnects
- **WHEN** a guest reconnects to a room whose host remains active
- **THEN** they obtain fresh current timing and pending events, without replaying expired sounds or duplicating prior events.

#### Scenario: Room no longer exists
- **WHEN** the backend reports room loss after a process restart
- **THEN** the client explains the unavailable session and offers a new room path instead of presenting an offline simulation as online play.
