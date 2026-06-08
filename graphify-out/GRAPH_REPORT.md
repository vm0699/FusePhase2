# Graph Report - C:\SAVRO\FusePhase2  (2026-06-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 836 nodes · 1338 edges · 65 communities (39 shown, 26 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.9)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1249d921`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Chat Request Handling|Chat Request Handling]]
- [[_COMMUNITY_Gift Catalog UI|Gift Catalog UI]]
- [[_COMMUNITY_Admin Gift Management|Admin Gift Management]]
- [[_COMMUNITY_Profile Photo Management|Profile Photo Management]]
- [[_COMMUNITY_API and Auth Client|API and Auth Client]]
- [[_COMMUNITY_Expo React Native Modules|Expo React Native Modules]]
- [[_COMMUNITY_Project Dependencies|Project Dependencies]]
- [[_COMMUNITY_Mobile App Configuration|Mobile App Configuration]]
- [[_COMMUNITY_Auth and Gift Catalog API|Auth and Gift Catalog API]]
- [[_COMMUNITY_User Onboarding Screens|User Onboarding Screens]]
- [[_COMMUNITY_App Navigation and Screens|App Navigation and Screens]]
- [[_COMMUNITY_Real-time Chat API|Real-time Chat API]]
- [[_COMMUNITY_Video Room Backend Logic|Video Room Backend Logic]]
- [[_COMMUNITY_Main Navigation Tabs|Main Navigation Tabs]]
- [[_COMMUNITY_Swipe and Match Logic|Swipe and Match Logic]]
- [[_COMMUNITY_Profile Detail Components|Profile Detail Components]]
- [[_COMMUNITY_Job and College Inputs|Job and College Inputs]]
- [[_COMMUNITY_Profile State and Context|Profile State and Context]]
- [[_COMMUNITY_Picker Options UI|Picker Options UI]]
- [[_COMMUNITY_Profile Main UI Components|Profile Main UI Components]]
- [[_COMMUNITY_Build and Deployment Config|Build and Deployment Config]]
- [[_COMMUNITY_Drugs and Marijuana Picker|Drugs and Marijuana Picker]]
- [[_COMMUNITY_Profile Interest Display|Profile Interest Display]]
- [[_COMMUNITY_TypeScript Project Setup|TypeScript Project Setup]]
- [[_COMMUNITY_User Profile Backend|User Profile Backend]]
- [[_COMMUNITY_Profile Editing UI|Profile Editing UI]]
- [[_COMMUNITY_Ethnicity Picker UI|Ethnicity Picker UI]]
- [[_COMMUNITY_Sexuality and College Picker|Sexuality and College Picker]]
- [[_COMMUNITY_Notification Routing|Notification Routing]]
- [[_COMMUNITY_Google Services Config|Google Services Config]]
- [[_COMMUNITY_Chat Data Models|Chat Data Models]]
- [[_COMMUNITY_Pets Picker UI|Pets Picker UI]]
- [[_COMMUNITY_Video Call Notifications|Video Call Notifications]]
- [[_COMMUNITY_Discovery Filters UI|Discovery Filters UI]]
- [[_COMMUNITY_Dating Intentions Picker|Dating Intentions Picker]]
- [[_COMMUNITY_Drinking Habits Picker|Drinking Habits Picker]]
- [[_COMMUNITY_Languages Picker UI|Languages Picker UI]]
- [[_COMMUNITY_Politics Picker UI|Politics Picker UI]]
- [[_COMMUNITY_Pronouns Picker UI|Pronouns Picker UI]]
- [[_COMMUNITY_Religion Picker UI|Religion Picker UI]]
- [[_COMMUNITY_Project Scripts|Project Scripts]]
- [[_COMMUNITY_Home Page UI|Home Page UI]]
- [[_COMMUNITY_Chat and Video Call Functions|Chat and Video Call Functions]]
- [[_COMMUNITY_Video Token Generation|Video Token Generation]]
- [[_COMMUNITY_Card UI Component|Card UI Component]]
- [[_COMMUNITY_Children Picker UI|Children Picker UI]]
- [[_COMMUNITY_Education Level Picker|Education Level Picker]]
- [[_COMMUNITY_Hometown Picker UI|Hometown Picker UI]]
- [[_COMMUNITY_Smoking Habits Picker|Smoking Habits Picker]]
- [[_COMMUNITY_Interests Picker UI|Interests Picker UI]]
- [[_COMMUNITY_Agora Call Screen|Agora Call Screen]]
- [[_COMMUNITY_App Settings and Hooks|App Settings and Hooks]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Admin Middleware|Admin Middleware]]
- [[_COMMUNITY_Matchmaking Socket|Matchmaking Socket]]
- [[_COMMUNITY_Profile Card UI|Profile Card UI]]
- [[_COMMUNITY_Glassmorphism Profile Card|Glassmorphism Profile Card]]
- [[_COMMUNITY_Video Queue Schema|Video Queue Schema]]
- [[_COMMUNITY_App Popup Functions|App Popup Functions]]
- [[_COMMUNITY_Local Video Element|Local Video Element]]
- [[_COMMUNITY_Remote Media Container|Remote Media Container]]

