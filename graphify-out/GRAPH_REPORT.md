# Graph Report - Ca-walk  (2026-10-25)

## Corpus Check
- Corpus is ~33,566 words - fits in a single context window. You may not need a graph.

## Summary
- 509 nodes · 880 edges · 54 communities (30 shown, 24 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 63 edges (avg confidence: 0.85)
- Token cost: unavailable (agent tool results did not include input/output token usage)

## Community Hubs (Navigation)
- Activity tracking state
- Application navigation routes
- Project dependencies and tools
- Activity recording and sharing
- Firestore data services
- Project planning documents
- Runtime dependency inventory
- Profile and login screens
- Development dependencies
- Mock merchant and coupon data
- Activity history screens
- Cat avatar and wallet UI
- Firebase authentication
- Android app bootstrap
- Coupon wallet flow
- Walking cat sprites
- Android patch script
- Android activity startup
- Jumping cat sprites
- Running cat sprites
- Threat cat sprites
- Camera and story sharing
- Touch cat sprites
- Package scripts
- Settings screen
- Idle cat sprites
- Side idle cat sprites
- Sleeping cat sprites
- Metro bundler config
- TypeScript config
- Cleaning cat sprites
- Licking cat sprites
- Share module integration
- Node runtime version
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Android launcher icon
- Project overview document

## God Nodes (most connected - your core abstractions)
1. `react-native` - 28 edges
2. `react` - 25 edges
3. `CatAvatar()` - 21 edges
4. `colors` - 20 edges
5. `font` - 20 edges
6. `space` - 19 edges
7. `radius` - 19 edges
8. `AppProvider()` - 15 edges
9. `RecordSummaryScreen()` - 10 edges
10. `RecordScreen()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `HomeTab()` --calls--> `HomeScreen()`  [EXTRACTED]
  App.tsx → src/screens/HomeScreen.tsx
- `RecordTab()` --calls--> `RecordScreen()`  [EXTRACTED]
  App.tsx → src/screens/RecordScreen.tsx
- `MissionsRoute()` --calls--> `MissionsScreen()`  [EXTRACTED]
  App.tsx → src/screens/MissionsScreen.tsx
- `RecordSummaryRoute()` --calls--> `RecordSummaryScreen()`  [EXTRACTED]
  App.tsx → src/screens/RecordSummaryScreen.tsx
- `RecordStoryRoute()` --calls--> `RecordStoryScreen()`  [EXTRACTED]
  App.tsx → src/screens/RecordStoryScreen.tsx

## Import Cycles
- None detected.

## Communities (54 total, 24 thin omitted)

### Community 0 - "Activity tracking state"
Cohesion: 0.08
Nodes (45): react-native-geolocation-service, react-native-sensors, ActiveRunSession, AppContext, AppContextValue, AppMode, AppProvider(), cloneCoupons() (+37 more)

### Community 1 - "Application navigation routes"
Cohesion: 0.06
Nodes (42): ActivityDetailRoute(), App(), CouponHistoryRoute(), displayName, GetStarted(), HistoryRoute(), HomeTab(), Login() (+34 more)

### Community 2 - "Project dependencies and tools"
Cohesion: 0.06
Nodes (35): @react-native/typescript-config, name, private, version, @babel/core, @babel/preset-env, @babel/runtime, eslint (+27 more)

### Community 3 - "Activity recording and sharing"
Cohesion: 0.09
Nodes (32): RecordStoryRoute(), RecordSummaryRoute(), RecordTab(), react-native-share, react-native-view-shot, BUBBLE, Ctrl(), CtrlProps (+24 more)

### Community 4 - "Firestore data services"
Cohesion: 0.17
Nodes (24): asRecord(), finiteNumber(), FirestoreCoupon, FirestoreMerchant, FirestoreRecord, FirestoreUserProfile, getUserProfile(), listMerchants() (+16 more)

### Community 5 - "Project planning documents"
Cohesion: 0.09
Nodes (24): Android Build Output, MapLibre Android Kotlin Compilation Tasks, React Native Firebase App and Auth Compilation Tasks, React Native Firebase Firestore Resource and Prebuild Tasks, Android Build Guide, Android SDK Installation and Project Version Checks, Thai Locale ZIP Metadata Build Error, Hybrid Prototype Backend Prompt (+16 more)

### Community 6 - "Runtime dependency inventory"
Cohesion: 0.08
Nodes (24): dependencies, @maplibre/maplibre-react-native, react, react-native, @react-native-firebase/app, @react-native-firebase/auth, @react-native-firebase/firestore, react-native-geolocation-service (+16 more)

### Community 7 - "Profile and login screens"
Cohesion: 0.18
Nodes (16): profile, Props, styles, Props, styles, Props, styles, AVATARS (+8 more)

### Community 8 - "Development dependencies"
Cohesion: 0.10
Nodes (20): devDependencies, @babel/core, @babel/preset-env, @babel/runtime, eslint, jest, prettier, @react-native/babel-preset (+12 more)

### Community 9 - "Mock merchant and coupon data"
Cohesion: 0.13
Nodes (16): coupons, Quest, QuestKind, quests, Store, storeCoupons, stores, FILTERS (+8 more)

### Community 10 - "Activity history screens"
Cohesion: 0.14
Nodes (15): activities, Activity, couponHistory, Props, styles, FILTERS, Props, styles (+7 more)

### Community 11 - "Cat avatar and wallet UI"
Cohesion: 0.19
Nodes (11): react-native, CatMood, GIFS, Props, styles, wallet, Props, styles (+3 more)

### Community 12 - "Firebase authentication"
Cohesion: 0.27
Nodes (10): @react-native-firebase/auth, @react-native-google-signin/google-signin, getCurrentFirebaseUser(), getFirebaseAuth(), signInWithGoogle(), signOutFirebase(), subscribeToAuthState(), authMocks (+2 more)

### Community 14 - "Coupon wallet flow"
Cohesion: 0.25
Nodes (8): CouponsRoute(), Coupon, CouponCard(), Filter, FILTERS, MyCouponsScreen(), Props, styles

### Community 15 - "Walking cat sprites"
Cohesion: 0.22
Nodes (9): Pixel cat walking animation, Pixel cat walk frame 1, Pixel cat walk frame 2, Pixel cat walk frame 3, Pixel cat walk frame 4, Pixel cat walk frame 5, Pixel cat walk frame 6, Pixel cat walk frame 7 (+1 more)

### Community 16 - "Android patch script"
Cohesion: 0.22
Nodes (6): fs, gradleFile, patched, path, source, visionCameraManagers

### Community 18 - "Jumping cat sprites"
Cohesion: 0.25
Nodes (8): Pixel cat jumping animation, Pixel cat jumping frame 1, Pixel cat jumping frame 2, Pixel cat jumping frame 3, Pixel cat jumping frame 4, Pixel cat jumping frame 5, Pixel cat jumping frame 6, Pixel cat jumping frame 7

### Community 19 - "Running cat sprites"
Cohesion: 0.25
Nodes (8): Run pose frame 1 - small pixel-art cat sprite, Run pose frame 2 - small pixel-art cat sprite, Run pose frame 3 - small pixel-art cat sprite, Run pose frame 4 - small pixel-art cat sprite, Run pose frame 5 - small pixel-art cat sprite, Run pose frame 6 - small pixel-art cat sprite, Run pose frame 7 - small pixel-art cat sprite, Run pose frame 8 - small pixel-art cat sprite

### Community 20 - "Threat cat sprites"
Cohesion: 0.25
Nodes (8): Threaten pose frame 1 - small pixel-art cat sprite, Threaten pose frame 2 - small pixel-art cat sprite, Threaten pose frame 3 - small pixel-art cat sprite, Threaten pose frame 4 - small pixel-art cat sprite, Threaten pose frame 5 - small pixel-art cat sprite, Threaten pose frame 6 - small pixel-art cat sprite, Threaten pose frame 7 - small pixel-art cat sprite, Threaten pose frame 8 - small pixel-art cat sprite

### Community 21 - "Camera and story sharing"
Cohesion: 0.25
Nodes (5): React, { View }, React, { View }, react

### Community 22 - "Touch cat sprites"
Cohesion: 0.29
Nodes (7): Pixel cat standing animation, Pixel cat touch frame 1, Pixel cat touch frame 2, Pixel cat touch frame 3, Pixel cat touch frame 4, Pixel cat touch frame 5, Pixel cat touch frame 6

### Community 23 - "Package scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, postinstall, start, test

### Community 24 - "Settings screen"
Cohesion: 0.33
Nodes (5): LINKS, Props, SECTIONS, styles, ToggleKey

### Community 25 - "Idle cat sprites"
Cohesion: 0.40
Nodes (5): Pixel cat idle animation, Pixel cat idle frame 1, Pixel cat idle frame 2, Pixel cat idle frame 3, Pixel cat idle frame 4

### Community 26 - "Side idle cat sprites"
Cohesion: 0.40
Nodes (5): Pixel cat sitting and facing right animation, Pixel cat facing right frame 1, Pixel cat facing right frame 2, Pixel cat facing right frame 3, Pixel cat facing right frame 4

### Community 27 - "Sleeping cat sprites"
Cohesion: 0.40
Nodes (5): Pixel cat sleeping animation, Pixel cat sleeping frame 1, Pixel cat sleeping frame 2, Pixel cat sleeping frame 3, Pixel cat sleeping frame 4

### Community 28 - "Metro bundler config"
Cohesion: 0.40
Nodes (3): config, { getDefaultConfig, mergeConfig }, @react-native/metro-config

### Community 29 - "TypeScript config"
Cohesion: 0.40
Nodes (4): exclude, extends, include, @react-native/typescript-config

### Community 31 - "Cleaning cat sprites"
Cohesion: 0.50
Nodes (4): Pixel cat cleaning frame 1, Pixel cat cleaning frame 2, Pixel cat cleaning frame 3, Pixel cat cleaning frame 4

### Community 32 - "Licking cat sprites"
Cohesion: 0.50
Nodes (4): Lick pose frame 1 - small pixel-art cat sprite, Lick pose frame 2 - small pixel-art cat sprite, Lick pose frame 3 - small pixel-art cat sprite, Lick pose frame 4 - small pixel-art cat sprite

## Knowledge Gaps
- **67 isolated node(s):** `@maplibre/maplibre-react-native`, `@react-native-firebase/app`, `@react-native/new-app-screen`, `react-native-haptic-feedback`, `react-native-nitro-image` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 247 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Camera and story sharing` to `Activity tracking state`, `Application navigation routes`, `Project dependencies and tools`, `Activity recording and sharing`, `Profile and login screens`, `Mock merchant and coupon data`, `Activity history screens`, `Cat avatar and wallet UI`, `Coupon wallet flow`, `Settings screen`?**
  _High betweenness centrality (0.194) - this node is a cross-community bridge._
- **What connects `@maplibre/maplibre-react-native`, `@react-native-firebase/app`, `@react-native/new-app-screen` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Activity tracking state` be split into smaller, more focused modules?**
  _Cohesion score 0.08081632653061224 - nodes in this community are weakly interconnected._
- **Why does `react-native` connect `Cat avatar and wallet UI` to `Activity tracking state`, `Application navigation routes`, `Project dependencies and tools`, `Activity recording and sharing`, `Profile and login screens`, `Mock merchant and coupon data`, `Activity history screens`, `Coupon wallet flow`, `Camera and story sharing`, `Settings screen`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Should `Application navigation routes` be split into smaller, more focused modules?**
  _Cohesion score 0.06382978723404255 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Runtime dependency inventory` to `Project dependencies and tools`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Should `Project dependencies and tools` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
