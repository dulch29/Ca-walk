# Tasks: Real Map, Activity Recording, and Story Handoff

## Phase 1: OSM Map Foundation & Transparent State
- [x] 1.1 Create map config service (`src/services/osmMapService.ts`) with single OSM tile endpoint, attribution, and policy compliance
- [x] 1.2 Update `src/screens/MapScreen.tsx` with single tile endpoint, visible OSM attribution, and clean loading/error/offline states (no fake GPS fallback)
- [x] 1.3 Update `src/screens/RecordScreen.tsx` with single tile endpoint, visible attribution, and remove Bangkok fake GPS fallback

## Checkpoint: Phase 1
- [x] MapLibre loads single OSM tile endpoint
- [x] Visible attribution on both map screens
- [x] No fake Bangkok coordinates used when GPS is pending

## Phase 2: OSM Geocoding & Route Preview
- [x] 2.1 Implement OSM Geocoding & Routing services (`src/services/osmLocationService.ts`) with Nominatim search & OSRM walking routes, error handling, and rate limiting
- [x] 2.2 Add real place search UI & destination selection in `MapScreen.tsx`
- [x] 2.3 Implement route preview & "ไปกันเลย" button on `MapScreen.tsx` to launch Record with destination and route

## Checkpoint: Phase 2
- [x] Search places returns real OSM locations
- [x] Selecting destination draws walking route preview
- [x] "ไปกันเลย" transitions cleanly to Record with destination details

## Phase 3: GPS & Activity Tracker (Start, Pause, Resume, Finish)
- [x] 3.1 Update `src/context/AppContext.tsx` with full session lifecycle (`pauseRunSession`, `resumeRunSession`, active duration, GPS filtering, track history)
- [x] 3.2 Update `src/screens/RecordScreen.tsx` to eliminate mock stats, separate route preview from actual GPS track, and properly trigger start/pause/resume/finish
- [x] 3.3 Ensure Android permissions, GPS off/denied states, and lifecycle changes are handled safely without crash

## Checkpoint: Phase 3
- [x] Start begins session, Pause halts timer & distance, Resume continues, Finish records summary
- [x] Real GPS track rendered separately from destination route preview
- [x] Steps from accelerometer, distance from validated GPS fixes

## Phase 4: Activity Photos & 4-Page Story with Real Cat Images
- [x] 4.1 Connect camera captures to active session and ensure photo URIs persist for the story
- [x] 4.2 Replace `CatAvatar` in `RecordStoryScreen.tsx` with genuine cat photos from `Assests/Cat/Photo`
- [x] 4.3 Update all 4 Story slides with real session stats, selected destination, user photos, and native share sheet

## Checkpoint: Phase 4
- [x] 4 Story pages render real activity data
- [x] Cat photos from `Assests/Cat/Photo` displayed
- [x] Captured camera photos displayed and shareable

## Phase 5: Regression Check, Automated Tests & Android Verification
- [x] 5.1 Unit tests for geocoding, routing, GPS filtering, and pause/resume session logic
- [x] 5.2 Verify mock coupon and merchant flows remain intact without regression
- [x] 5.3 Run `npx tsc --noEmit`, `npm run lint`, `npm test`, and update graphify knowledge graph

## Phase 6: Record Location Permission on Open & Nearest Branch Search
- [x] 6.1 Request location permission on entering RecordScreen and start watching location to show user position immediately
- [x] 6.2 Update `AppContext.tsx` with location acquisition function so user location is available upon screen focus
- [x] 6.3 Update `searchPlaces` in `src/services/osmLocationService.ts` to accept `userCoords?: [number, number]` for viewbox bias and distance calculation
- [x] 6.4 Update search in `src/screens/MapScreen.tsx` to sort both partner stores and geocoded places by distance to user, displaying the closest branch first
- [x] 6.5 Update tests and verify with `tsc`, `lint`, and `jest`
