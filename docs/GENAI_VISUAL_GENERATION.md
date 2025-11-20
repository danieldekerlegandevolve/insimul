# GenAI Visual Generation System

## Overview

The GenAI Visual Generation system allows you to procedurally generate visual assets for your worlds using AI image generation. This includes:

- **Authorial Content**: Character portraits, building images, maps
- **Procedural Assets**: Textures and materials for 3D games
- **World Building**: Visual elements that enhance storytelling and immersion

## Features

### Asset Types

1. **Character Assets**
   - `character_portrait`: Profile/portrait images for UI and character sheets
   - `character_full_body`: Full-body character illustrations
   - `character_sprite`: Animated sprite sheets for 2D games
     - Supported animations: idle (4 frames), walk (8 frames), run (8 frames), jump (6 frames), attack (6 frames)
     - View angles: side, front, back, top-down, isometric
     - Automatically sized for frame-based animation
     - Transparent backgrounds for game integration

2. **Building Assets**
   - `building_exterior`: Building facade/exterior views
   - `building_interior`: Interior room views
   - `building_icon`: Simplified building icons

3. **Map Assets**
   - `map_terrain`: Terrain/geographical maps
   - `map_political`: Political boundary maps
   - `map_region`: Regional overview maps

4. **Texture Assets**
   - `texture_ground`: Ground/floor textures
   - `texture_wall`: Wall textures
   - `texture_material`: Material textures (wood, stone, metal, etc.)

5. **Artifact Assets**
   - `artifact_image`: Visual representations of in-game artifacts
   - Supported types: photographs, gravestones, wedding rings, letters, heirlooms, diaries, documents, paintings, books
   - Generates historically appropriate imagery based on artifact type and description
   - Integrates with Talk of the Town artifact system

6. **Other Assets**
   - `item_icon`, `item_image`: Item and inventory images
   - `landscape`: Landscape scenes
   - `skybox`: Skybox textures for 3D environments

### Supported Providers

The system supports multiple AI image generation providers:

1. **Flux** (via Replicate) - Default, high quality
   - Models: Flux Schnell, Flux Pro, Flux 1.1 Pro
   - Best for: General purpose, fast generation

2. **Stable Diffusion** (via Replicate)
   - Models: SDXL
   - Best for: Customizable, open-source

3. **DALL-E** (via OpenAI)
   - Models: DALL-E 2, DALL-E 3
   - Best for: High quality, coherent images

4. **Gemini Imagen** (Future)
   - Currently generates enhanced prompts for use with other providers

## Setup

### 1. Install Dependencies

All required dependencies are already included in the project's `package.json`.

### 2. Configure API Keys

Add your API keys to `.env`:

```bash
# For Flux and Stable Diffusion
REPLICATE_API_KEY=your_replicate_api_key_here

# For DALL-E
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API keys:
- **Replicate**: https://replicate.com/account/api-tokens
- **OpenAI**: https://platform.openai.com/api-keys

### 3. Create Assets Directory

The system automatically creates the directory, but you can create it manually:

```bash
mkdir -p client/public/assets/generated
```

## API Reference

### Check Available Providers

```http
GET /api/assets/providers
```

Returns list of configured providers.

### Generate Character Portrait

```http
POST /api/characters/:characterId/generate-portrait
Content-Type: application/json

{
  "provider": "flux",
  "params": {
    "quality": "high",
    "width": 512,
    "height": 512
  }
}
```

### Generate Building Exterior

```http
POST /api/businesses/:businessId/generate-exterior
Content-Type: application/json

{
  "provider": "flux",
  "params": {
    "quality": "high"
  }
}
```

### Generate Settlement Map

```http
POST /api/settlements/:settlementId/generate-map
Content-Type: application/json

{
  "mapType": "terrain",
  "provider": "flux",
  "params": {
    "quality": "high",
    "width": 1024,
    "height": 768
  }
}
```

### Generate Texture

```http
POST /api/worlds/:worldId/generate-texture
Content-Type: application/json

