# Integrated Features Implementation Plan

## Overview

This plan integrates QR scanner, photo gallery, offers calendar, and event calendar view directly into existing screens for optimal user experience without adding navigation complexity.

## Design Philosophy

- **Keep it simple**: No new navigation paradigms
- **Make it discoverable**: Features visible where users expect them
- **Maintain consistency**: Follow existing UI patterns
- **Progressive disclosure**: Show previews, expand to full views

---

## Part 1: Photo Gallery Integration (HomeScreen)

### 1.1 Gallery Preview Section on HomeScreen

**Goal**: Showcase restaurant visually without adding navigation complexity

#### Tasks:

- [ X] Add Gallery Preview Card to HomeScreen
  - [ X] Position: Below quick actions, above recent news
  - [ X] Design: Horizontal scrollable preview (3-4 images visible)
  - [ X] Title: "Eindrücke aus unserem Restaurant"
  - [ X] "Alle Fotos →" button to expand
- [ X] Create Gallery Preview Component
  - [ X] `components/home/GalleryPreview.tsx`
  - [ X] Load 6-8 featured images
  - [ X] Smooth horizontal scroll
  - [ X] Image lazy loading
  - [ X] Subtle zoom animation on press

### 1.2 Full Gallery Screen

**Goal**: Full photo viewing experience accessed from HomeScreen

#### Tasks:

- [ X] Create Standalone Gallery Screen
  - [ X] `screens/GalleryScreen.tsx`
  - [ X] Navigate via Stack Navigator (not new tab)
  - [ X] Back button returns to HomeScreen
- [ X] Gallery Categories
  - [ X] Tab view at top: "Restaurant" | "Events" | "Eis-Spezialitäten"
  - [ X] Grid layout (2-3 columns)
  - [ X] Pull to refresh
  - [ X] Load more on scroll

### 1.3 Photo Viewer

**Goal**: Instagram-like photo viewing experience

#### Tasks:

- [ X] Install Dependencies
  - [ X] `npm install react-native-image-viewing`
  - [ X] `npm install expo-media-library` (for save functionality)
- [ X] Implement Full-Screen Viewer
  - [ X] Pinch to zoom
  - [ X] Double tap to zoom
  - [ X] Swipe between photos
  - [ X] Share button
  - [ ] Optional: Save to device

### 1.4 Gallery Service & Database

**Goal**: Efficient photo management

#### Tasks:

- [ X] Create Gallery Service
  - [ X] `services/gallery/galleryService.ts`
  - [ X] Methods:
    - `getFeaturedPhotos()` - for home preview
    - `getPhotosByCategory(category)`
    - `cachePhotos()` - local caching
- [ X] Database Schema

  ```sql
  CREATE TABLE gallery_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    description TEXT,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_gallery_featured ON gallery_photos(is_featured, display_order);
  CREATE INDEX idx_gallery_category ON gallery_photos(category, display_order);
  ```

---

## Part 2: QR Scanner for Loyalty (ProfileScreen Integration)

### 2.1 Scanner Entry Points

**Goal**: Make QR scanning easily accessible without cluttering navigation

#### Tasks:

- [ ] Add Scanner Button to ProfileScreen
  - [ ] Position: In loyalty points card
  - [ ] Design: Prominent button "Punkte sammeln" with QR icon
  - [ ] Shows current points balance above
- [ ] Add Quick Action to HomeScreen
  - [ ] In existing quick actions grid
  - [ ] Icon: QR code
  - [ ] Label: "QR scannen"
  - [ ] Same navigation target

### 2.2 QR Scanner Screen

**Goal**: Simple, focused scanning experience

#### Tasks:

- [ ] Install Scanner Dependencies
  - [ ] `npx expo install expo-barcode-scanner`
  - [ ] `npx expo install expo-camera`
- [ ] Create Scanner Screen
  - [ ] `screens/QRScannerScreen.tsx`
  - [ ] Full-screen camera view
  - [ ] Scanning frame overlay
  - [ ] Instructions: "QR-Code im Rahmen positionieren"
  - [ ] Torch toggle button
  - [ ] Close button (X)

### 2.3 Scan Result Handling

**Goal**: Clear feedback and point attribution

#### Tasks:

- [ ] Success Flow
  - [ ] Vibration feedback on scan
  - [ ] Show points animation (+10 Punkte!)
  - [ ] Update balance immediately
  - [ ] Auto-close after 2 seconds
- [ ] Error Handling
  - [ ] Already scanned: "Code bereits eingelöst"
  - [ ] Invalid code: "Ungültiger Code"
  - [ ] Network error: Save for retry
  - [ ] Show clear error messages

### 2.4 Loyalty System Backend

**Goal**: Secure point management

#### Tasks:

- [ ] Create Loyalty Service
  - [ ] `services/loyalty/loyaltyService.ts`
  - [ ] Methods:
    - `redeemCode(code, userId)`
    - `getTransactionHistory(userId)`
    - `getPointsBalance(userId)`
