/**
 * OpenStreetMap (OSM) Map Configuration & Tile Policy Compliance
 *
 * Uses a single public tile endpoint adhering to the OSM Tile Usage Policy:
 * - Single tile endpoint (no spreading across a.tile / b.tile to evade limits)
 * - Required visible attribution: "© OpenStreetMap contributors"
 * - User-Agent identification
 */

export const OSM_CONFIG = {
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  attributionUrl: 'https://www.openstreetmap.org/copyright',
  maxZoom: 19,
  minZoom: 2,
  defaultZoom: 15.5,
  userAgent: 'CaWalk-Android/1.0 (prototype; contact: support@cawalk.app)',
};

/**
 * Standard MapLibre GL style configuration for OpenStreetMap raster tiles
 */
export const OSM_MAP_STYLE = JSON.stringify({
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [OSM_CONFIG.tileUrl],
      tileSize: 256,
      attribution: OSM_CONFIG.attribution,
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: OSM_CONFIG.minZoom,
      maxzoom: OSM_CONFIG.maxZoom,
    },
  ],
});
