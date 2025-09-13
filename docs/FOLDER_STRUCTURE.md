# Folder Structure Documentation

## Overview
This React Native Expo app follows a feature-based architecture with clear separation of concerns, making it scalable and maintainable.

## Structure

```
grill-partner-maier-app/
├── src/                          # All source code
│   ├── app/                      # Application-wide configuration
│   │   ├── App.tsx              # Main app component
│   │   └── navigation/          # Navigation setup
│   │       └── AppNavigator.tsx # Bottom tab navigation
│   │
│   ├── features/                # Feature-based modules
│   │   ├── menu/                # Menu feature
│   │   │   ├── components/      # Menu-specific components
│   │   │   ├── screens/         # Menu screens
│   │   │   ├── services/        # Menu business logic
│   │   │   └── types.ts         # Menu TypeScript types
│   │   │
│   │   ├── events/              # Events feature
│   │   ├── chat/                # Chat/AI assistant feature  
│   │   ├── offers/              # Weekly offers feature
│   │   ├── loyalty/             # Loyalty points feature
│   │   ├── gallery/             # Photo gallery feature
│   │   ├── auth/                # Authentication feature
│   │   ├── profile/             # User profile feature
│   │   └── home/                # Home screen feature
│   │
│   ├── shared/                  # Shared resources
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Button.tsx       # Common button component
│   │   │   ├── Card.tsx         # Card container component
│   │   │   └── LoadingSpinner.tsx # Loading indicator
│   │   ├── hooks/               # Custom React hooks (future)
│   │   ├── utils/               # Utility functions (future)
│   │   └── constants/           # App constants (future)
│   │
│   ├── services/                # Core services only
│   │   └── supabase/           # Supabase configuration
│   │       ├── client.ts        # Supabase client setup
│   │       └── database.types.ts # Generated database types
│   │
│   ├── stores/                  # Global state management
│   │   └── userStore.ts         # User authentication state
│   │
│   ├── theme/                   # Design system
│   │   ├── colors.ts            # Color palette
│   │   ├── typography.ts        # Font styles
│   │   ├── spacing.ts           # Spacing system
│   │   └── index.ts             # Theme export
│   │
│   ├── i18n/                    # Internationalization
│   │   └── locales/            # Translation files
│   │       ├── de.json          # German translations
│   │       └── en.json          # English translations
│   │
│   └── types/                   # Global TypeScript types
│       ├── navigation.ts        # Navigation types
│       └── index.ts             # Common types
│
├── assets/                      # Static assets (images, icons)
├── App.tsx                      # Entry point (delegates to src/app/App.tsx)
├── .eslintrc.js                 # ESLint configuration
├── .prettierrc                  # Prettier configuration
└── tsconfig.json                # TypeScript configuration
```

## Key Principles

### 1. Feature-Based Organization
Each feature is self-contained with its own:
- **components/**: UI components specific to that feature
- **screens/**: Screen components
- **services/**: Business logic and API calls
- **hooks/**: Custom hooks (if needed)
- **types.ts**: TypeScript type definitions

### 2. Import Paths
- Use relative imports within a feature
- Use absolute imports (from src root) for cross-feature imports
- Example: `import { Button } from '../../../shared/components/Button'`

### 3. Service Layer
- Feature services contain business logic
- Core services (like Supabase) stay in `/services`
- Services return typed data from database types

### 4. Shared Resources
- Components used across features go in `/shared/components`
- Global utilities go in `/shared/utils`
- Common hooks go in `/shared/hooks`

### 5. Type Safety
- Each feature has its own `types.ts`
- Global types in `/types`
- Database types generated from Supabase

## Adding New Features

1. Create feature folder: `src/features/[feature-name]/`
2. Add standard subfolders: `components/`, `screens/`, `services/`
3. Create `types.ts` for feature-specific types
4. Import from other features using proper paths
5. Add navigation if needed in `AppNavigator.tsx`

## Best Practices

1. **Keep features independent**: Minimize cross-feature dependencies
2. **Use the service layer**: All API calls through services
3. **Type everything**: Use TypeScript types consistently
4. **Follow naming conventions**: PascalCase for components, camelCase for functions
5. **Reuse shared components**: Don't duplicate common UI elements

## Development Workflow

1. **Start development**: `npm start`
2. **Run on iOS**: `npm run ios`
3. **Run on Android**: `npm run android`
4. **Run on web**: `npm run web`
5. **Type checking**: TypeScript runs automatically
6. **Linting**: ESLint configured for code quality
7. **Formatting**: Prettier for consistent code style

## Migration Notes

This structure was migrated from a flat structure to improve:
- Code organization and discoverability
- Feature isolation and modularity
- Scalability for future features
- Developer experience and onboarding
- Testing capabilities (future)

The migration preserved all functionality while improving the architecture for long-term maintainability.