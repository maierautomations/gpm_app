1. Document Information
   Document Title: PRD for Grill-Partner Maier Mobile App
   Version: 1.0
   Date: July 18, 2025
   Author: Grok (AI Assistant, based on user specifications)
   Project Owner: Dominik Maier (for Grill-Partner Maier business)
   Status: Draft (Subject to review and iteration)
   Purpose: This PRD outlines the requirements, features, user flows, and high-level design for a mobile app supporting the Grill-Partner Maier restaurant business in Kiel, Germany. It focuses on enhancing customer engagement through digital tools while aligning with the business's traditional roots since 1968.
2. Executive Summary
   The Grill-Partner Maier Mobile App is a React Native-based application designed to serve as a companion for customers of the family-run restaurant business. The app emphasizes three core areas: Maiers Imbiss (traditional German fast food), Maiers Eventgastronomie (seasonal event catering from May to September), and Maiers Eis-Spezialitäten (ice cream specialties). It provides value through real-time information, loyalty rewards, and customer service without introducing complex e-commerce features like online ordering or event booking.

Key objectives:

Increase customer loyalty and repeat visits among local regulars (45-60 age group).
Attract event visitors (25-40 age group) by highlighting festival presence.
Support families with practical info like allergens and parking.
Drive engagement via push notifications for weekly offers and events.
The app will be built using React Native with Expo for cross-platform (iOS/Android) support, Supabase for database and auth, Vercel AI SDK with OpenAI for the chatbot, and other tools for notifications and analytics. Estimated development timeline: 8 weeks (MVP in 4 weeks).

3. Business Objectives
   Primary Goals:
   Boost customer retention by 20% through loyalty program and personalized favorites.
   Increase event attendance by providing real-time calendar and location details.
   Improve customer satisfaction with bilingual AI support and allergen transparency.
   Collect user data (with consent) for targeted notifications, while ensuring GDPR compliance.
   Success Metrics:
   App downloads: 1,000 in first 3 months.
   Active users: 500 monthly (tracked via PostHog/Mixpanel).
   Loyalty points redeemed: 10% of users within first month.
   Push open rate: 30% for offers/events.
   User ratings: 4.5+ on app stores.
   Constraints:
   No online payments/ordering to avoid complexity.
   Seasonal focus on events (May-Sep).
   Bilingual (German primary, English secondary).
   Free for users; monetized via business growth.
4. Target Audience
   Persona 1: Regular Local Customers (45-60 years old):
   Demographics: Kiel residents, middle-aged, tech-familiar but prefer simple apps.
   Needs: Loyalty rewards, weekly offers notifications, easy menu browsing.
   Pain Points: Forgetting offers, wanting quick allergen checks.
   App Usage: Daily for menu/offers, weekly for loyalty points.
   Persona 2: Event Visitors (25-40 years old):
   Demographics: Younger adults attending festivals like Kieler Woche.
   Needs: Event calendar, location finder, what we're offering at events.
   Pain Points: Hard to find vendors at large events.
   App Usage: Seasonal, event-specific (push reminders).
   Persona 3: Families:
   Demographics: Parents with kids, mixed ages, focus on safety/convenience.
   Needs: Allergen info, parking details, family-friendly menu highlights (e.g., ice cream).
   Pain Points: Dietary restrictions, navigation to location.
   App Usage: Occasional, for planning visits.
