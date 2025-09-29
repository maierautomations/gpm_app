# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 🚀 v1 Release Status (December 2025)

**IMPORTANT**: The app is configured for v1 production release with the following key decisions:

### What's IN v1:

- ✅ Full menu system with 125+ items and detail modals
- ✅ Weekly offers with rotation system (8 themes, 50+ items)
- ✅ Events calendar with reminders
- ✅ AI chatbot (Google Gemini)
- ✅ Photo gallery (3 categories)
- ✅ Push notifications (3 types: offers, events, updates)
- ✅ Social media integration (Facebook & Instagram @grillmaier149)
- ✅ User authentication & profiles
- ✅ Settings screens (notifications, language, help, about)

### What's DEFERRED to v2:

- ⏳ Loyalty/points system (database ready, UI removed for cleaner v1)
- ⏳ QR code scanner
- ⏳ Google Maps integration
- ⏳ Full i18n implementation

**Note**: All loyalty infrastructure remains in the database but has been removed from the UI to avoid showing non-functional features in v1.

## Recent Updates (Updated: 2025-09-23)

### Latest Fixes
- **Events Display Fixed**: Resolved issue where events weren't showing due to RLS policies and date format mismatch
- **Date Comparison**: Fixed date filtering to use YYYY-MM-DD format instead of ISO timestamps
- **Mock Data Removed**: Cleaned up mock event data that was overriding real database content

### Recent Features
- **Expo SDK 54**: Upgraded for better Expo Go compatibility
- **Menu Detail Modals**: Full item descriptions with allergen display
- **Hybrid Offers System**: Supports both linked menu items and custom combos
- **Settings Screens**: Complete user preference management with AsyncStorage

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
npx supabase gen types typescript --project-id cicpnssrptuawxtmckiq > src/services/supabase/database.types.ts

# Linting and formatting
npx eslint src/                # Check code quality
npx prettier --write src/       # Format code

