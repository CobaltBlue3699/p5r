# Fusion Path Finding Spec

## ADDED Requirements

### Requirement: Fusion Matrix Lookup
The system SHALL provide a function to look up the resulting Arcana when fusing two Arcana types.

#### Scenario: Standard fusion
- **WHEN** calling `calculateFusionResult('愚者', '魔术师')`
- **THEN** return `{ arcana: '死神', level: 2 }`

#### Scenario: Same Arcana fusion
- **WHEN** calling `calculateFusionResult('愚者', '愚者')`
- **THEN** return `{ arcana: '愚者', level: 1 }`

#### Scenario: Invalid combination
- **WHEN** calling `calculateFusionResult('死神', '顾问官')`
- **THEN** return `{ arcana: null, level: 0 }` (no result)

### Requirement: Fusion Path Search
The system SHALL find all possible fusion paths from available Personas to a target Persona.

#### Scenario: Find paths to target
- **WHEN** calling `findFusionPaths('撒旦', { maxDepth: 5 })`
- **THEN** return an array of paths, each containing a sequence of Personas

#### Scenario: Filter by skill requirement
- **WHEN** calling `findFusionPaths('撒旦', { requiredSkill: '胜利的炮火' })`
- **THEN** return only paths where the target Persona has the required skill

#### Scenario: Filter by trait requirement
- **WHEN** calling `findFusionPaths('撒旦', { requiredTrait: '最终射击' })`
- **THEN** return only paths where the target Persona has the required trait

### Requirement: Price Calculation
The system SHALL calculate the total fusion price for a given path.

#### Scenario: Basic price calculation
- **WHEN** calling `calculateFusionPrice([personaA, personaB])`
- **THEN** return `(personaA.level + personaB.level) * 10`

#### Scenario: Price with treasure demon
- **WHEN** calling `calculateFusionPrice([personaA, personaB], '摄政王')`
- **THEN** return `(personaA.level + personaB.level) * 10 + treasureModifier`