{
  "textureType": "ground",
  "material": "cobblestone",
  "style": "medieval",
  "provider": "flux",
  "params": {
    "quality": "high",
    "width": 1024,
    "height": 1024
  }
}
```

### Generate Character Sprite

```http
POST /api/characters/:characterId/generate-sprite
Content-Type: application/json

{
  "animationType": "walk",
  "viewAngle": "side",
  "frameCount": 8,
  "provider": "flux",
  "params": {
    "quality": "high"
  }
}
```

**Animation Types**: `idle`, `walk`, `run`, `jump`, `attack`

**View Angles**: `side`, `front`, `back`, `top-down`, `isometric`

### Generate All Character Sprites

```http
POST /api/characters/:characterId/generate-all-sprites
Content-Type: application/json

{
  "viewAngle": "side",
  "provider": "flux",
  "params": {
    "quality": "high"
  }
}
```

Generates all 5 animation types (idle, walk, run, jump, attack) for the specified view angle.

### Generate Artifact Image

```http
POST /api/worlds/:worldId/artifacts/:artifactId/generate-image
Content-Type: application/json

{
  "provider": "flux",
  "params": {
    "quality": "high",
    "width": 768,
    "height": 768
  }
}
```

### Batch Generate Character Portraits

```http
POST /api/worlds/:worldId/batch-generate-portraits
Content-Type: application/json

{
  "provider": "flux",
  "params": {
    "quality": "standard"
  }
}
```

### Batch Generate Artifact Images

```http
POST /api/worlds/:worldId/batch-generate-artifacts
Content-Type: application/json

{
  "provider": "flux",
  "params": {
    "quality": "high"
  }
}
```

### Get All Artifacts

```http
GET /api/worlds/:worldId/artifacts
```

Returns all artifacts in the world with their metadata.

### Get Visual Assets

```http
# Get all assets for a world
GET /api/worlds/:worldId/assets

# Get assets by type
GET /api/worlds/:worldId/assets?assetType=character_portrait

# Get assets for a specific entity
GET /api/assets/:entityType/:entityId

# Get specific asset
GET /api/assets/:id
```

### Generation Jobs

```http
# Get generation jobs for a world
GET /api/worlds/:worldId/generation-jobs

# Get jobs by status
GET /api/worlds/:worldId/generation-jobs?status=processing

# Get specific job
GET /api/generation-jobs/:jobId
```

### Asset Collections

```http
# Get collections for a world
GET /api/worlds/:worldId/asset-collections

# Create collection
POST /api/asset-collections