# Test Edge Functions (after deployment)
curl -X POST "https://cicpnssrptuawxtmckiq.supabase.co/functions/v1/send-notification" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "test", "title": "Test", "body": "Test notification"}'
```

## Architecture Overview

This is a React Native Expo app for Grill-Partner Maier, a German restaurant in Kiel (since 1968). The architecture follows a feature-based organization pattern with service-oriented design for optimal UX and maintainability.

### Core Stack

- **Frontend**: React Native 0.81.4 with Expo SDK 54
- **State Management**: Zustand for global state (user authentication)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Navigation**: React Navigation with Stack + Bottom Tabs
- **AI Integration**: Google Gemini API (95% cheaper than OpenAI, direct fetch)
- **Push Notifications**: Expo Notifications + Expo Push Service (fully automated)
- **Photo Management**: react-native-image-viewing for full-screen viewing
- **Calendar**: react-native-calendars for event calendar view
- **File Sharing**: expo-sharing for photo sharing functionality
- **User Preferences**: @react-native-async-storage/async-storage for settings
- **Code Quality**: ESLint and Prettier configured
- **Structure**: Feature-based architecture (see FOLDER_STRUCTURE.md for details)

### Key Architectural Decisions

1. **Service Layer Pattern**: All Supabase interactions go through service classes

   - Feature services located in `src/features/[feature]/services/`
   - Core services (Supabase client) in `src/services/supabase/`
   - Each domain has its own service (MenuService, EventsService, ChatService, OffersService, GalleryService, NotificationService)
   - **EventsService**: Fixed date comparisons to use YYYY-MM-DD format
   - **GalleryService**: Handles photo loading, categorization, and real-time updates
   - **NotificationService**: Manages push tokens, permissions, and notification handling
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
├── features/         # Feature modules (menu, events, chat, settings, etc.)
│   ├── menu/         # Menu system with offers integration
│   ├── events/       # Events calendar with favorites
│   ├── chat/         # AI chatbot with Gemini
│   ├── home/         # Dashboard with quick actions
│   ├── profile/      # User profile and social media
│   ├── offers/       # Weekly offers system (OffersService)
│   ├── gallery/      # Photo gallery with categories
│   ├── settings/     # User preferences and app settings
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
├── i18n/             # Internationalization (de.json, en.json)
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
- `loyalty_points`: number (database field preserved for v2, not shown in UI)
- `name`, `email`: user info

**events**

- Event calendar for seasonal catering (May-September)
- `date`: string (YYYY-MM-DD format)
- `offerings`: string[] (what's available at event)
- `location`: string (can be different from restaurant)
- **Important**: RLS enabled with public read policy

**chat_messages**

- Stores AI chat history
- `language`: 'de' | 'en'
- `user_id`, `message`, `response`

**angebotskalender_weeks** (8 rotating weekly themes)

- `id`: uuid (primary key)
- `week_number`: 1-8 (rotation cycle)
- `week_theme`: string (e.g., "Burger Woche", "Türkische Woche", "Hähnchen Woche")
- `is_active`: boolean (current active week)
- `start_date`, `end_date`: date tracking for rotation

**angebotskalender_items** (hybrid offer system - 50+ items)

- `week_id`: references angebotskalender_weeks
- `menu_item_id`: nullable, references menu_items (for existing menu items)
- `custom_name`: nullable, custom item name (for combo offers)
- `custom_description`: nullable, description for custom items
- `base_price`: nullable, original price for custom items
- `special_price`: discounted price
- `highlight_badge`: optional badge (e.g., "Premium", "XXL", "Sparmenü")

**gallery_photos** (photo gallery - ✅ FULLY IMPLEMENTED)

- `category`: 'restaurant' | 'events' | 'eis'
- `image_url`, `thumbnail_url`
- `is_featured`: for home preview
- `display_order`: for sorting

**loyalty_codes** (database preserved for future v2 implementation)

- `code`: unique identifier
- `points`: value
- `valid_until`: expiration
- `max_uses`, `current_uses`: usage tracking
- **Note**: Table exists but no UI implementation in v1

**loyalty_transactions** (database preserved for future v2 implementation)

- `user_id`: who earned/redeemed
- `code_id`: which code was used
- `type`: 'earned' | 'redeemed'
- `points`: amount
- **Note**: Table exists but no UI implementation in v1

### Push Notification Tables

**push_tokens** (device registration - ✅ FULLY IMPLEMENTED)

- `id`: uuid (primary key)
- `user_id`: references auth.users
- `token`: Expo push token
- `device_info`: device metadata
- `is_active`: token validity status
- `last_used`: automatic deactivation after 60 days
- `notification_settings`: weeklyOffers, eventReminders, appUpdates only

**notification_history** (sent notifications log - ✅ FULLY IMPLEMENTED)

- `id`: uuid (primary key)
- `type`: notification type (weekly_offer, event_reminder, etc.)
- `title`, `body`: notification content
- `sent_to_count`: number of recipients
- `created_at`: timestamp

**scheduled_notifications** (future notifications queue - ✅ FULLY IMPLEMENTED)

- `id`: uuid (primary key)
- `type`: notification type
- `title`, `body`: notification content
- `scheduled_for`: when to send
- `target_audience`: who receives it
- `sent`: processing status

### Important RLS Policies

- **events table**: Requires public read policy for events to display
- **profiles table**: Users can only read/write their own profile
- **push_tokens table**: Users can only manage their own tokens

## Settings & User Preferences - ✅ FULLY IMPLEMENTED

The app includes a comprehensive settings system with proper navigation and data persistence:

### Settings Screens

- **NotificationSettings**: Toggle switches for weekly offers, events, app updates (3 options)
- **LanguageSettings**: German/English selection (ready for full i18n integration)
- **HelpSupport**: FAQ section with social media info, contact options
- **AboutUs**: Restaurant history, values, contact info, app version

### Data Persistence

- **AsyncStorage Integration**: All user preferences stored locally
- **Settings Navigation**: Stack navigation from ProfileScreen
- **Consistent UI**: All screens follow app design patterns
- **Back Navigation**: Custom headers with back buttons

### Navigation Structure

```
ProfileScreen (Tab)
├─ NotificationSettings (Stack)
├─ LanguageSettings (Stack)
├─ HelpSupport (Stack)
└─ AboutUs (Stack)
```

### User Preference Storage

- Notification toggles saved to AsyncStorage key: `notification_settings`
- Language preference saved to AsyncStorage key: `app_language`
- Settings load on screen mount and save immediately on change

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
- **Detail Modal**: Full item descriptions with allergen information

### Angebotskalender (Weekly Offers) - ✅ FULLY IMPLEMENTED

- **8 rotating weekly themes**: Burger, Türkische, Boxen, Schweine, Fleischteller, Wurst, Croque, Hähnchen
- **Hybrid System**: Both linked menu items AND custom combo offers
- **Manual Rotation**: SQL functions for week switching (rotate_to_next_week(), set_active_week())
- **Automatic Rotation**: update_active_week() function based on ISO calendar weeks
- **50+ Special Items**: Mix of existing menu items and custom combos (e.g., "Schaschlik mit Pommes")
- **Smart Display**: OffersService handles both types with getItemDisplayName()
- **HomeScreen Integration**: Horizontal scroll showing all current week offers
- **MenuScreen Filter**: Shows only linked menu items (custom combos don't appear here - by design)
- **Visual Indicators**: "ANGEBOT" badges, strikethrough pricing, savings calculations

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
- **Date Format**: Uses YYYY-MM-DD for proper comparison with database

### Home Screen Hub

- **Gallery Preview**: Horizontal scroll of featured photos with category badges
- **Quick Actions**: Restaurant call, directions, menu, events access
- **Weekly Offers Banner**: Horizontal scroll showing all discounted items
- **Social Media CTA**: Instagram follow button with direct link
- **Touch-optimized**: ScrollView separated from TouchableWithoutFeedback
- **Visual Appeal**: Restaurant header image with overlay text
- **Status Indicators**: Real-time open/closed status with colored badges
- Central access point for key features

### Profile & Social Media

- **Social Media Card**: Facebook & Instagram links (@grillmaier149)
- Quick action buttons for menu, chat, events
- Favorites management (menu items & events)
- Settings access with stack navigation
- **No Loyalty UI**: Points display removed for v1 release

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

- Opening hours: 11:00-21:00 daily (except Christmas Eve)
- Location: Langer Rehm 25, 24149 Kiel-Dietrichsdorf
- Three business areas: Imbiss, Eventgastronomie, Eis-Spezialitäten
- Seasonal focus: Events May-September

### Push Notifications System - ✅ FULLY IMPLEMENTED

The app includes a complete push notification system with automation and admin controls:

#### Features

- **Automated Weekly Offers**: Every Monday at 10:00 AM (German time)
- **Event Reminders**: Day before at 6:00 PM automatically
- **Manual Notifications**: Admin panel for custom messages
- **Deep Linking**: Opens specific app screens from notifications
- **Quiet Hours**: No notifications between 21:00-11:00
- **User Preferences**: Full control via NotificationSettings

#### Technical Implementation

- **3 Edge Functions Deployed**:
  - `send-notification`: Handles actual push delivery via Expo
  - `schedule-notifications`: Creates scheduled notifications
  - `notification-cron`: Processes queue hourly
- **Dashboard Deployment**: No Docker required, deployed via Supabase Dashboard
- **Automation**: Cron job runs every hour to process scheduled notifications
- **Security**: RLS policies protect user data and tokens
- **Token Management**: Automatic deactivation after 60 days of inactivity

#### Cost Analysis

- **Current Usage**: < €0.50/month (0.17% of Supabase free tier)
- **At 10,000 users**: Still within free tier (< €1/month)
- **Expo Push Service**: Always free, unlimited notifications

### Current Implementation Status

#### ✅ FULLY IMPLEMENTED FEATURES

- **Menu System**: 125+ items with categories, search, favorites, detail modals
- **Weekly Offers System**: 8 rotating themes, 50+ items (hybrid linked/custom)
- **Events Calendar**: List/calendar views, favorites, date selection, RLS policies fixed
- **AI Chatbot**: Google Gemini integration, bilingual, chat history
- **Photo Gallery**: 3 categories, full-screen viewer, share functionality
- **Push Notifications**: Complete system with automation and admin panel
- **User Settings**: 4 settings screens with AsyncStorage persistence
- **Authentication**: Supabase Auth with profile management
- **Home Dashboard**: Quick actions, offers preview, gallery preview
- **Real-time Updates**: Supabase subscriptions for live data

#### ✅ CORE SERVICES IMPLEMENTED

- **OffersService**: Handles both linked menu items and custom combos
- **MenuService**: Menu loading, categories, real-time updates
- **EventsService**: Event management with favorites, proper date filtering
- **ChatService**: Message persistence and Gemini API integration
- **GalleryService**: Photo categorization and featured system
- **AuthService**: User authentication and profile management
- **NotificationService**: Push token management, permission handling, notification delivery

#### ✅ DATABASE FULLY CONFIGURED

- **Complete Schema**: 13 tables with proper relationships (including push notification tables)
- **Weekly Rotation**: SQL functions for manual/automatic switching
- **Hybrid Offers**: Both menu items and custom combo support
- **User Data**: Profiles, favorites, chat history, loyalty points (DB only)
- **Push Notifications**: Token management, history tracking, scheduled queue
- **RLS Policies**: Security configured for all tables (events table requires public read policy)

#### 🔮 FUTURE FEATURES (v2)

- **Loyalty Program**: QR scanner, points UI, transaction history (DB tables ready)
- **Google Maps integration**: Interactive maps for restaurant and events
- **Caching layer**: Optimize chatbot responses
- **Full i18n**: Complete German/English translations

## Known Issues & Solutions

1. **OpenAI incompatibility**: ✅ Fixed - Switched to Google Gemini with direct fetch
2. **Menu table naming**: ✅ Fixed - Use `menu_items` not `speisekarte`
3. **TypeScript strict mode**: ✅ Configured - Handle nulls properly
4. **Supabase RLS**: ✅ Configured - Proper policies for all tables
5. **Chat saving**: ✅ Fixed - ChatMessageService integration working
6. **ScrollView in TouchableOpacity**: ✅ Avoided - Never nest ScrollView inside Touchable components
7. **Settings Navigation**: ✅ Fixed - All settings screens now have working navigation
8. **Custom Offers Display**: ✅ Fixed - OffersService handles both linked and custom items
9. **Weekly Rotation**: ✅ Implemented - SQL functions for week switching
10. **Docker Edge Functions**: ✅ Bypassed - Dashboard deployment without Docker
11. **Push Notifications**: ✅ Implemented - Complete system with automation
12. **Events Not Displaying**: ✅ Fixed - RLS policies added, date format corrected to YYYY-MM-DD

## Testing & Development Notes

- **Code Quality**: ESLint and Prettier configured
  - Run linting: `npx eslint src/`
  - Format code: `npx prettier --write src/`
- **Testing**: No test framework configured yet
- **Mobile Testing**: Use Expo Go app
- **Backend**: Development uses real Supabase instance (no local emulator)
- **SQL Files**:
  - `supabase-weekly-rotation.sql` - Weekly rotation functions
  - `supabase-combo-offers-inserts.sql` - Custom combo items
  - `supabase-migration-extend-offers.sql` - Table extensions
- **Documentation Files**:
  - `docs/push-notifications-complete-guide.md` - Full notification system documentation
  - `docs/deploy-via-dashboard.md` - Edge Function deployment guide
  - `docs/project_plan.md` - Overall project status and timeline
  - `docs/FOLDER_STRUCTURE.md` - Detailed folder structure

## Weekly Offers Management

### Manual Week Rotation

Use these SQL commands in Supabase SQL Editor:

```sql
-- Rotate to next week in sequence (1→2→3...→8→1)
SELECT rotate_to_next_week();

