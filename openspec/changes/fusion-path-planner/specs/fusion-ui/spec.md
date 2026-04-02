# Fusion UI Spec

## ADDED Requirements

### Requirement: Target Persona Selection
The system SHALL allow users to select a target Persona from a searchable dropdown list.

#### Scenario: Search and select
- **WHEN** user types "撒旦" in the search input
- **THEN** display matching Personas in the dropdown
- **WHEN** user selects "撒旦"
- **THEN** show the Persona in the selected state

### Requirement: Skill Filter
The system SHALL allow users to filter paths by required skill.

#### Scenario: Select skill requirement
- **WHEN** user clicks "选择技能" button
- **THEN** display a list of all available skills
- **WHEN** user selects "胜利的炮火"
- **THEN** show the selected skill as a filter badge

### Requirement: Trait Filter
The system SHALL allow users to filter paths by required trait.

#### Scenario: Select trait requirement
- **WHEN** user clicks "选择特性" button
- **THEN** display a list of all available traits
- **WHEN** user selects "最终射击"
- **THEN** show the selected trait as a filter badge

### Requirement: Path Results Display
The system SHALL display fusion paths in a ranked list.

#### Scenario: Display paths
- **WHEN** fusion calculation completes
- **THEN** display up to 10 paths sorted by price (lowest first)
- **THEN** each path shows the sequence of fusions
- **THEN** each path shows total price

#### Scenario: Empty results
- **WHEN** no paths are found
- **THEN** display "未找到合成路径" message

### Requirement: Path Details
The system SHALL show detailed information when a path is expanded.

#### Scenario: Expand path
- **WHEN** user clicks on a path card
- **THEN** expand to show all fusion steps
- **THEN** each step shows the two source Personas and the result