## God Nodes (most connected - your core abstractions)
1. `setProfileEditDraft()` - 21 edges
2. `expo` - 14 edges
3. `FusePopup()` - 12 edges
4. `ensureChatTwilioChannel()` - 10 edges
5. `evaluateGiftEligibility()` - 10 edges
6. `GiftCatalog` - 10 edges
7. `sendCompliment()` - 9 edges
8. `handleChatRequest()` - 9 edges
9. `deleteStoredPhotos()` - 8 edges
10. `useProfile()` - 8 edges

## Surprising Connections (you probably didn't know these)
- `VerifyCodePage()` --calls--> `verifyOTP()`  [EXTRACTED]
  fuse/app/screens/CodeVerif.tsx → FUSE - BE/api/middleware/otpService.js
- `InterestsScreen()` --calls--> `normalizeInterests()`  [EXTRACTED]
  fuse/app/screens/Interests.tsx → FUSE - BE/server.js
- `sendCompliment()` --calls--> `ensureChatTwilioChannel()`  [EXTRACTED]
  FUSE - BE/api/controllers/ChatController.js → FUSE - BE/api/services/chatTwilioService.js
- `handleChatRequest()` --calls--> `ensureChatTwilioChannel()`  [EXTRACTED]
  FUSE - BE/api/controllers/ChatController.js → FUSE - BE/api/services/chatTwilioService.js
- `PromptSelectionPage()` --calls--> `useProfile()`  [EXTRACTED]
  fuse/app/screens/PromptSelection.tsx → fuse/ProfileContext.js

## Import Cycles
- None detected.

## Communities (65 total, 26 thin omitted)

### Community 0 - "Chat Request Handling"
Cohesion: 0.06
Nodes (59): client, appendComplimentMessage(), applyLastMessageMetadata(), buildChatNotificationData(), clearLastMessageMetadata(), closeChat(), createGiftIntent(), ensureParticipantIds() (+51 more)

### Community 1 - "Gift Catalog UI"
Cohesion: 0.05
Nodes (38): giftApi, GiftCatalog, GiftEligibility, GiftOrderView, GiftTier, FusePopup(), FusePopupProps, FusePopupTone (+30 more)

### Community 2 - "Admin Gift Management"
Cohesion: 0.06
Nodes (38): ACTION_TO_STATUS, ALLOWED_TRANSITIONS, getAdminGiftOrders(), notifyParticipantsOfStatus(), STATUS_TIMESTAMP_FIELD, updateAdminGiftOrderNotes(), confirmGiftPayment(), initiateGiftPayment() (+30 more)

### Community 3 - "Profile Photo Management"
Cohesion: 0.07
Nodes (43): buildDiscoveryCandidateLimit(), buildS3ObjectKey(), buildS3PublicUrl(), calculateProfileCompleteness(), deleteLocalUploadIfPresent(), deletePhoto(), deleteStoredPhotos(), encodeS3Key() (+35 more)

### Community 4 - "API and Auth Client"
Cohesion: 0.07
Nodes (19): getJson(), postJson(), safeJson(), authedFetch(), FetchArgs, decodeJwtPayload(), getExpMsFromJwt(), AuthListener (+11 more)

### Community 5 - "Expo React Native Modules"
Cohesion: 0.05
Nodes (42): dependencies, agora-react-native-rtm, expo, expo-application, expo-blur, expo-camera, expo-device, expo-font (+34 more)

### Community 6 - "Project Dependencies"
Cohesion: 0.05
Nodes (40): author, dependencies, agora-access-token, aws-sdk, @aws-sdk/client-s3, @aws-sdk/lib-storage, cors, dns (+32 more)

### Community 7 - "Mobile App Configuration"
Cohesion: 0.07
Nodes (29): foregroundImage, adaptiveIcon, edgeToEdgeEnabled, googleServicesFile, package, projectId, expo, android (+21 more)

### Community 8 - "Auth and Gift Catalog API"
Cohesion: 0.11
Nodes (20): refreshToken(), verifyPhoneNumber(), getGiftCatalog(), getGiftCatalogItem(), normalizeTags(), resolveRecipientId(), serializeCatalogItem(), declineGiftOrder() (+12 more)

### Community 9 - "User Onboarding Screens"
Cohesion: 0.09
Nodes (11): styles, styles, styles, pickerSelectStyles, styles, styles, styles, styles (+3 more)

### Community 10 - "App Navigation and Screens"
Cohesion: 0.09
Nodes (8): Stack, styles, styles, styles, styles, styles, styles, styles

### Community 11 - "Real-time Chat API"
Cohesion: 0.13
Nodes (10): chatApi, ChatListItem, NormalizedMessage, AgoraRealtime, chatRealtimeProviderStore, createChatRealtime(), RealtimeClient, RealtimeIncomingHandler (+2 more)

