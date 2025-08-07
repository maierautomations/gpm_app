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
```

## Architecture Overview

This is a React Native Expo app for Grill-Partner Maier, a German restaurant in Kiel (since 1968). The architecture follows a service-oriented pattern:

### Core Stack
- **Frontend**: React Native 0.79.5 with Expo SDK 53
- **State Management**: Zustand for global state (user authentication)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Navigation**: React Navigation with bottom tabs
- **AI Integration**: OpenAI API (direct fetch, not OpenAI library - React Native compatibility issue)

### Key Architectural Decisions

1. **Service Layer Pattern**: All Supabase interactions go through service classes in `src/services/`
   - Each domain has its own service (MenuService, EventsService, ChatService)
   - Services return typed data from `database.types.ts`
   - Real-time subscriptions handled at service level

2. **Environment Variables**: Use `.env.local` (Expo convention) with `EXPO_PUBLIC_` prefix
   - Required: SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
   - Optional: GOOGLE_MAPS_API_KEY, POSTHOG keys

3. **Authentication Flow**: 
   - Supabase Auth with email/password
   - User profiles table synced with auth.users
   - ExpoSecureStore for token persistence

## Database Schema

### Primary Tables

**menu_items** (125+ items)
- `id`: number (primary key)
- `name`: string
- `price`: string (numeric in Postgres)
- `category`: string (dynamic categories)
- `is_available`: boolean
- `allergens`: jsonb
- `image_url`: string

**profiles**
- `id`: uuid (references auth.users)
- `favorites`: number[] (menu_item IDs)
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

## Key Implementation Details

### Menu System
- Categories dynamically loaded from database (not hardcoded)
- Real-time updates via Supabase subscriptions
- Favorites stored as number array in profiles
- Price handling: Postgres numeric type returns as string, parse for display

### AI Chatbot
- **Important**: Direct fetch API, not OpenAI library (React Native incompatibility)
- Bilingual (German/English) with automatic detection
- System prompt includes restaurant info and current menu context
- Knowledge base in `ChatService` includes hours, location, specialties

### Restaurant-Specific Features
- Opening hours: 11:00-22:00 daily (except Christmas Eve)
- Location: Langer Rehm 25, 24149 Kiel-Dietrichsdorf
- Three business areas: Imbiss, Eventgastronomie, Eis-Spezialitäten
- Loyalty program with QR code scanning (pending implementation)

### Current Implementation Status
✅ Menu with 125 items from database
✅ Home dashboard with quick actions
✅ Events calendar with mock data
✅ AI chatbot with knowledge base
✅ Basic authentication
❌ Loyalty system (QR codes, points)
❌ Google Maps integration
❌ Push notifications setup
❌ Photo gallery

## Known Issues & Solutions

1. **Chatbot not working**: OpenAI library doesn't work in React Native. Solution implemented: use fetch API directly
2. **Menu not showing**: Table name is `menu_items` not `speisekarte`, column is `is_available` not `available`
3. **TypeScript strict mode**: Enabled in tsconfig.json, handle nulls properly
4. **Supabase RLS**: Ensure public read policy on menu_items table

## Testing & Development Notes

- No test framework configured yet
- Use Expo Go app for mobile testing
- Mock data available in EventsService.getMockEvents() for testing
- Development uses real Supabase instance (no local emulator)

## German Language Context

The app is primarily for German users. Key German terms used:
- "Moin" - North German greeting
- "Speisekarte" - Menu
- "Angebotskalender" - Special offers calendar
- "Treuepunkte" - Loyalty points
- "Veranstaltungen" - Events

Default language is German, with English as secondary option in chatbot.