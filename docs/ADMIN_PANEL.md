# Admin Panel

## Overview
The Admin Panel provides a comprehensive view of all database records across all worlds in the Insimul system. It's designed for debugging, data inspection, and system administration.

## Access
Click the **"Admin Panel"** button in the top-right corner of the home screen (World Selection Screen).

## Features

### Dashboard Summary
Quick statistics showing total counts:
- Worlds
- Countries  
- Settlements
- Characters

### Entity Browser
Browse and view detailed data for all entity types:

#### Worlds Tab
View all worlds with their configurations and metadata.

#### Geography Tab
- **Countries** - All nation-states across all worlds
- **States** - Regional subdivisions within countries
- **Settlements** - Cities, towns, and villages

#### Characters Tab
View all characters with their full data including:
- Names and demographics
- Personality traits
- Relationships
- Social attributes
- Kismet data (impulses, volitions, relationships)

#### Rules & Actions Tab
- **Rules** - All game rules (Insimul, Kismet, Ensemble, TOTT)
- **Actions** - Available character actions

#### Content Tab
- **Quests** - Quest definitions and storylines
- **Truths** - Historical facts and character secrets

### Entity Details Panel
Click any entity to view:
- Full JSON representation of the entity
- All fields and nested data
- World association (which world the entity belongs to)

### Features

**Search & Filter**
- Entities are organized by type
- Each entity shows its associated world
- Nested tabs for related entity types (e.g., Countries/States/Settlements)

**Raw Data View**
- Complete JSON dump of selected entities
- All fields visible including internal IDs
- Properly formatted and syntax highlighted

**Live Refresh**
- "Refresh Data" button to reload all data from the database
- Useful when data changes during development/testing

## Use Cases

### Debugging
- Inspect generated entities to verify procedural generation
- Check relationship consistency across characters
- Verify data integrity and references

### Data Analysis
- Count entities across worlds
- Review generated content quality
- Find orphaned or incomplete records

### Development
- Test new features by examining created data
- Verify migrations and schema changes
- Inspect complex nested data structures

### Content Review
- Review AI-generated content (names, truths, quests)
- Check for inappropriate or inconsistent generation
- Verify thematic consistency across worlds

## Technical Details

### Data Loading
The admin panel:
1. Fetches all worlds
2. For each world, fetches all entities (countries, states, settlements, characters, rules, actions, quests, truths)
3. Aggregates and displays the data with world associations

### Performance Considerations
- Loads all data on mount (may be slow with many worlds/entities)
- Considers pagination for very large datasets in future versions
- Uses ScrollArea for long lists

### No Editing
Current version is **read-only**. Entity editing should be done through:
- The main world editor interface
- Direct database queries
- API endpoints

Future versions may add:
- Entity editing capabilities
- Bulk operations
- Data export/import
- Query builder

## Security Note
This admin panel has **no authentication** currently. In a production environment, this should be:
- Protected by authentication middleware
- Restricted to admin users only
- Logged for audit purposes

For now, it's useful for local development and testing.
