# Database Complete Summary & Development Roadmap

## 🗄️ Database Work Completed

### 1. Initial Database Analysis & Issues Found
We started with a partially working database that had several critical issues:
- **chat_messages** table was broken (missing id primary key, missing language field)
- **angebotskalender** system didn't exist 
- Menu items lacked subcategories for filtering
- Missing tables for planned features (gallery, loyalty)

### 2. Revised Database Architecture
We completely redesigned the Angebotskalender system based on your requirements:
- **NOT percentage discounts** → Fixed discount prices
- **NOT all items in category** → Specific selected items only
- **7 rotating weekly themes** with your custom names:
  - Burger Woche
  - Türkische Woche (Döner)
  - Boxen Woche
  - Schweine Woche (Schnitzel)
  - Fleischteller Woche (Gyros)
  - Wurst Woche
  - Croque Woche

### 3. Database Tables Created

#### Core Tables (Already Existed - Fixed/Enhanced):
- **profiles**: Added favorite_events (jsonb), loyalty_points fields
- **menu_items**: Added subcategory column for filtering
- **events**: Ready for event management
- **chat_messages**: Fixed with id primary key and language field

#### New Tables Created:
- **angebotskalender_weeks**: 7 weekly themes management
- **angebotskalender_items**: 38 specific discounted items linked to weeks
- **gallery_photos**: 4 sample photos for restaurant gallery
- **loyalty_codes**: QR code validation system
- **loyalty_transactions**: Points history tracking

### 4. Current Database State
- ✅ **125 menu items** with subcategories (Burger, Döner, Pizza, etc.)
- ✅ **38 discounted items** across 7 weekly themes
- ✅ **Burger Woche currently active** with 8 discounted burgers
- ✅ **18 indexes** for optimal performance
- ✅ **9 RLS policies** for security
- ✅ **All foreign keys** properly configured

---

## 🚀 Current App Implementation Status

### ✅ Fully Implemented Features:
1. **Authentication System** (Supabase Auth)
2. **User Profiles** with favorites management
3. **Menu System** with 125 items from database
   - Categories dynamically loaded
   - Favorites functionality with filter
   - Real-time updates via subscriptions
4. **Events System** with favorites
   - Past/upcoming separation
   - Favorites filter
5. **AI Chatbot** with Google Gemini (95% cost savings)
   - Bilingual support (DE/EN)
   - Chat history persistence
6. **Navigation** (5 bottom tabs: Home, Menu, Events, Chat, Profile)

### 🚧 Partially Implemented:
1. **MenuService.getSpecialOffers()** - Still uses old 'angebotskalender' table structure
2. **HomeScreen** - Basic structure exists but missing new features

### ❌ Not Yet Implemented:
1. **Angebotskalender UI** - Database ready, frontend pending
2. **Photo Gallery** - Database ready, UI not built
3. **QR Scanner** - Database ready, scanner not built
4. **Calendar View** for events
5. **Offers Tab** in MenuScreen
6. **Gallery Preview** on HomeScreen

---

## 📋 Next Development Steps (Priority Order)

### Phase 1: Fix Angebotskalender Service (Day 1)
**Goal**: Update MenuService to use new database structure

#### Tasks:
1. **Update MenuService.getSpecialOffers()**
```typescript
static async getCurrentOffers() {
  const { data } = await supabase
    .from('angebotskalender_weeks')
    .select(`
      *,
      angebotskalender_items(
        *,
        menu_item:menu_items(*)
      )
    `)
    .eq('is_active', true)
    .single();
  return data;
}
```

2. **Create OffersService.ts** for better separation
   - getCurrentWeekOffers()
   - getOffersByWeek(weekNumber)
   - formatOfferPrices()

---

### Phase 2: Angebotskalender UI (Days 2-3)
**Goal**: Display weekly offers in the app

#### Tasks:
1. **HomeScreen - Offers Banner**
   - [ ] Add banner showing current week theme
   - [ ] Display "Burger Woche - 8 Artikel im Angebot!"
   - [ ] Quick preview of top 3 offers
   - [ ] Link to full offers view

2. **MenuScreen - Offers Tab**
   - [ ] Add tab navigation: "Speisekarte" | "Angebote"
   - [ ] Show all current week offers
   - [ ] Display original price with strikethrough
   - [ ] Show savings amount
   - [ ] Add highlight badges (Premium, XXL, etc.)

3. **Components to Create**:
   - `components/offers/OfferBanner.tsx`
   - `components/offers/OfferCard.tsx`
   - `components/menu/PriceDisplay.tsx` (handles discount display)

---

### Phase 3: Photo Gallery (Days 4-5)
**Goal**: Visual showcase of restaurant

#### Tasks:
1. **GalleryService Creation**
```typescript
services/gallery/galleryService.ts
- getFeaturedPhotos()
- getPhotosByCategory(category)
- uploadPhoto() // admin only
```

2. **HomeScreen Gallery Preview**
   - [ ] Horizontal ScrollView with featured photos
   - [ ] "Alle Fotos ansehen" button
   - [ ] Smooth animations

3. **GalleryScreen (Stack Navigation)**
   - [ ] Tab categories: Restaurant | Events | Eis
   - [ ] Grid layout (2-3 columns)
   - [ ] Full-screen image viewer
   - [ ] Pinch to zoom, swipe navigation

