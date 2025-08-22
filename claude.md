# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

```bash
# Start development server
npm start

# Platform-specific development
npm run android  # Android development
npm run ios      # iOS development
npm run web      # Web development

# Install dependencies
npm install

# Generate Supabase types (when schema changes)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/services/supabase/database.types.ts

# Linting and formatting
npx eslint src/                # Check code quality
npx prettier --write src/       # Format code
```

## Architecture Overview

This is a React Native Expo app for Grill-Partner Maier, a German restaurant in Kiel (since 1968). The architecture follows a feature-based organization pattern with service-oriented design for optimal UX and maintainability.

### Core Stack
- **Frontend**: React Native 0.79.5 with Expo SDK 53
- **State Management**: Zustand for global state (user authentication)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Navigation**: React Navigation with bottom tabs (simple, no drawer)
- **AI Integration**: Google Gemini API (95% cheaper than OpenAI, direct fetch)
- **Photo Management**: react-native-image-viewing for full-screen viewing
- **Calendar**: react-native-calendars for event calendar view
- **File Sharing**: expo-sharing for photo sharing functionality
- **Code Quality**: ESLint and Prettier configured
- **Structure**: Feature-based architecture (see FOLDER_STRUCTURE.md for details)

### Key Architectural Decisions

1. **Service Layer Pattern**: All Supabase interactions go through service classes
   - Feature services located in `src/features/[feature]/services/`
   - Core services (Supabase client) in `src/services/supabase/`
   - Each domain has its own service (MenuService, EventsService, ChatService, OffersService, GalleryService, LoyaltyService)
   - **GalleryService**: Handles photo loading, categorization, and real-time updates
   - Services return typed data from `database.types.ts`
   - Real-time subscriptions handled at service level

2. **Environment Variables**: Use `.env.local` (Expo convention) with `EXPO_PUBLIC_` prefix
   - Required: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY
   - Optional: GOOGLE_MAPS_API_KEY, POSTHOG keys

3. **Authentication Flow**: 
   - Supabase Auth with email/password
   - User profiles table synced with auth.users
   - ExpoSecureStore for token persistence

4. **Cost Optimization**:
   - Switched from OpenAI to Google Gemini (95% cost reduction)
   - Prepared caching layer for common queries (not yet implemented)

5. **Navigation Philosophy**:
   - Keep it simple - bottom tabs only, no drawer
   - Features integrated into existing screens
   - Stack navigation for detail views (Gallery, QR Scanner)

## Folder Structure

The app uses a feature-based architecture for better scalability and maintainability:

```
src/
├── app/              # App configuration (App.tsx, navigation)
├── features/         # Feature modules (menu, events, chat, etc.)
│   └── [feature]/
│       ├── components/   # Feature-specific components
│       ├── screens/      # Screen components
│       ├── services/     # Business logic
│       └── types.ts      # TypeScript types
├── shared/           # Shared resources
│   └── components/   # Reusable UI components
├── services/         # Core services (Supabase)
├── stores/           # Global state (Zustand)
├── theme/            # Design system (colors, typography, spacing)
├── i18n/             # Internationalization
└── types/            # Global TypeScript types
```

**Import Conventions:**
- Use relative imports within a feature: `import MenuItem from '../components/MenuItem'`
- Use absolute imports from src root for cross-feature: `import { useUserStore } from '../../../stores/userStore'`
- Shared components: `import { Button } from '../../../shared/components/Button'`

For detailed structure documentation, see `FOLDER_STRUCTURE.md`.

## Database Schema

### Primary Tables

**menu_items** (125+ items)
- `id`: number (primary key)
- `name`: string
- `price`: string (numeric in Postgres)
- `category`: string (dynamic categories)
- `subcategory`: string (for filtering within categories)
- `is_available`: boolean
- `allergens`: jsonb
- `image_url`: string

**profiles**
- `id`: uuid (references auth.users)
- `favorites`: number[] (menu_item IDs)
- `favorite_events`: jsonb (event IDs)
- `loyalty_points`: number
- `name`, `email`: user info

