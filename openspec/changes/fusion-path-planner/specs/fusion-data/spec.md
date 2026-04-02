# Fusion Data Spec

## ADDED Requirements

### Requirement: Fusion Matrix Data
The system SHALL store the 22x22 Arcana fusion matrix.

#### Scenario: Matrix data structure
- **WHEN** accessing the fusion matrix
- **THEN** return a 2D array where `matrix[arcanaA][arcanaB]` equals the result Arcana

### Requirement: Treasure Demon Modifiers
The system SHALL store level modifiers for each treasure demon.

#### Scenario: Treasure demon data
- **WHEN** accessing treasure demon modifiers
- **THEN** return an object mapping demon names to Arcana-specific modifiers
- **Example**: `{摄政王: {愚者: -1, 魔术师: +1, ...}}`

### Requirement: Persona Index
The system SHALL provide efficient lookup of Personas by Arcana and level.

#### Scenario: Query by Arcana
- **WHEN** calling `getPersonasByArcana('愚者')`
- **THEN** return all Personas with Arcana '愚者' sorted by level

#### Scenario: Query by level range
- **WHEN** calling `getPersonasByLevelRange(1, 10)`
- **THEN** return all Personas with level between 1 and 10

### Requirement: Skill Index
The system SHALL provide reverse lookup from skills to Personas.

#### Scenario: Query Personas by skill
- **WHEN** calling `getPersonasBySkill('胜利的炮火')`
- **THEN** return all Personas that can learn this skill

### Requirement: Trait Index
The system SHALL provide reverse lookup from traits to Personas.

#### Scenario: Query Personas by trait
- **WHEN** calling `getPersonasByTrait('最终射击')`
- **THEN** return all Personas that have this trait
