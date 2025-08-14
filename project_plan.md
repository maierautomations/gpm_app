# Grill-Partner Maier App - Development Plan

## 📋 Project Overview

Mobile app for Grill-Partner Maier restaurant in Kiel, Germany. A React Native Expo application featuring digital menu, AI chatbot, event calendar, and loyalty program.

## 🎯 Business Goals

- Increase customer retention by 20% through loyalty program
- Boost event attendance with real-time calendar
- Improve customer satisfaction with bilingual AI support
- Modernize customer engagement for a traditional restaurant (seit 1968)

## 📱 Target Audience

1. **Regular Locals (45-60)**: Daily menu browsers, loyalty rewards users
2. **Event Visitors (25-40)**: Festival attendees, seasonal customers
3. **Families**: Need allergen info, parking details, kid-friendly options

## 🏗 Current Project Status

### ✅ Completed Components

- Basic React Native Expo setup
- Navigation structure (5 tabs: Home, Menu, Events, Chat, Profile)
- Supabase client configuration
- Authentication service (sign up/in/out)
- User state management (Zustand)
- Push notification handler
- Package dependencies installed (Vercel AI SDK, OpenAI, PostHog)
- Database schema and types
- All UI screens (currently placeholders)
- Supabase data integration
- AI chatbot functionality
- Menu system with real data

### ❌ Pending Implementation

- Loyalty program
- Event calendar
- Styling and theming

## 🚀 Development Roadmap

### Phase 1: Foundation & Core Data (Days 1-3)

**Goal**: Establish data layer and core functionality

#### 1. Environment Setup

- [ ] Create `.env.local` with credentials:
  ```
  EXPO_PUBLIC_SUPABASE_URL=
  EXPO_PUBLIC_SUPABASE_ANON_KEY=
  EXPO_PUBLIC_OPENAI_API_KEY=
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
  ```

#### 2. Supabase Integration

- [x] Generate database types from existing schema
- [x] Verify Speisekarte table structure
- [x] Set up Row Level Security (RLS) policies
- [x] Create profiles table (if not exists):
  ```sql
  profiles (
    id uuid references auth.users primary key,
    name text,
    favorites jsonb,
    loyalty_points integer default 0,
    created_at timestamp
  )
  ```

#### 3. Folder Structure

```
src/
├── components/
│   ├── menu/
│   │   ├── MenuItem.tsx
│   │   ├── MenuCategory.tsx
│   │   └── MenuFilter.tsx
│   ├── chat/
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   └── TypingIndicator.tsx
│   ├── events/
│   │   ├── EventCard.tsx
│   │   └── EventCalendar.tsx
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── Card.tsx
├── services/
│   ├── menu/
│   │   └── menuService.ts
│   ├── chat/
│   │   └── chatService.ts
│   ├── events/
│   │   └── eventsService.ts
│   └── loyalty/
│       └── loyaltyService.ts
├── hooks/
│   ├── useMenu.ts
│   ├── useChat.ts
│   └── useRealtime.ts
├── utils/
│   ├── i18n.ts
│   ├── formatters.ts
│   └── constants.ts
└── types/
    └── index.ts
```

### Phase 2: Menu System (Days 4-6)

**Goal**: Fully functional digital menu with real-time updates

#### Features to Implement

- [ ] Menu service with Supabase queries
- [ ] Category filtering (Imbiss, Events, Eis)
- [ ] Item detail view with images
- [ ] Allergen information display
- [ ] Favorites functionality (logged-in users)
- [ ] Real-time availability updates
- [ ] Search functionality

#### Technical Implementation

```typescript
// menuService.ts
- fetchMenuItems(category?: string)
- toggleFavorite(itemId: string)
- subscribeToUpdates()
```

### Phase 3: AI Chatbot (Days 7-10)

**Goal**: Intelligent bilingual assistant using Vercel AI SDK

#### Features to Implement

- [ ] Chat UI with message history
- [ ] Streaming responses using Vercel AI SDK
- [ ] Language detection (German/English)
- [ ] Context about restaurant (hours, menu, location)
- [ ] Chat history persistence in Supabase
- [ ] Quick action buttons (hours, directions, menu)

#### Technical Stack

```typescript
// chatService.ts using Vercel AI SDK
- streamChat(message: string, language: 'de' | 'en')
- saveMessage(message: ChatMessage)
- loadChatHistory()
```

### Phase 4: Events & Location (Days 11-13)