- [ ] Database Schema

  ```sql
  CREATE TABLE loyalty_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    points INTEGER NOT NULL,
    valid_until TIMESTAMPTZ,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE loyalty_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    code_id UUID REFERENCES loyalty_codes(id),
    points INTEGER NOT NULL,
    type VARCHAR(20) CHECK (type IN ('earned', 'redeemed')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_loyalty_user ON loyalty_transactions(user_id, created_at DESC);
  ```

- [ ] Create Edge Function
  - [ ] Validate code signature
  - [ ] Check code validity and uses
  - [ ] Award points atomically
  - [ ] Return success/error

### 2.5 Points History in Profile

**Goal**: Transparency in loyalty program

#### Tasks:

- [ ] Add Transaction History Section
  - [ ] Below points balance in ProfileScreen
  - [ ] Show last 5 transactions
  - [ ] "Alle anzeigen" for full history
- [ ] Transaction List Design
  - [ ] Date, description, points (+/-)
  - [ ] Color coding (green for earned, red for redeemed)
  - [ ] Total at bottom

---

## Part 3: Angebotskalender (Offers Integration)

### 3.1 Today's Offers on HomeScreen

**Goal**: Immediate visibility of current offers

#### Tasks:

- [X ] Add Offers Banner to HomeScreen
  - [X ] Position: Top, below header
  - [ X] Only show if offers exist today
  - [ X] Design: Eye-catching card with gradient
  - [ X] Content: "Heutiges Angebot: [Item] -20%"
  - [ X] Tap to see all offers

### 3.2 Offers Tab in MenuScreen

**Goal**: Dedicated space for all offers without separate navigation

#### Tasks:

- [ X] Add Tab to MenuScreen
  - [ X] Tabs: "Speisekarte" | "Angebote"
  - [ X] Badge with count of active offers
- [ X] Offers List View
  - [ X] Group by validity period
  - [ X] Show: Item name, original/offer price, validity
  - [ X] Visual: Strike-through original price
  - [ X] Link to menu item details

### 3.3 Calendar View for Offers

**Goal**: See upcoming offers at a glance

#### Tasks:

- [ ] Install Calendar Component
  - [ ] `npm install react-native-calendars`
- [ ] Implement Offers Calendar
  - [ ] Month view with marked offer days
  - [ ] Day press shows offers for that date
  - [ ] Color coding for offer types
  - [ ] Legend at bottom

### 3.4 Offers Service Enhancement

**Goal**: Robust offers management

#### Tasks:

- [ ] Enhance MenuService
  - [ ] `getTodaysOffers()` - for home banner
  - [ ] `getOffersForDateRange(start, end)` - for calendar
  - [ ] `getUpcomingOffers(days)` - preview
- [ ] Add Offers Badge to Menu Items
  - [ ] Show discount percentage on item cards
  - [ ] Special price display
  - [ ] "Angebot" badge

---

## Part 4: Calendar View for Events

### 4.1 View Toggle in EventsScreen

**Goal**: Let users choose their preferred event view

#### Tasks:

- [ ] Add View Toggle Control
  - [ ] Position: Below tabs, above content
  - [ ] Options: List (current) | Calendar
  - [ ] Icons: list-outline | calendar-outline
  - [ ] Persist preference in AsyncStorage

### 4.2 Calendar Implementation

**Goal**: Visual event overview

#### Tasks:

- [ ] Configure Calendar for Events
  - [ ] Use same react-native-calendars
  - [ ] Different theme from offers calendar
  - [ ] Show event dots on dates
  - [ ] Multi-dot for multiple events
- [ ] Calendar Interactions
  - [ ] Month navigation
  - [ ] Today button
  - [ ] Date press shows event preview
  - [ ] Event preview links to details

### 4.3 Event Preview Card

**Goal**: Quick event info without navigation

#### Tasks:

- [ ] Create Event Preview Component
  - [ ] `components/events/EventPreview.tsx`
  - [ ] Appears as bottom sheet on date press
  - [ ] Shows: Title, time, location, offerings
  - [ ] Actions: "Details" | "Favorisieren"
- [ ] Animation
  - [ ] Slide up from bottom
  - [ ] Backdrop dim
  - [ ] Swipe down to dismiss

### 4.4 Unified Calendar Service

**Goal**: Consistent calendar data handling

#### Tasks:

- [ ] Create Calendar Service
  - [ ] `services/calendar/calendarService.ts`
  - [ ] Methods:
    - `getEventDates(month)` - dots for calendar
    - `getEventsForDate(date)` - for preview
    - `formatForCalendar(events)` - data transformation
- [ ] Calendar State Management
  - [ ] Add to existing Zustand store
  - [ ] Selected date
  - [ ] View preference
  - [ ] Cached month data

---

## Part 5: Integration & Polish

### 5.1 Navigation Updates

**Goal**: Seamless transitions between features

#### Tasks:

- [ ] Update Navigation Stack
  - [ ] Add GalleryScreen to stack
  - [ ] Add QRScannerScreen to stack
  - [ ] Proper back navigation
  - [ ] Gesture support (swipe back)

### 5.2 Performance Optimization

