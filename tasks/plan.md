# Implementation Plan: Real Map, Activity Recording, and Story Handoff

## Overview
Implement the requirements from `Docs/real-map-activity-coupons-handoff.md`:
1. Use MapLibre with a single OSM raster tile endpoint, clear visible attribution `© OpenStreetMap contributors`, and clean offline/error states without fake GPS coordinates.
2. OSM-based Geocoding (search places on submit) and Walking Routing (route preview).
3. "ไปกันเลย" (Let's Go!) button passing destination and route preview from MapScreen to RecordScreen.
4. Activity recording with genuine start, pause, resume, and finish lifecycle: accelerometer-based step counting, GPS filtering (speed < 18 km/h, accuracy checks), actual GPS trail rendering (distinct from route preview), active duration excluding pause times.
5. Camera photo capture during activity and 4-page Story generation with genuine session stats, taken photos, and authentic cat images from `Assests/Cat/Photo`.
6. Maintain mock coupons & stores without regressions.
7. Verification with automated tests, lint, TypeScript check, and Android build verification.

## Architecture Decisions
- **Map & Routing**:
  - Single OSM raster tile endpoint: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
  - Geocoding via Nominatim with custom User-Agent and query-on-submit (no keystroke autocomplete spam).
  - Routing via OSRM public walking profile for route preview polyline.
  - Visible OSM attribution overlay on both MapScreen and RecordScreen.
- **Session Lifecycle in AppContext**:
  - Extended `ActiveRunSession` to track `status` (`'idle' | 'recording' | 'paused'`), `trackCoordinates: Array<[number, number]>`, `destination`, and `photos: string[]`.
  - Added `pauseRunSession()` and `resumeRunSession()` to pause and resume the active timer and GPS recording accurately.
  - Filter GPS fixes (accuracy threshold < 35m, maximum speed 18 km/h) before appending to distance. Steps remain an independent accelerometer metric.
- **Story & Assets**:
  - Used real cat photos from `Assests/Cat/Photo` (`jump`, `walk`, `clean`, `lick`) instead of SVG placeholder avatars.
  - Displayed actual session data (steps, distance, pace, duration, destination) on all 4 story slides.
  - Enabled native sharing via `react-native-share` with graceful error catching.

## Task List

### Phase 1: OSM Map Foundation & Transparent State
- [x] 1.1 Create map config service (`src/services/osmMapService.ts`) with single OSM tile endpoint, attribution, and policy compliance
- [x] 1.2 Update `src/screens/MapScreen.tsx` with single tile endpoint, visible OSM attribution, and clean loading/error/offline states (no fake GPS fallback)
- [x] 1.3 Update `src/screens/RecordScreen.tsx` with single tile endpoint, visible attribution, and remove Bangkok fake GPS fallback

### Phase 2: OSM Geocoding & Route Preview
- [x] 2.1 Implement OSM Geocoding & Routing services (`src/services/osmLocationService.ts`) with Nominatim search & OSRM walking routes, error handling, and rate limiting
- [x] 2.2 Add real place search UI & destination selection in `MapScreen.tsx`
- [x] 2.3 Implement route preview & "ไปกันเลย" button on `MapScreen.tsx` to launch Record with destination and route

### Phase 3: GPS & Activity Tracker (Start, Pause, Resume, Finish)
- [x] 3.1 Update `src/context/AppContext.tsx` with full session lifecycle (`pauseRunSession`, `resumeRunSession`, active duration, GPS filtering, track history)
- [x] 3.2 Update `src/screens/RecordScreen.tsx` to eliminate mock stats, separate route preview from actual GPS track, and properly trigger start/pause/resume/finish
- [x] 3.3 Ensure Android permissions, GPS off/denied states, and lifecycle changes are handled safely without crash

### Phase 4: Activity Photos & 4-Page Story with Real Cat Images
- [x] 4.1 Connect camera captures to active session and ensure photo URIs persist for the story
- [x] 4.2 Replace `CatAvatar` in `RecordStoryScreen.tsx` with genuine cat photos from `Assests/Cat/Photo`
- [x] 4.3 Update all 4 Story slides with real session stats, selected destination, user photos, and native share sheet

### Phase 5: Regression Check, Automated Tests & Android Verification
- [x] 5.1 Unit tests for geocoding, routing, GPS filtering, and pause/resume session logic
- [x] 5.2 Verify mock coupon and merchant flows remain intact without regression
- [x] 5.3 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and update graphify knowledge graph
