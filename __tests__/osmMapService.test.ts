import {OSM_CONFIG, OSM_MAP_STYLE} from '../src/services/osmMapService';

describe('osmMapService', () => {
  it('uses one compliant OSM tile endpoint with visible attribution', () => {
    expect(OSM_CONFIG.tileUrl).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(OSM_CONFIG.attribution).toBe('© OpenStreetMap contributors');
    expect(OSM_CONFIG.userAgent).toContain('CaWalk-Android');
  });

  it('configures public OSM services explicitly, including an actual foot graph backend', () => {
    expect(OSM_CONFIG.overpassUrl).toBe('https://overpass-api.de/api/interpreter');
    expect(OSM_CONFIG.nominatimUrl).toBe('https://nominatim.openstreetmap.org');
    expect(OSM_CONFIG.footRoutingUrl).toBe(
      'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
    );
    expect(OSM_CONFIG.requestTimeoutMs).toBe(12000);
    expect(OSM_CONFIG.cacheTtlMs).toBe(10 * 60 * 1000);
    expect(OSM_CONFIG.routeMinimumIntervalMs).toBe(1000);
  });

  it('generates a valid MapLibre raster style JSON with one source tile', () => {
    const parsed = JSON.parse(OSM_MAP_STYLE);
    expect(parsed.version).toBe(8);
    expect(parsed.sources['osm-tiles'].type).toBe('raster');
    expect(parsed.sources['osm-tiles'].tiles).toEqual([OSM_CONFIG.tileUrl]);
    expect(parsed.layers[0].id).toBe('osm-tiles-layer');
  });
});