**Goal**: Smooth experience even with images

#### Tasks:

- [ ] Image Optimization
  - [ ] Generate thumbnails server-side
  - [ ] Progressive loading (blur → clear)
  - [ ] Cache with expo-file-system
  - [ ] Memory management (unload off-screen)
- [ ] Calendar Performance
  - [ ] Virtualized month rendering
  - [ ] Debounced month changes
  - [ ] Preload adjacent months

### 5.3 Offline Support

**Goal**: Basic functionality without internet

#### Tasks:

- [ ] Offline Gallery
  - [ ] Cache last viewed photos
  - [ ] Show cached with indicator
- [ ] Offline Calendar
  - [ ] Cache event/offer dates
  - [ ] Show stale data warning
- [ ] QR Scanner Offline
  - [ ] Queue scans for later
  - [ ] Sync when online

### 5.4 Analytics Integration

**Goal**: Understand feature usage

#### Tasks:

- [ ] Track Key Events
  - [ ] gallery_viewed
  - [ ] photo_opened
  - [ ] qr_scanned
  - [ ] points_earned
  - [ ] offer_viewed
  - [ ] calendar_toggled
- [ ] User Journey Tracking
  - [ ] Home → Gallery flow
  - [ ] Profile → Scanner flow
  - [ ] Menu → Offers flow

---

## Implementation Timeline

### Week 1: Foundation

- [ ] Gallery preview on HomeScreen
- [ ] Full gallery screen with categories
- [ ] Basic photo viewer

### Week 2: Loyalty System

- [ ] QR scanner screen
- [ ] Points redemption backend
- [ ] Integration with ProfileScreen

### Week 3: Offers & Calendar

- [ ] Offers banner on HomeScreen
- [ ] Offers tab in MenuScreen
- [ ] Calendar view for EventsScreen

### Week 4: Polish

- [ ] Performance optimization
- [ ] Offline support
- [ ] Analytics
- [ ] Bug fixes

---

## Design Principles

### Visual Hierarchy

1. **HomeScreen**: Gateway to features

   - Gallery preview: Visual attraction
   - QR quick action: Prominent but not dominant
   - Offers banner: Attention-grabbing when active

2. **ProfileScreen**: Loyalty hub

   - Points balance: Top prominence
   - Scan button: Clear CTA
   - History: Supporting information

3. **MenuScreen**: Food focus

   - Menu items: Primary
   - Offers tab: Secondary but visible

4. **EventsScreen**: Flexible viewing
   - Toggle: Subtle but accessible
   - Calendar: Equal weight to list

### User Flows

**Photo Discovery**

```
Home → Gallery Preview → Tap "Alle" → Full Gallery → Select Photo → Full Screen
```

**Points Collection**

```
Profile → "Punkte sammeln" → Camera Permission → Scan → Success → Updated Balance
OR
Home → QR Quick Action → [same flow]
```

**Offer Discovery**

```
Home → Offers Banner → Menu Offers Tab → Offer Details
OR
Menu → Offers Tab → Browse Offers
```

**Event Calendar**

```
Events → Toggle Calendar → Select Date → Preview → Full Details
```

---

## Technical Considerations

### Dependencies

```json
{
  "react-native-calendars": "^1.1300.0",
  "react-native-image-viewing": "^0.2.2",
  "expo-barcode-scanner": "~12.5.3",
  "expo-camera": "~13.4.4",
  "expo-media-library": "~15.4.1",
  "expo-file-system": "~15.4.5"
}
```

### Performance Targets

- Gallery initial load: < 1s
- Photo open: < 500ms
- QR scan to result: < 2s
- Calendar month change: < 100ms
- Offers load: < 500ms

### Accessibility

- Gallery: Alt text for images
- QR Scanner: Audio feedback option
- Calendar: VoiceOver/TalkBack support
- Offers: Clear discount announcements

---

## Success Metrics

### User Engagement

- [ ] 50% of users view gallery in first session
- [ ] 30% of logged-in users scan QR monthly
- [ ] 40% check offers weekly
- [ ] 25% use calendar view for events

### Performance

- [ ] All features load under 2 seconds
- [ ] No frame drops in transitions
- [ ] < 100MB memory usage with gallery open

### Business Impact

- [ ] 20% increase in loyalty program participation
- [ ] 15% increase in offer redemption
- [ ] 10% increase in event attendance

---

## Risk Mitigation

### Technical Risks

1. **Large image galleries causing memory issues**
   - Solution: Virtualized lists, aggressive cleanup
2. **QR scanner battery drain**
   - Solution: Auto-timeout after 60s
3. **Calendar performance with many events**
   - Solution: Month pagination, lazy loading

### UX Risks

1. **Feature discovery**
   - Solution: Onboarding tooltips on first use
2. **Cluttered HomeScreen**

   - Solution: Collapsible sections, smart ordering

3. **Complex navigation**
   - Solution: Consistent back button behavior

---

## Next Steps

1. Review plan with stakeholders
2. Create design mockups
3. Set up development branch
4. Begin Week 1 implementation
5. Weekly testing with beta users