# Update collection
PATCH /api/asset-collections/:id
```

## Usage Examples

### Example 1: Generate Portrait for Existing Character

```typescript
// Frontend code
const generatePortrait = async (characterId: string) => {
  const response = await fetch(
    `/api/characters/${characterId}/generate-portrait`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'flux',
        params: {
          quality: 'high',
          width: 512,
          height: 512
        }
      })
    }
  );

  const asset = await response.json();
  console.log('Generated asset:', asset);

  // Asset is now available at asset.filePath
  const imageUrl = `/${asset.filePath}`;
  return imageUrl;
};
```

### Example 2: Generate Map for Settlement

```typescript
const generateMap = async (settlementId: string) => {
  const response = await fetch(
    `/api/settlements/${settlementId}/generate-map`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapType: 'terrain',
        provider: 'flux',
        params: {
          quality: 'high',
          style: 'fantasy map, aged parchment'
        }
      })
    }
  );

  return await response.json();
};
```

### Example 3: Generate Textures for 3D Game

```typescript
const generateTextures = async (worldId: string) => {
  const materials = [
    { type: 'ground', material: 'grass', style: 'realistic' },
    { type: 'ground', material: 'stone', style: 'medieval' },
    { type: 'wall', material: 'brick', style: 'weathered' },
  ];

  const textures = await Promise.all(
    materials.map(({ type, material, style }) =>
      fetch(`/api/worlds/${worldId}/generate-texture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textureType: type,
          material,
          style,
          provider: 'flux'
        })
      }).then(r => r.json())
    )
  );

  return textures;
};
```

## Prompt Engineering

The system automatically generates detailed prompts based on entity data:

### Character Portraits

The system considers:
- Gender and physical traits
- Personality (Big Five traits)
- Occupation
- World setting/theme
- Age and social status

### Building Exteriors

The system considers:
- Business type
- Settlement era (medieval, Victorian, modern, etc.)
- Terrain and environment
- Architectural style
- Business name and character

### Maps

The system considers:
- Settlement type (city, town, village)
- Terrain features
- Historical period
- Political boundaries
- Geographical features

### Textures

The system generates seamless, tileable textures optimized for:
- 3D game engines
- PBR (Physically Based Rendering) workflows
- Seamless repetition

## Advanced Usage

### Custom Prompts

You can override the automatic prompt generation:

```typescript
const params = {
  prompt: "A custom prompt describing exactly what you want",
  negativePrompt: "Things to avoid in the generation",
  width: 1024,
  height: 1024,
  quality: 'ultra'
};
```

### Quality Levels

- `standard`: Fast, lower resolution
- `high`: Balanced quality and speed
- `ultra`: Highest quality, slower generation

### Asset Versioning

Assets support versioning and variants:

```typescript
const asset = {
  parentAssetId: 'original-asset-id',
  version: 2,
  variants: ['variant-1-id', 'variant-2-id']
};
```

### Asset Collections

Group related assets:

```typescript
const collection = {
  worldId: 'world-id',
  name: 'Medieval Texture Pack',
  collectionType: 'texture_pack',
  assetIds: ['texture-1', 'texture-2', 'texture-3'],
  purpose: 'medieval_environment',
  tags: ['medieval', 'stone', 'wood']
};
```

## Database Schema

### Visual Assets

- `id`: Unique identifier
- `worldId`: Associated world
- `name`, `description`: Asset metadata
- `assetType`: Type of asset
- `characterId`, `businessId`, `settlementId`, etc.: Associated entities
- `filePath`, `fileName`: File location
- `generationProvider`: Which AI provider was used
- `generationPrompt`: The prompt used
- `status`: Generation status
- `tags`: Searchable tags

### Generation Jobs

Tracks ongoing and completed generation tasks:

- `jobType`: single_asset, batch_generation, texture_set
- `status`: queued, processing, completed, failed
- `progress`: 0.0 to 1.0
- `generatedAssetIds`: IDs of generated assets

### Asset Collections

Group and organize assets:

- `collectionType`: texture_pack, character_set, building_set, map_atlas
- `assetIds`: Array of asset IDs
- `purpose`: Descriptive purpose

## Cost Considerations

Different providers have different pricing:

- **Replicate/Flux**: ~$0.003-0.01 per image
- **Stable Diffusion**: ~$0.002-0.005 per image
- **DALL-E 3**: ~$0.04-0.08 per image (higher quality)

Batch operations are more cost-effective. Consider:

1. Generate assets during world creation, not runtime
2. Use lower quality for testing, high quality for final assets
3. Cache and reuse assets when possible
4. Use asset collections to organize reusable assets

## Troubleshooting

### Provider Not Available

Check that the API key is set in your `.env` file:

```bash
echo $REPLICATE_API_KEY
```

### Generation Fails

1. Check the generation job status
2. Review error messages in the job
3. Verify API key validity
4. Check provider API status

### Images Not Displaying

1. Verify the asset was created in database
2. Check that file exists at `client/public/assets/generated/`
3. Ensure proper file permissions
4. Check browser console for 404 errors

## Future Enhancements

- [ ] Real-time generation progress via WebSockets
- [ ] Image editing and variation generation
- [ ] Style transfer and consistency
- [ ] Upscaling and enhancement
- [ ] Custom LoRA model support
- [ ] Batch optimization and queuing
- [ ] Asset thumbnail generation
- [ ] CDN integration for asset delivery
