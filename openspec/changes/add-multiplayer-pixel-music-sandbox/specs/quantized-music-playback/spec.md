# Quantized Music Playback

## Purpose

Provide responsive next-step local music and fixed three-second remote playback on an endlessly repeating eight-step clock with unambiguous event identity.

## ADDED Requirements

### Requirement: Continuous eight-step clock
The musical clock SHALL start when the host creates the room, advance every 500 ms, and cycle through eight steps every four seconds without a programmed end. Each active local step SHALL have a short beep and visible pulse when local audio is enabled.

#### Scenario: Solo host starts
- **WHEN** the host creates a room with audio active
- **THEN** the first cycle begins without waiting for guests, successive steps occur 500 ms apart, and step 8 wraps to step 1.

#### Scenario: Late join
- **WHEN** a guest joins an already running room
- **THEN** they synchronize to its current timing rather than restart the clock for anyone.

### Requirement: Four one-shot instruments
Every player SHALL have kick, snare, hi-hat and synth-tone inputs. A tap SHALL target the very next step and play its local sound once without waiting for a network acknowledgement. Input at a step boundary SHALL target the following step.

#### Scenario: Tap between steps
- **WHEN** a player taps kick between two boundaries
- **THEN** their kick starts at the next boundary and does not repeat in subsequent cycles.

#### Scenario: Boundary tap
- **WHEN** a tap occurs exactly at a boundary
- **THEN** it targets the next boundary, 500 ms later, rather than a boundary already occurring.

### Requirement: Distinct-sound step batching
The system SHALL play each distinct sound at most once per origin player per target step. Different sound inputs SHALL combine on that step, while different players' same-instrument inputs SHALL remain independent.

#### Scenario: Repeated and mixed taps
- **WHEN** one player taps kick three times and snare once before the same boundary
- **THEN** that player's next step contains one kick and one snare.

#### Scenario: Two players choose kick
- **WHEN** two players independently queue kick for a step
- **THEN** the event ledger retains both origins rather than collapsing them into one event.

### Requirement: Fixed remote event delay
Every remote listener, including a host listening to a guest, SHALL target an accepted event exactly 3,000 ms after its originating step deadline. The origin SHALL hear it only locally at that original deadline. Delay SHALL NOT accumulate per hop or restart on receipt.

#### Scenario: Host-origin event
- **WHEN** a host's accepted kick has originating deadline 1,500 ms into the session
- **THEN** the host targets 1,500 ms and every guest targets 4,500 ms for that event.

#### Scenario: Guest-origin event
- **WHEN** a guest's accepted snare has originating deadline 2,000 ms into the session
- **THEN** that guest targets 2,000 ms while the host and other guests target 5,000 ms.

#### Scenario: Variable packet arrival
- **WHEN** copies of an event arrive at remote listeners at different times before the scheduling deadline
- **THEN** they still target the same original deadline plus 3,000 ms rather than arrival time plus 3,000 ms.

### Requirement: Cycle-safe event identity
The system SHALL distinguish room epochs, origins and absolute steps, suppress duplicate delivery and origin echoes, and bound retained event history.

#### Scenario: Duplicate after wrap
- **WHEN** a commit is delivered twice and another valid event uses the same numbered circle in the following cycle
- **THEN** the duplicate is silent and the later-cycle event still plays once.

#### Scenario: New room epoch
- **WHEN** a new session starts after a previous room ended
- **THEN** pending events from the old epoch cannot play in the new session.

### Requirement: Stale event recovery
The system SHALL drop remote events that arrive after their playback deadline, surface late-event status, and never shift them to another step. Resuming or joining SHALL schedule only events whose listener-specific deadlines remain in the future.

#### Scenario: Delay exceeds buffer
- **WHEN** a remote event arrives after its original deadline plus three seconds
- **THEN** it is dropped with visible late-event status and no immediate or next-cycle catch-up sound.

#### Scenario: Resume audio
- **WHEN** suspended audio resumes after several elapsed steps
- **THEN** the current clock is restored and no burst of expired beeps or notes plays.

### Requirement: Measurable foreground timing
For foreground clients under up to 250 ms one-way injected delay plus up to 100 ms additional jitter per leg, accepted events delivered before scheduling cutoff SHALL start within 25 ms of their mapped audio-clock targets. Local playback SHALL remain next-step regardless of this network delay.

#### Scenario: Two-client jitter test
- **WHEN** two independent foreground clients exchange host- and guest-origin sounds for ten cycles under the defined delay profile
- **THEN** instrumented audio starts meet the timing bound, remote logical targets equal source deadlines plus 3,000 ms, and no accepted event duplicates or changes steps.
