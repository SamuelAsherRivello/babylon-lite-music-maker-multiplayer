# Spec Delta

## ADDED Requirements

### Requirement: New-project layout and game decisions are in the checklist
The template usage checklist SHALL require every new app or game project to choose one portrait or landscape orientation, remove orientation switching, and implement only that orientation. For games, it SHALL also direct the agent to resolve renderer, rendering policy, viewport/gutter use, scrolling, and optional audio controls before declaring the game ready.

#### Scenario: Checklist is used for an app or game
- **WHEN** an agent follows the template usage checklist to create an app or game
- **THEN** it selects one orientation and removes the orientation switch, and for games it follows the game integration guidance and reports relevant choices and checks