**Goal**: Event discovery and restaurant information

#### Events Calendar

- [ ] Events list/calendar view
- [ ] Event details (date, location, offerings)
- [ ] Push notifications for events
- [ ] Filter by month/type
- [ ] Integration with device calendar

#### Location Features

- [ ] Google Maps integration
- [ ] Parking information
- [ ] One-tap calling
- [ ] Hours display
- [ ] Directions button

### Phase 5: Authentication & Profile (Days 14-15)

**Goal**: Complete user management system

#### Features

- [ ] Login/Signup UI
- [ ] Email verification flow
- [ ] Profile management
- [ ] Password reset
- [ ] Favorites view
- [ ] Order history (future)

### Phase 6: Loyalty Program (Days 16-18)

**Goal**: Points-based reward system

#### Implementation

- [ ] QR code scanner (expo-barcode-scanner)
- [ ] Points tracking table
- [ ] Rewards catalog
- [ ] Points history
- [ ] Redemption flow
- [ ] Event-specific bonuses

#### Database Schema

```sql
loyalty_transactions (
  id uuid primary key,
  user_id uuid references profiles,
  points integer,
  type text, -- 'earned' | 'redeemed'
  description text,
  created_at timestamp
)
```

### Phase 7: UI/UX Polish (Days 19-21)

**Goal**: Professional, consistent design

#### Tasks

- [ ] Implement Tamagui theming
- [ ] Loading states for all screens
- [ ] Error handling and recovery
- [ ] Empty states design
- [ ] Animations (React Native Reanimated)
- [ ] Dark mode support
- [ ] Accessibility features

### Phase 8: Notifications & Analytics (Days 22-23)

**Goal**: Engagement and insights

#### Push Notifications

- [ ] Weekly offers (Angebotskalender)
- [ ] Event reminders
- [ ] Personalized based on favorites
- [ ] Notification preferences

#### Analytics (PostHog)

- [ ] Screen tracking
- [ ] User events
- [ ] Conversion tracking
- [ ] Error monitoring

### Phase 9: Testing & Optimization (Days 24-26)

**Goal**: Production-ready app

#### Testing

- [ ] Unit tests for services
- [ ] Integration tests
- [ ] Device testing (iOS/Android)
- [ ] Performance optimization
- [ ] Memory leak detection

### Phase 10: Deployment (Days 27-28)

**Goal**: Launch to app stores

#### Steps

- [ ] Production environment setup
- [ ] App store assets preparation
- [ ] Privacy policy & terms
- [ ] Beta testing with TestFlight/Play Console
- [ ] App store submission
- [ ] Marketing materials

## 📊 Success Metrics

- **Downloads**: 1,000 in first 3 months
- **Active Users**: 500 monthly
- **Loyalty Redemption**: 10% of users within first month
- **Push Open Rate**: 30%
- **App Rating**: 4.5+ stars

## 🔧 Technical Stack

- **Framework**: React Native + Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI**: Vercel AI SDK + OpenAI (gpt-4o-mini)
- **State**: Zustand
- **Navigation**: React Navigation
- **UI**: Tamagui
- **Analytics**: PostHog
- **Notifications**: Expo Push
- **Maps**: Google Maps API

## 🚦 Risk Mitigation

1. **API Rate Limits**: Implement caching, use gpt-4o-mini for cost
2. **Offline Support**: Cache critical data, show appropriate messages
3. **Performance**: Lazy loading, image optimization, pagination
4. **Security**: RLS policies, secure credential storage, input validation

## 📝 Next Immediate Actions

1. **Set up environment variables**
2. **Generate Supabase types**
3. **Create service architecture**
4. **Implement Menu screen** (highest visibility)
5. **Build Chatbot** (key differentiator)

## 🎯 MVP Deliverables (Week 1)

- Working menu with real data
- Basic chatbot functionality
- User authentication
- Profile management
- Core navigation

## 📅 Timeline Summary

- **Week 1**: Foundation + Menu + Auth
- **Week 2**: Chatbot + Events
- **Week 3**: Loyalty + Location
- **Week 4**: Polish + Testing + Deployment

## 💡 Future Enhancements (Post-Launch)

- Voice mode for chatbot
- Online ordering system
- Table reservations
- Admin dashboard
- Multi-language support (Polish, Turkish)
- Integration with POS system
- Customer feedback system
- Social media integration

---

_Document Version: 1.0_
_Last Updated: 2025_
_Status: Active Development_