-- Set specific week (1-8)
SELECT set_active_week(3);  -- Switch to Boxen Woche

-- View rotation schedule
SELECT * FROM get_rotation_schedule();

-- Check current active week
SELECT week_number, week_theme FROM angebotskalender_weeks WHERE is_active = true;
```

### Week Themes (1-8)

1. **Burger Woche**: Mix of linked items + custom "Riesen Hot Dog"
2. **Türkische Woche**: All linked menu items
3. **Boxen Woche**: Mix with normal + XXL sizes
4. **Schweine Woche**: Schnitzel + custom "Schaschlik mit Pommes"
5. **Fleischteller Woche**: Custom "Balkanteller" + "Kombiteller"
6. **Wurst Woche**: Mix with custom combo plates
7. **Croque Woche**: Street-named croques + custom combo
8. **Hähnchen Woche**: All custom items (nuggets with sides)

## German Language Context

The app is primarily for German users. Key German terms used:

- "Moin" - North German greeting
- "Speisekarte" - Menu
- "Angebote" - Offers/Specials
- "Angebotskalender" - Offers calendar
- "Punkte sammeln" - Collect points
- "Veranstaltungen" - Events
- "Fotogalerie" - Photo gallery
- "Eindrücke" - Impressions (for gallery)

Default language is German, with English as secondary option in chatbot.

## Next Development Priorities

### 1. App Store Submission (High Priority)

- **Beta Testing**: Test with selected users
- **Store Assets**: Screenshots, descriptions, keywords
- **Privacy Policy**: GDPR-compliant documentation
- **App Review**: Prepare for Apple/Google review process

### 2. Enhanced Features (Ongoing)

- **Google Maps**: Interactive maps for location and events
- **Performance**: Image caching, chat optimization
- **Offline Mode**: Basic functionality without internet
- **Full i18n**: Complete bilingual support

## UX Principles

1. **No Navigation Complexity**: Bottom tabs only, features integrated into existing screens
2. **Progressive Disclosure**: Show previews on home, expand to full views
3. **Contextual Placement**: Features where users expect them (social media in profile, offers with menu)
4. **Visual First**: Gallery preview attracts on home screen
5. **Focus on Working Features**: v1 shows only fully implemented features, no placeholders