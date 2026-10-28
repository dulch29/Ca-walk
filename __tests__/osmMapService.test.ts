import { OSM_CONFIG, OSM_MAP_STYLE } from '../src/services/osmMapService';

describe('osmMapService', () => {
  it('uses a single compliant OSM tile URL endpoint', () => {
    expect(OSM_CONFIG.tileUrl).toBe(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    );
  });

  it('includes required visible attribution', () => {
    expect(OSM_CONFIG.attribution).toBe('© OpenStreetMap contributors');
    expect(OSM_CONFIG.userAgent).toContain('CaWalk-Android');
  });

  it('generates a valid MapLibre raster style JSON with single source tile', () => {
    const parsed = JSON.parse(OSM_MAP_STYLE);
    expect(parsed.version).toBe(8);
    expect(parsed.sources['osm-tiles']).toBeDefined();
    expect(parsed.sources['osm-tiles'].type).toBe('raster');
    expect(parsed.sources['osm-tiles'].tiles).toEqual([OSM_CONFIG.tileUrl]);
    expect(parsed.layers[0].id).toBe('osm-tiles-layer');
  });
});
