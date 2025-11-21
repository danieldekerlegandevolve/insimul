import { CulturalContext, ConlangConfig } from '@/types/language';

export class CulturalContextGenerator {
  private config: ConlangConfig;

  constructor(config: ConlangConfig) {
    this.config = config;
  }

  generate(): CulturalContext {
    const regionData = this.selectRegion();
    
    return {
      region: regionData.name,
      speakers: this.generateSpeakerCount(),
      status: 'constructed',
      geographicalFeatures: regionData.features,
      socialStructure: this.selectSocialStructure(),
      historicalPeriod: this.selectHistoricalPeriod(),
      culturalNotes: this.generateCulturalNotes(regionData.index),
    };
  }

  private selectRegion() {
    const regions = [
      { name: 'Northern Highlands', features: ['snow-capped peaks', 'alpine meadows', 'glacial lakes', 'mountain passes'] },
      { name: 'Coastal Archipelago', features: ['coral atolls', 'deep harbors', 'tidal channels', 'sea caves'] },
      { name: 'Desert Oasis Network', features: ['underground springs', 'salt flats', 'sandstone cliffs', 'palm groves'] },
      { name: 'Forest River Valleys', features: ['ancient forests', 'cascading waterfalls', 'limestone caves', 'fertile valleys'] },
      { name: 'Volcanic Island Chain', features: ['active volcanoes', 'hot springs', 'black sand beaches', 'lava tubes'] },
      { name: 'Great River Delta', features: ['wetlands', 'mangrove forests', 'river channels', 'fertile floodplains'] },
      { name: 'Nomadic Steppes', features: ['endless grasslands', 'seasonal lakes', 'ancient burial mounds', 'migration routes'] },
      { name: 'Mountain Lake Region', features: ['crystal clear lakes', 'pine forests', 'granite peaks', 'hidden valleys'] },
      { name: 'Tropical Rainforest', features: ['dense canopy', 'river systems', 'exotic wildlife', 'medicinal plants'] },
      { name: 'Arctic Tundra', features: ['permafrost', 'aurora displays', 'ice formations', 'hardy vegetation'] },
      { name: 'Mediterranean Coast', features: ['olive groves', 'rocky coastlines', 'ancient ruins', 'terraced hillsides'] },
      { name: 'Inland Sea Basin', features: ['salt water', 'fishing grounds', 'reed beds', 'migratory bird routes'] }
    ];
    
    const index = Math.floor(Math.random() * regions.length);
    return { ...regions[index], index };
  }

  private generateSpeakerCount(): number {
    const ranges = {
      auxiliary: { min: 1000000, max: 50000000 },
      fictional: { min: 100000, max: 10000000 },
      experimental: { min: 1000, max: 100000 },
      artistic: { min: 10000, max: 1000000 }
    };
    
    const range = ranges[this.config.purpose];
    return Math.floor(Math.random() * (range.max - range.min)) + range.min;
  }

  private selectSocialStructure(): string {
    const structures = [
      'Clan-based confederation with rotating leadership',
      'Maritime trading guilds with elected councils',
      'Scholarly monasteries preserving ancient knowledge',
      'Nomadic tribes following seasonal migration patterns',
      'Agricultural communes with collective decision-making',
      'Artisan castes with hereditary specializations',
      'Warrior societies with merit-based advancement',
      'Merchant republics with commercial law codes',
      'Theocratic councils guided by religious principles',
      'Democratic assemblies with citizen participation'
    ];
    
    return structures[Math.floor(Math.random() * structures.length)];
  }

  private selectHistoricalPeriod(): string {
    const periods = [
      'Proto-Classical Period (800-500 BCE)',
      'Classical Flowering (500 BCE - 200 CE)',
      'Imperial Expansion (200-600 CE)',
      'Medieval Synthesis (600-1000 CE)',
      'Renaissance Revival (1000-1400 CE)',
      'Colonial Encounter (1400-1700 CE)',
      'Modern Standardization (1700-1900 CE)',
      'Contemporary Globalization (1900-present)',
      'Digital Age Adaptation (2000-present)'
    ];
    
    return periods[Math.floor(Math.random() * periods.length)];
  }

  private generateCulturalNotes(regionIndex: number): string[] {
    const baseNotes = [
      'Rich oral tradition with epic poetry cycles',
      'Sophisticated astronomical and mathematical knowledge',
      'Advanced metallurgy and architectural techniques',
      'Complex kinship systems and inheritance laws',
      'Ritualized forms of conflict resolution and diplomacy',
      'Elaborate seasonal festivals marking agricultural cycles',
      'Intricate coming-of-age ceremonies and life transitions',
      'Sacred sites and pilgrimage routes throughout the region',
      'Traditional medicine using indigenous plant knowledge',
      'Distinctive textile patterns with symbolic meanings',
      'Unique musical instruments and performance traditions',
      'Specialized crafts passed down through generations'
    ];
    
    const regionSpecific = [
      ['Mountain climbing traditions', 'Alpine herding practices', 'Stone carving mastery'],
      ['Navigation by stars', 'Pearl diving techniques', 'Boat building expertise'],
      ['Water conservation methods', 'Oasis cultivation', 'Desert survival skills'],
      ['Forest management', 'Herbal medicine', 'Wood carving traditions'],
      ['Volcanic glass tools', 'Thermal cooking methods', 'Seismic prediction lore'],
      ['Flood management', 'Rice cultivation', 'River transportation'],
      ['Horse breeding', 'Portable architecture', 'Weather prediction'],
      ['Lake fishing techniques', 'Ice preservation', 'Mountain rescue traditions'],
      ['Canopy navigation', 'Biodiversity knowledge', 'Sustainable harvesting'],
      ['Ice construction', 'Arctic hunting', 'Survival techniques'],
      ['Olive cultivation', 'Maritime trade', 'Coastal fortification'],
      ['Salt harvesting', 'Aquaculture', 'Wetland management']
    ];
    
    const selected = this.selectRandom(baseNotes, 4);
    if (regionIndex < regionSpecific.length) {
      selected.push(...this.selectRandom(regionSpecific[regionIndex], 2));
    }
    
    return selected;
  }

  private selectRandom<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}