### Community 12 - "Video Room Backend Logic"
Cohesion: 0.14
Nodes (18): app, cleanupStaleVideoQueueEntries(), client, createVideoRoomId(), __dirname, __filename, findSharedInterest(), getCharacterPriorityScore() (+10 more)

### Community 13 - "Main Navigation Tabs"
Cohesion: 0.12
Nodes (11): navItems, styles, Tab, styles, LikedUser, styles, DiscoveryFilters, DiscoveryProfile (+3 more)

### Community 14 - "Swipe and Match Logic"
Cohesion: 0.20
Nodes (16): ACTIVE_CHAT_STATUSES, buildMatchResponse(), buildNoMatchResponse(), handleSwipe(), normalizePairKey(), resolveActiveChatForPair(), ACTIVE_CHAT_STATUSES, deriveSwipeState() (+8 more)

### Community 15 - "Profile Detail Components"
Cohesion: 0.15
Nodes (11): styles, styles, useProfile(), HEIGHTS, normalizeInterestList(), ProfileDetailsPage(), styles, VALUES (+3 more)

### Community 16 - "Job and College Inputs"
Cohesion: 0.14
Nodes (5): Props, Props, styles, Props, Props

### Community 17 - "Profile State and Context"
Cohesion: 0.19
Nodes (5): createCompatibilityProfile(), ensureArray(), normalizeProfileState(), styles, styles

### Community 18 - "Picker Options UI"
Cohesion: 0.17
Nodes (7): DRUG_OPTIONS, Props, Option, Props, styles, Props, ZODIAC_OPTIONS

### Community 19 - "Profile Main UI Components"
Cohesion: 0.17
Nodes (8): styles, SegmentedControlProps, SegmentedTabItem, styles, ICON_MAP, styles, TABS, { width }

### Community 20 - "Build and Deployment Config"
Cohesion: 0.20
Nodes (11): build, development, preview, production, cli, appVersionSource, version, developmentClient (+3 more)

### Community 21 - "Drugs and Marijuana Picker"
Cohesion: 0.22
Nodes (4): Props, styles, MARIJUANA_OPTIONS, Props

### Community 23 - "TypeScript Project Setup"
Cohesion: 0.22
Nodes (8): devDependencies, @babel/core, @types/react, typescript, main, name, private, version

### Community 24 - "User Profile Backend"
Cohesion: 0.36
Nodes (5): deleteAccount(), getProfile(), s3, updateLocation(), router

### Community 26 - "Ethnicity Picker UI"
Cohesion: 0.29
Nodes (4): ETHNICITY_OPTIONS, Props, OPTIONAL_ONBOARDING_STEPS, styles

### Community 27 - "Sexuality and College Picker"
Cohesion: 0.29
Nodes (3): OPTIONS, Props, setProfileEditDraft()

### Community 28 - "Notification Routing"
Cohesion: 0.33
Nodes (3): registerToken(), router, router

### Community 29 - "Google Services Config"
Cohesion: 0.29
Nodes (6): client, configuration_version, project_info, project_id, project_number, storage_bucket

### Community 30 - "Chat Data Models"
Cohesion: 0.29
Nodes (3): ChatSchema, likeSchema, router

### Community 33 - "Discovery Filters UI"
Cohesion: 0.33
Nodes (4): DiscoveryFilters, NavigationProp, RootStackParamList, styles

### Community 40 - "Project Scripts"
Cohesion: 0.40
Nodes (5): scripts, android, ios, start, web

### Community 41 - "Home Page UI"
Cohesion: 0.40
Nodes (3): featureImages, features, styles

### Community 42 - "Chat and Video Call Functions"
Cohesion: 0.50
Nodes (5): addChatMessage Function, attachTrack Function, sendMessage Function, setupParticipantListeners Function, startVideoCall Function

### Community 43 - "Video Token Generation"
Cohesion: 0.50
Nodes (3): express, router, { RtcTokenBuilder, RtcRole }

### Community 49 - "Interests Picker UI"
Cohesion: 0.67
Nodes (3): normalizeInterests(), InterestsScreen(), styles

## Knowledge Gaps
- **341 isolated node(s):** `PreToolUse`, `express`, `{ RtcTokenBuilder, RtcRole }`, `router`, `client` (+336 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DiscoveryProfile` connect `Main Navigation Tabs` to `Profile Photo Management`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Why does `normalizeInterests()` connect `Interests Picker UI` to `Video Room Backend Logic`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `GiftCatalog` connect `Gift Catalog UI` to `App Navigation and Screens`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `PreToolUse`, `express`, `{ RtcTokenBuilder, RtcRole }` to the rest of the system?**
  _341 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Chat Request Handling` be split into smaller, more focused modules?**
  _Cohesion score 0.05755693581780538 - nodes in this community are weakly interconnected._
- **Should `Gift Catalog UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05026300409117475 - nodes in this community are weakly interconnected._
- **Should `Admin Gift Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06077694235588972 - nodes in this community are weakly interconnected._