**events**
- Event calendar for seasonal catering (May-September)
- `offerings`: string[] (what's available at event)
- `location`: string (can be different from restaurant)

**chat_messages**
- Stores AI chat history
- `language`: 'de' | 'en'
- `user_id`, `message`, `response`

**angebotskalender_weeks** (7 rotating weekly themes)
- `id`: uuid (primary key)
- `week_number`: 1-7 (rotation cycle)
- `week_theme`: string (e.g., "Burger Woche", "Döner Woche")
- `is_active`: boolean (current active week)
- `start_date`, `end_date`: optional date tracking

**angebotskalender_items** (specific discounted items)
- `week_id`: references angebotskalender_weeks
- `menu_item_id`: references menu_items
- `special_price`: fixed discount price (not percentage)
- `highlight_badge`: optional badge (e.g., "Premium", "XXL")

**gallery_photos** (photo gallery - database ready, UI pending)
- `category`: 'restaurant' | 'events' | 'eis'
- `image_url`, `thumbnail_url`
- `is_featured`: for home preview
- `display_order`: for sorting

**loyalty_codes** (QR code validation - database ready, scanner pending)
- `code`: unique identifier
- `points`: value
- `valid_until`: expiration
- `max_uses`, `current_uses`: usage tracking

**loyalty_transactions** (points history - database ready, UI pending)
- `user_id`: who earned/redeemed
- `code_id`: which code was used
- `type`: 'earned' | 'redeemed'
- `points`: amount

## Photo Gallery Management

### Adding Photos to the Gallery

Photos are managed through the `gallery_photos` table in Supabase. You can add new photos using:

#### Method 1: Supabase Dashboard (Recommended)
1. Navigate to **Table Editor** → `gallery_photos` in your Supabase dashboard
2. Click **Insert** → **Insert row**
3. Fill in the required fields:
   - `category`: Choose 'restaurant', 'events', or 'eis'
   - `title`: Photo title (optional but recommended)
   - `description`: Brief description (optional)
   - `image_url`: Direct URL to the full-size image (required)
   - `thumbnail_url`: URL to thumbnail (optional, uses image_url if empty)
   - `is_featured`: Set to `true` for home preview (limit to 6-8 featured photos)
   - `display_order`: Number for sorting (lower numbers appear first)

#### Method 2: SQL Insert
```sql
INSERT INTO gallery_photos (category, title, description, image_url, thumbnail_url, is_featured, display_order) VALUES
('restaurant', 'Gemütlicher Innenbereich', 'Warme Atmosphäre für Familie und Freunde', 'https://your-cdn.com/interior.jpg', 'https://your-cdn.com/interior-thumb.jpg', true, 1),
('events', 'Kieler Woche 2024', 'Unser Stand bei der Kieler Woche', 'https://your-cdn.com/kieler-woche.jpg', null, true, 2);
```

### Image Requirements
- **Format**: JPG, PNG (JPG recommended for photos)
- **Size**: Original images up to 2MB, thumbnails under 200KB
- **Dimensions**: Originals 1200x800px+, thumbnails 400x300px
- **Hosting**: Use Supabase Storage, Cloudinary, or reliable CDN

### Photo Categories
- **restaurant**: Interior, exterior, staff, food preparation
- **events**: Seasonal events, catering setups, festivals
- **eis**: Ice cream varieties, ice cream counter, dessert displays

### Performance Tips
- Always provide thumbnail_url for better loading performance
- Keep featured photos to 6-8 maximum for optimal home preview
- Use progressive JPEG format for faster loading
- Consider WebP format for modern browsers (future enhancement)

## Key Implementation Details

### Menu System
- Categories dynamically loaded from database
- Real-time updates via Supabase subscriptions
- Favorites with filter functionality
- **Offers Integration**: "🔥 Burger Woche" filter tab in MenuScreen
- Special price display with strikethrough and savings badge
- Orange theme (#FF6B00) for offer items

### Angebotskalender (Weekly Offers)
- **7 rotating weekly themes**: Burger, Döner, Boxen, Schnitzel, Gyros, Wurst, Croque
- **Fixed discount prices**: Not percentages, specific prices per item
- **Horizontal scrolling**: All 8 offer items visible on HomeScreen
- **Smart filtering**: Dedicated offers filter in MenuScreen
- **Visual indicators**: "ANGEBOT" badges, strikethrough pricing, savings amount

### AI Chatbot
- **Using Google Gemini Flash** (not OpenAI)
- Direct fetch API for React Native compatibility
- Bilingual (German/English) with automatic detection
- System prompt includes restaurant info and menu context
- Chat history saved via ChatMessageService

### Event System
- Favorites functionality (favorite_events in profiles)
- Real-time updates via subscriptions
- **Calendar View**: Toggle between list and calendar views with visual date markers
- **Date Selection**: Click on calendar dates to see events for that day
- **Event Preview**: Mini cards showing event details when date is selected
- Past/upcoming event separation with visual styling
- **View Persistence**: Calendar/list preference maintained during session
- **Event Markers**: Dots on calendar dates indicate events (red for upcoming, gray for past)

### Home Screen Hub
- **Gallery Preview**: Horizontal scroll of featured photos with category badges
- **Quick Actions**: Restaurant call, directions, menu, events access
- **Weekly Offers Banner**: Horizontal scroll showing all discounted items
- **Touch-optimized**: ScrollView separated from TouchableWithoutFeedback
- **Visual Appeal**: Restaurant header image with overlay text
- **Status Indicators**: Real-time open/closed status with colored badges
- Central access point for key features

### Profile & Loyalty
- **QR Scanner Integration**: Prominent "Punkte sammeln" button
- Points balance display
- Transaction history
- Favorites management (menu items & events)

### Photo Gallery
- **Gallery Preview on HomeScreen**: Horizontal scroll of featured photos
- **Full Gallery Screen**: Accessed via modal navigation from HomeScreen
- **Categories**: Restaurant, Events, Eis-Spezialitäten with tab switching
- **Photo Viewer**: Full-screen with pinch-to-zoom, swipe navigation, and share functionality
- **Real-time Updates**: Live sync with database changes
- **Performance**: Thumbnail loading with lazy loading optimization
- **Database Integration**: Uses `gallery_photos` table with category filtering
- **Featured System**: Photos marked as `is_featured` appear in home preview

### Restaurant-Specific Features
- Opening hours: 11:00-22:00 daily (except Christmas Eve)
- Location: Langer Rehm 25, 24149 Kiel-Dietrichsdorf
- Three business areas: Imbiss, Eventgastronomie, Eis-Spezialitäten
- Seasonal focus: Events May-September

### Current Implementation Status
✅ Menu with 125 items from database
✅ Menu favorites with filter
✅ Home dashboard with quick actions
✅ Events calendar with real-time updates
✅ Event favorites with filter
✅ AI chatbot with Google Gemini
✅ Basic authentication with Supabase
✅ User profiles with favorites
✅ Chat history persistence
✅ Angebotskalender with horizontal scroll and filter
✅ Offers tab in MenuScreen with special pricing
✅ Weekly rotating offers system (Burger Woche active)
✅ Photo gallery with preview on HomeScreen
✅ Full gallery screen with categories
✅ Photo viewer with zoom and share functionality
✅ Calendar view for events with date selection
❌ QR scanner for loyalty points
❌ Points transaction history UI
❌ Google Maps integration
❌ Push notifications
❌ Caching layer for chatbot

## Known Issues & Solutions

1. **OpenAI incompatibility**: Switched to Google Gemini with direct fetch
2. **Menu table naming**: Use `menu_items` not `speisekarte`
3. **TypeScript strict mode**: Enabled, handle nulls properly
4. **Supabase RLS**: Ensure proper policies for all tables
5. **Chat saving**: Fixed with proper ChatMessageService integration
6. **ScrollView in TouchableOpacity**: Never nest ScrollView inside any Touchable component - it blocks scroll gestures

## Testing & Development Notes

- **Code Quality**: ESLint and Prettier configured
  - Run linting: `npx eslint src/`
  - Format code: `npx prettier --write src/`
- **Testing**: No test framework configured yet
- **Mobile Testing**: Use Expo Go app
- **Mock Data**: Available in EventsService.getMockEvents()
- **Backend**: Development uses real Supabase instance (no local emulator)
- **Migrations**: SQL migrations in `supabase-updates.sql`

## German Language Context

The app is primarily for German users. Key German terms used:
- "Moin" - North German greeting
- "Speisekarte" - Menu
- "Angebote" - Offers/Specials
- "Angebotskalender" - Offers calendar
- "Treuepunkte" - Loyalty points
- "Punkte sammeln" - Collect points
- "Veranstaltungen" - Events
- "Fotogalerie" - Photo gallery
- "Eindrücke" - Impressions (for gallery)

Default language is German, with English as secondary option in chatbot.

## Upcoming Features (Planned)

### Photo Gallery (HomeScreen Integration)
- Preview carousel on home page
- Full gallery with categories
- Image viewer with zoom/share
- Supabase Storage integration

### QR Loyalty System (Profile Integration)
- Scanner accessible from Profile and Home
- Points validation via Edge Functions
- Transaction history in profile
- Secure code redemption


### Event Calendar View
- Toggle between list and calendar
- Visual date markers
- Quick preview cards
- Integrated with favorites

See `INTEGRATED_FEATURES_PLAN.md` for detailed implementation strategy.

## UX Principles

1. **No Navigation Complexity**: Bottom tabs only, features integrated into existing screens
2. **Progressive Disclosure**: Show previews on home, expand to full views
3. **Contextual Placement**: Features where users expect them (loyalty in profile, offers with menu)
4. **Visual First**: Gallery preview attracts on home screen
5. **Quick Access**: Important actions (QR scan) available from multiple entry points