5. Features and Requirements
   5.1 Must-Have Features
   Digital Menu:
   Real-time updates from Supabase (e.g., price changes, availability).
   High-quality images (from Supabase Storage).
   Allergen information (JSONB array, displayed as list).
   Categories: Imbiss, Events, Eis.
   Favorites: Users can mark items (saved to profiles).
   No ordering—just browsing.
   AI Chatbot (German/English):
   Vercel AI SDK with OpenAI (gpt-4o-mini for cost-efficiency).
   Handles questions on hours (11:00-21:00, 364 days/year), menu, directions, allergens.
   Streaming responses for natural feel.
   Bilingual: Detect language from input or device settings.
   Chat history saved in Supabase for persistence.
   Event Calendar:
   List/map view of events (May-Sep, e.g., weddings, festivals).
   Details: Date, location, offerings (linked to menu items).
   Real-time updates from Supabase.
   Push reminders for upcoming events.
   Restaurant Location:
   Static address: Langer Rehm 25, 24149 Kiel-Dietrichsdorf.
   One-tap calling (expo-linking).
   Google Maps integration (react-native-maps, with API key).
   Parking info (static text/images).
   User Accounts:
   Supabase Auth (email/password).
   Profile management: Edit name, view favorites.
   Auto-create profile on signup (via trigger).
   Loyalty Program:
   QR code scanner (expo-barcode-scanner) for in-store points.
   Points system: 1€ = 1 point (tracked in Supabase table).
   Rewards: Redeem points for free items (e.g., 100 pts = free Frikadelle).
   View points history/balance in profile.
   Push Notifications:
   Expo Push for weekly offers (Angebotskalender from Supabase).
   Event reminders (opt-in).
   Personalized based on favorites/location.
   Photo Gallery:
   Grid view of images from Supabase Storage (food, events, ambiance).
   Categories: Imbiss, Events, Eis.
   5.2 Non-Functional Requirements
   Performance: Load times <2s, real-time updates via Supabase subscriptions.
   Security: RLS on all tables, secure auth (Expo SecureStore), GDPR-compliant (consent for notifications/data).
   Accessibility: VoiceOver support, alt text for images, high contrast.
   Bilingual: i18n-js for strings, auto-detect language.
   Offline: Basic (cached menu via Supabase offline), warnings for real-time features.
   Analytics: PostHog for usage tracking (screen views, auth events).
   Platforms: iOS/Android, tested on Expo Go/dev builds.
   5.3 Nice-to-Have (Post-MVP)
   Voice mode for chatbot (if Grok 3 voice available).
   Dark mode (Tamagui themes).
   Share events/menu items via social.
   Admin dashboard for menu/event updates (web companion).
6. User Flows
   6.1 Onboarding Flow
   Download/open app.
   Splash screen (restaurant logo).
   Home tab: Welcome message, prompt to create account (optional for guest browsing).
   If sign up: Email/password form > Verify email (Supabase) > Profile auto-created > Redirect to Home.
   6.2 Menu Browsing Flow (Guest/User)
   Menu tab.
   List categories/items with images, prices, allergens.
   Tap item: Detail view (description, add to favorites if logged in).
   Real-time: Availability changes reflected instantly.
   6.3 Auth Flow
   Profile tab (if not logged in): Sign in/up form.
   Sign up: Enter email/password > Success > Welcome screen, edit profile (name).
   Sign in: Email/password > Success > Profile view (name, favorites, points).
   Logout: Button > Confirm > Back to login form.
   6.4 Loyalty Flow (Logged In)
   Profile > Loyalty section: View points, history.
   In-store: Scan QR (generated by staff) > Add points (e.g., based on spend).
   Redeem: Select reward > Confirm > Deduct points.
   6.5 Event Calendar Flow
   Events tab: Calendar/list view.
   Select event: Details (date, location, offerings).
   Enable notifications: Opt-in for reminders.
   6.6 Chatbot Flow
   Chat tab: Open conversation.
   Type query (e.g., "Was ist im Schaschlik?"): AI responds in detected language.
   History persists across sessions.
   6.7 Location Flow
   Location tab or button: Map view, address, parking text, call button.
   6.8 Notifications Flow
   App open: Request permissions.
   Background: Receive offer/event push > Tap > Open relevant tab (e.g., Menu for offers).
7. Technical Stack (As Specified)
   Frontend: React Native + Expo.
   Backend/DB: Supabase (PostgreSQL, real-time, storage, auth).
   AI: Vercel AI SDK + OpenAI.
   State: Zustand/Context API.
   Navigation: React Navigation.
   Analytics: PostHog.
   Notifications: Expo Push.
   UI: Tamagui for themed components.
8. Assumptions and Dependencies
   Assumptions: Users have modern iOS/Android devices; internet for real-time features.
   Dependencies: Supabase project setup, OpenAI API key, Google Maps API key.
   Risks: API rate limits (OpenAI/Supabase), device permissions (notifications/scanner).
9. Development Roadmap (High-Level, 8 Weeks)
   Week 1: Setup, auth, profiles (done).
   Week 2: Digital menu, real-time.
   Week 3: Chatbot, event calendar.
   Week 4: Location, MVP test/deploy.
   Week 5: Loyalty, notifications.
   Week 6: Gallery, UI polish (Tamagui).
   Week 7: Bilingual, accessibility, testing.
   Week 8: Deployment to stores, feedback iteration.
