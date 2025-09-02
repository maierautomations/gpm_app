# AI SDK Integration Findings & Implementation Report
*Generated: August 29, 2025*

## Current State Analysis

### Dependencies Status
- **AI SDK**: Currently `ai@4.3.19` - **OUTDATED** (Latest: `ai@5.0.27`)
- **OpenAI SDK**: `openai@5.10.1` - **UNUSED** (can be removed for cleaner dependencies)
- **Google Gemini**: Using direct fetch API implementation (working but suboptimal)

### Chat Implementation Review
**File**: `src/features/chat/services/chatServiceWithGemini.ts`
- ✅ Successfully using Google Gemini API (95% cost savings vs OpenAI)
- ✅ Bilingual support (German/English) with auto-detection
- ✅ Restaurant context with opening hours, location, specialties
- ❌ **Limited menu context** - only 5 items per category shown
- ❌ **No real streaming** - simulates streaming by delivering full response at once
- ❌ **Missing allergen info** in AI context
- ❌ **No special offers integration** (Angebotskalender not included)

### Database Analysis
```sql
-- Current menu data structure
Total menu items: 125
├── Imbiss: 111 items
└── Eis: 14 items

Available fields:
- name, price, category, subcategory
- allergens (JSONB) - NOT included in AI context
- image_url, is_available
```

### Playwright MCP Testing
**Limitation Found**: Playwright MCP cannot properly test Expo mobile apps running on development server. It only shows the Expo manifest JSON instead of the actual app UI. Testing requires:
- Real device with Expo Go app
- iOS Simulator or Android Emulator
- Web browser (expo start --web)

## Major Improvements Needed

### 1. Complete Menu Context Integration
Current: Shows only 5 items per category as "preview"
```typescript
const itemsList = items.slice(0, 5).map(item => 
  `- ${item.name}: €${parseFloat(item.price).toFixed(2)}`
).join('\n');
```

**Needed**: Full menu with:
- All 125 items with prices
- Allergen information for dietary restrictions
- Special offers from Angebotskalender
- Subcategory information for better filtering

### 2. True Streaming Implementation
Current: Fake streaming (full response delivered at once)
```typescript
// Current: No real streaming
const fullResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
if (onStream) {
  onStream(fullResponse); // Delivered all at once
}
```

**Needed**: Real token-by-token streaming using AI SDK v5

### 3. Enhanced Context Awareness
Missing integrations:
- Restaurant opening hours (static data only)
- Current special offers/weekly themes
- Event information for catering inquiries
- User's favorite items for personalized recommendations

## Implementation Strategy

### Phase 1: Foundation Upgrade
1. **Upgrade to AI SDK v5.0.27** - brings modern streaming, better type safety
2. **Remove OpenAI dependency** - clean up unused packages
3. **Implement proper Gemini provider** using AI SDK architecture

### Phase 2: Enhanced Context
1. **Full menu context** - all 125 items with allergens
2. **Special offers integration** - current Angebotskalender data
3. **Restaurant dynamic info** - real-time opening status
4. **Event data integration** - for catering inquiries

### Phase 3: Advanced Features
1. **Conversation memory** - context across multiple messages
2. **Structured responses** - formatted menu items, prices, allergens
3. **Personalization** - recommendations based on user favorites
4. **Multi-language improvements** - better detection and responses

## Expected Benefits

### Performance
- **True streaming** - faster perceived response times
- **Better type safety** - AI SDK v5 provides end-to-end typing
- **Reduced bundle size** - remove unused OpenAI dependency

### User Experience  
- **Complete menu knowledge** - AI can answer any menu question
- **Allergen awareness** - dietary restriction support
- **Current offers** - real-time special pricing information
- **Personalized suggestions** - based on user preferences

### Developer Experience
- **Modern AI SDK patterns** - easier to maintain and extend
- **Better error handling** - built-in retry and fallback mechanisms
- **Standardized architecture** - follows Vercel AI SDK conventions

## Technical Notes

### Gemini Integration Considerations
- Maintain current cost optimization (95% savings vs OpenAI)
- Google Gemini 1.5 Flash model continues to work well
- Context window: 1M tokens (sufficient for full menu + conversation)
- Rate limits: Check current usage vs limits

### Data Structure Optimization
```typescript
// Enhanced context structure needed:
interface EnhancedMenuContext {
  totalItems: number;
  categories: {
    name: string;
    items: {
      id: number;
      name: string;
      price: string;
      allergens: string[];
      isSpecialOffer?: boolean;
      specialPrice?: string;
    }[];
  }[];
  currentOffers: WeeklyOffer;
  restaurantStatus: 'open' | 'closed' | 'closing_soon';
}
```

## Risk Assessment

### Low Risk
- AI SDK upgrade (well-documented migration path)
- Menu context expansion (just adding more data)
- OpenAI dependency removal (unused code)

### Medium Risk
- Streaming implementation (requires testing with real devices)
- Context size optimization (ensure we don't hit limits)

### Migration Path
1. Keep current implementation as backup
2. Implement new service alongside existing
3. A/B test with gradual rollout
4. Remove old implementation after validation

## Next Steps
1. ✅ Document current findings (this file)
2. ⏳ Update dependencies (AI SDK v5, remove OpenAI)
3. ⏳ Create enhanced context provider
4. ⏳ Implement new Gemini service with AI SDK
5. ⏳ Test on real device with Expo Go
6. ⏳ Performance and accuracy validation