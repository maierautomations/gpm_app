# Grill-Partner Maier Mobile App

## Overview

This is a React Native mobile application for Grill-Partner Maier, a family-run restaurant in Kiel, Germany, established in 1968. The app enhances customer engagement through features like a digital menu, AI chatbot, event calendar, loyalty program, and more. It focuses on Maiers Imbiss (traditional German fast food), Maiers Eventgastronomie (seasonal event catering), and Maiers Eis-Spezialitäten (ice cream specialties).

The app is built with React Native using Expo, Supabase for backend services, OpenAI for the chatbot, and other libraries for notifications and analytics.

## Features

- **Digital Menu**: Browse real-time menu with images, prices, and allergen info.
- **AI Chatbot**: Bilingual (German/English) support for queries on menu, hours, directions, etc.
- **Event Calendar**: View upcoming events with details and push reminders.
- **Loyalty Program**: Earn and redeem points via QR scanning.
- **User Profiles**: Manage favorites, points, and notifications.
- **Location Info**: Maps, parking details, and one-tap calling.
- **Photo Gallery**: View images of food, events, and ambiance.
- **Push Notifications**: For weekly offers and events.

## Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account and project
- OpenAI API key
- Google Maps API key (for location features)
- Expo account for push notifications

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-repo/grill-partner-maier-app.git
   cd grill-partner-maier-app
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following:
   ```
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   OPENAI_API_KEY=your-openai-api-key
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   POSTHOG_PROJECT_ID=your-posthog-project-id
   POSTHOG_API_KEY=your-posthog-api-key
   ```

## Running the App

- Start the Expo development server:

  ```
  npm start
  ```

- For Android/iOS simulators, use Expo Go app or run:
  ```
  npm run android
  npm run ios
  ```

## Database Setup (Supabase)

1. Create a Supabase project.
2. Set up tables for users, menu items, events, loyalty points, etc., as per the PRD.
3. Enable Row Level Security (RLS) on tables.
4. Configure real-time subscriptions for menu and event updates.

## Development

- **State Management**: Zustand
- **Navigation**: React Navigation
- **UI Components**: Custom components with potential Tamagui integration
- **Analytics**: PostHog
- **Notifications**: Expo Push Notifications

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License.

For more details, refer to the [PRD](prd.md).