4. **Dependencies to Install**:
```bash
npm install react-native-image-viewing
npm install react-native-fast-image
```

---

### Phase 4: QR Scanner & Loyalty (Days 6-7)
**Goal**: Complete loyalty points system

#### Tasks:
1. **Scanner Implementation**
   - [ ] Install `expo-barcode-scanner`
   - [ ] Create `screens/QRScannerScreen.tsx`
   - [ ] Camera permission handling
   - [ ] Scan result validation

2. **LoyaltyService Creation**
```typescript
services/loyalty/loyaltyService.ts
- validateCode(code: string)
- redeemCode(code: string, userId: string)
- getTransactionHistory(userId: string)
- getPointsBalance(userId: string)
```

3. **ProfileScreen Updates**
   - [ ] Add "Punkte sammeln" button with QR icon
   - [ ] Display points balance prominently
   - [ ] Show transaction history
   - [ ] Add redemption options

4. **Edge Function for Validation** (Supabase)
```javascript
// supabase/functions/validate-qr-code
export async function handler(req) {
  const { code, userId } = req.body;
  // Validate code, check usage, award points
}
```

---

### Phase 5: Calendar View for Events (Days 8-9)
**Goal**: Visual event browsing

#### Tasks:
1. **Install Calendar Component**
```bash
npm install react-native-calendars
```

2. **EventsScreen Enhancement**
   - [ ] Add view toggle: List | Calendar
   - [ ] Mark event dates with dots
   - [ ] Show event preview on date tap
   - [ ] Maintain favorites functionality

3. **CalendarService Creation**
```typescript
services/calendar/calendarService.ts
- getEventDates(month: Date)
- getEventsForDate(date: Date)
- formatForCalendar(events: Event[])
```

---

### Phase 6: Performance & Polish (Days 10-11)
**Goal**: Production-ready app

#### Tasks:
1. **Caching Implementation**
   - [ ] Menu items cache (AsyncStorage)
   - [ ] Image caching (expo-file-system)
   - [ ] Chatbot response cache

2. **Error Handling**
   - [ ] Network error recovery
   - [ ] Offline mode indicators
   - [ ] User-friendly error messages

3. **Loading States**
   - [ ] Skeleton loaders
   - [ ] Pull-to-refresh everywhere
   - [ ] Smooth transitions

4. **Theming & Styling**
   - [ ] Consistent color scheme (#FF0000 accent)
   - [ ] Typography scale
   - [ ] Dark mode support (optional)

---

## 🎯 Key Implementation Principles

1. **Database-First**: All data flows from Supabase
2. **Service Layer**: Business logic in services, not components
3. **Real-time Updates**: Use Supabase subscriptions where appropriate
4. **German-First**: Default to German, English as secondary
5. **Performance**: Lazy load, cache aggressively
6. **Security**: RLS policies, never expose sensitive data

---

## 📦 Dependencies to Install

```bash
# For gallery
npm install react-native-image-viewing react-native-fast-image

# For QR scanner
npx expo install expo-barcode-scanner expo-camera

# For calendar
npm install react-native-calendars

# For better lists
npm install react-native-super-grid

# For animations
npm install react-native-reanimated
```

---

## 🔄 Weekly Rotation Automation

Set up Supabase Cron Job for Monday 00:00:
```sql
SELECT cron.schedule(
  'rotate-weekly-offers',
  '0 0 * * 1', -- Every Monday at midnight
  $$
    UPDATE angebotskalender_weeks SET is_active = false;
    UPDATE angebotskalender_weeks 
    SET is_active = true, 
        start_date = CURRENT_DATE,
        end_date = CURRENT_DATE + INTERVAL '6 days'
    WHERE week_number = (
      SELECT COALESCE(MAX(week_number), 0) % 7 + 1 
      FROM angebotskalender_weeks 
      WHERE is_active = true
    );
  $$
);
```

---

## 📊 Success Metrics

Track these to measure implementation success:
1. **Offers Engagement**: Views of offers tab/banner
2. **Gallery Usage**: Photo views per session
3. **QR Scans**: Daily scan count
4. **Calendar Usage**: % using calendar vs list view
5. **App Performance**: <2s load times

---

## 🚨 Critical Path

**Must Complete First** (Blocks other features):
1. Fix MenuService for new offers structure ← **START HERE**
2. Create base services (OffersService, GalleryService, LoyaltyService)
3. Update database.types.ts if needed

**Can Be Done in Parallel**:
- Gallery implementation
- QR Scanner implementation
- Calendar view

**Do Last**:
- Performance optimizations
- Styling polish
- Error handling improvements

---

## 💡 Quick Wins (Can implement today):

1. **Fix MenuService.getSpecialOffers()** - 30 minutes
2. **Add offers banner to HomeScreen** - 1 hour
3. **Add subcategory filter to MenuScreen** - 45 minutes
4. **Display loyalty points in ProfileScreen** - 30 minutes
5. **Add "Coming Soon" placeholders** - 15 minutes

---

This roadmap will take your app from its current state to a fully-featured restaurant companion app with all planned features implemented and working with your new database structure.