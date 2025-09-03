# 🍔 Grill-Partner Maier Mobile App

<div align="center">

![App Icon](https://img.shields.io/badge/📱-React%20Native-61DAFB?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)

**Modern mobile app for a traditional German restaurant in Kiel**  
*Family tradition since 1968 • 2nd Generation • 364 days open*

</div>

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🛠️ Development](#️-development)
- [📱 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

**Grill-Partner Maier App** is a comprehensive mobile solution for a beloved family restaurant in Kiel-Dietrichsdorf, Germany. Established in 1968, this 2nd generation family business serves traditional German fast food, provides seasonal event catering, and creates artisanal ice cream specialties.

### 🎪 Business Areas
- **🥘 Imbiss**: Traditional German fast food & daily specials
- **🎉 Eventgastronomie**: Seasonal catering (May-September) 
- **🍨 Eis-Spezialitäten**: Handcrafted ice cream varieties

### 📍 Location
**Langer Rehm 25, 24149 Kiel-Dietrichsdorf**  
📞 **+49 173 466 1549**  
🕐 **11:00-21:00 daily** (except Christmas Eve)  
🅿️ **Free parking** directly at restaurant

## ✨ Features

### 🎯 Core Features
- **📋 Digital Menu** - 125+ items with real-time availability, prices, and allergen info
- **🤖 AI Chatbot** - Bilingual (German/English) assistant powered by Google Gemini
- **📅 Event Calendar** - Seasonal events with favorites and push reminders
- **🔥 Weekly Offers** - Rotating 8-week special deals with hybrid pricing
- **📸 Photo Gallery** - Restaurant, events, and ice cream showcase
- **👤 User Profiles** - Favorites management and settings

### 🏆 Advanced Features
- **🎯 QR Loyalty System** - Earn and redeem points (ready for implementation)
- **📱 Real-time Updates** - Live menu changes via Supabase subscriptions
- **🌐 Offline Support** - Cached data for reliable experience
- **📍 Location Integration** - Maps, directions, and parking info
- **🔔 Push Notifications** - Weekly offers and event reminders

## 🏗️ Architecture

### 🛠️ Tech Stack
- **Frontend**: React Native 0.79.5 + Expo SDK 53
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **AI**: Google Gemini Flash (95% cost savings vs OpenAI)
- **State**: Zustand for global state management
- **Navigation**: React Navigation with bottom tabs
- **UI**: Custom components + Ionicons
- **Analytics**: PostHog (configured)
- **Notifications**: Expo Push Notifications

### 📁 Project Structure
```
src/
├── app/                 # App configuration & navigation
├── features/            # Feature-based modules
│   ├── menu/           # Menu browsing & search
│   ├── chat/           # AI chatbot with context
│   ├── events/         # Calendar & event management
│   ├── offers/         # Weekly specials system
│   ├── profile/        # User management & settings
│   ├── gallery/        # Photo viewing & sharing
│   └── settings/       # App preferences
├── shared/             # Reusable components
├── services/           # Core services (Supabase)
├── stores/             # Global state (Zustand)
├── theme/              # Design system
├── i18n/               # Internationalization
└── types/              # TypeScript definitions
```

### 🗄️ Database Schema
- **menu_items** - 125+ food items with categories
- **angebotskalender_weeks** - 8 rotating special offer themes
- **angebotskalender_items** - Hybrid linked/custom offers
- **events** - Seasonal catering calendar
- **profiles** - User data with favorites
- **chat_messages** - AI conversation history
- **gallery_photos** - Categorized restaurant images
- **loyalty_codes** - QR point validation system

## 🚀 Quick Start

### 📋 Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Supabase** account
- **Google Gemini** API key
- **iOS Simulator** / **Android Emulator** / **Expo Go** app

### 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/grill-partner-maier-app.git
   cd grill-partner-maier-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   ```bash
   npm run ios       # iOS Simulator
   npm run android   # Android Emulator
   npm run web       # Web browser
   ```

## ⚙️ Configuration

### 🗄️ Database Setup (Supabase)

1. **Create a Supabase project** at [supabase.com](https://supabase.com)

2. **Run database migrations** (copy from `/supabase-*.sql` files):
   - `supabase-migration-extend-offers.sql` - Hybrid offers system
   - `supabase-combo-offers-inserts.sql` - Sample special offers
   - `supabase-weekly-rotation.sql` - Week rotation functions

3. **Enable Row Level Security (RLS)** for all tables

4. **Configure authentication** - Email/password enabled

5. **Set up real-time subscriptions** for menu and offers updates

### 🔑 API Keys Setup

| Service | Purpose | Required |
|---------|---------|----------|
| **Supabase** | Backend & Database | ✅ Required |
| **Google Gemini** | AI Chatbot | ✅ Required |
| **Google Maps** | Location & Directions | ⚠️ Optional |
| **PostHog** | Analytics | ⚠️ Optional |

## 🛠️ Development

### 📝 Common Commands
```bash
# Start development
npm start

# Platform-specific development  
npm run android
npm run ios
npm run web

# Code quality
npx eslint src/
npx prettier --write src/

# Generate database types (when schema changes)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/services/supabase/database.types.ts
```

### 🎨 Code Style & Standards
- **TypeScript** strict mode enabled
- **ESLint** + **Prettier** configured
- **Feature-based architecture** for scalability
- **Service-layer pattern** for Supabase interactions
- **Consistent naming**: PascalCase components, camelCase functions

### 🔄 State Management
- **Zustand** for global state (user authentication)
- **Local state** with React hooks for component state
- **Real-time subscriptions** via Supabase for live data

### 🎯 Key Development Patterns
- **Service classes** handle all backend interactions
- **Feature folders** group related components/services
- **TypeScript types** generated from Supabase schema
- **Error boundaries** for graceful error handling

## 📱 Testing

### 🧪 Testing Strategy
- **Manual testing** with Expo Go app
- **Device testing** on iOS/Android simulators
- **Real device testing** for push notifications
- **Backend testing** via Supabase dashboard

### 🚀 Development Workflow
1. **Feature development** in feature branches
2. **Testing** on multiple devices/platforms
3. **Code review** and quality checks
4. **Staging deployment** via Expo
5. **Production release** to app stores

## 🚢 Deployment

### 📦 Build Configuration
```bash
# Create production build
npx eas build --platform all

# Submit to app stores
npx eas submit --platform all
```

### 🌍 Environment Setup
- **Development**: Local Supabase + test data
- **Staging**: Production Supabase + staging app
- **Production**: Live Supabase + app store releases

### 📱 App Store Requirements
- **iOS**: Apple Developer Account + App Store Connect
- **Android**: Google Play Console account
- **Assets**: App icons, screenshots, store descriptions
- **Privacy**: Privacy policy and terms of service

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 📋 Development Process
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** code style guidelines (ESLint + Prettier)
4. **Test** thoroughly on multiple devices
5. **Commit** with descriptive messages
6. **Create** a Pull Request with detailed description

### 🐛 Bug Reports
- Use GitHub Issues with bug template
- Include device info, steps to reproduce
- Add screenshots/videos if applicable

### 💡 Feature Requests
- Discuss in GitHub Issues first
- Consider impact on UX and performance
- Follow existing design patterns

## 📊 Project Status

### ✅ Implemented Features
- [x] **Menu System** - Full menu with search, categories, favorites
- [x] **AI Chatbot** - Google Gemini with German/English support
- [x] **Weekly Offers** - 8 rotating themes with hybrid pricing
- [x] **Event Calendar** - List/calendar views with favorites
- [x] **Photo Gallery** - Categorized images with full-screen viewer
- [x] **User Authentication** - Supabase auth with profiles
- [x] **Settings Screens** - About, Help, Language, Notifications
- [x] **Real-time Updates** - Live data sync via Supabase

### 🚧 In Progress
- [ ] **QR Loyalty Scanner** - Point collection system
- [ ] **Push Notifications** - Weekly offers and events
- [ ] **Google Maps Integration** - Interactive location features
- [ ] **Caching Layer** - Offline support optimization

### 📈 Success Metrics
- **Downloads**: Target 1,000 in first 3 months
- **Active Users**: Target 500 monthly active users
- **App Rating**: Target 4.5+ stars
- **User Engagement**: Track feature usage via PostHog

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Grill-Partner Maier**  
*Preserving tradition through modern technology*

[📱 Download App](#) • [🌐 Visit Website](#) • [📞 Call Restaurant](tel:+4917346615492)

</div>