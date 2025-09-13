# Chat Context Management Guide

## How the Chat Context Works

Your app uses a **Smart Context Injection** system instead of RAG. This is simpler and more effective for restaurant data.

### Current Architecture

```
User Query → ChatService → ContextManager → Gemini API
                              ↓
                    Analyzes query & fetches:
                    - Menu (from Supabase)
                    - Events (from Supabase)  
                    - Gallery info
                    - Restaurant info
                    - Loyalty program
```

## Adding New Context Sources

### 1. Quick Static Context (Immediate)

Edit `src/features/chat/services/contextManager.ts`:

```typescript
// In RESTAURANT_CONFIG object, add:
socialMedia: {
  instagram: '@grillpartnermaier',
  facebook: 'GrillPartnerMaier'
},
deliveryPartners: ['Lieferando', 'Uber Eats'],
specialServices: ['Kindergeburtstage', 'Firmenfeiern']
```

### 2. Dynamic Database Context (Easy)

Add a new method in `contextManager.ts`:

```typescript
// Example: Add reviews context
static async getReviewsContext(): Promise<string> {
  try {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    return `KUNDENBEWERTUNGEN:\n${data.map(r => 
      `- ${r.rating}⭐ "${r.comment}" - ${r.author}`
    ).join('\n')}`;
  } catch (error) {
    return '';
  }
}
```

Then add it to `getFullContext()`:

```typescript
if (opts.includeReviews) {
  const reviewsContext = await this.getReviewsContext();
  contextParts.push(reviewsContext);
}
```

### 3. Query-Based Context Selection

The system automatically detects what context is needed:

```typescript
// In analyzeQueryContext():
needsReviews: /bewertung|review|feedback|kunde|customer/.test(lowerQuery),
```

## Examples of Easy Context Additions

### Adding Opening Hours Details

```typescript
// In RESTAURANT_CONFIG:
detailedHours: {
  monday: '11:00-21:00',
  tuesday: '11:00-21:00',
  // ... etc
  holidays: {
    'Heiligabend': 'Geschlossen',
    'Neujahr': '14:00-21:00'
  }
}
```

### Adding Nutritional Info

```typescript
static async getNutritionalContext(): Promise<string> {
  // Fetch from menu_items table if you add nutrition columns
  const vegetarian = await MenuService.getVegetarianOptions();
  const vegan = await MenuService.getVeganOptions();
  
  return `VEGETARISCH: ${vegetarian.length} Optionen
VEGAN: ${vegan.length} Optionen`;
}
```

### Adding Weather-Based Recommendations

```typescript
static async getWeatherContext(): Promise<string> {
  const weather = await fetchWeatherAPI();
  if (weather.temp > 25) {
    return 'EMPFEHLUNG: Bei diesem Wetter empfehlen wir unsere Eis-Spezialitäten!';
  }
  return '';
}
```

## Configuration Without Code Changes

The `RESTAURANT_CONFIG` object can be updated without touching other code:

1. Phone number changes
2. Opening hours updates  
3. New payment methods
4. Updated specialties
5. New services

Just edit the object in `contextManager.ts`.

## Performance Tips

1. **Context Size**: Keep total context under 10,000 tokens
2. **Caching**: Consider caching menu data for 5 minutes
3. **Query Analysis**: Only fetch needed context
4. **Compact Mode**: Use `getCompactContext()` for simple queries

## Testing Context

Test different queries in the chat:
- "Was sind eure Öffnungszeiten?" → Restaurant info
- "Was kostet ein Burger?" → Menu context
- "Habt ihr Events?" → Events context
- "Zeig mir Fotos" → Gallery context

## Future Enhancements

- **Admin Panel**: UI to update RESTAURANT_CONFIG
- **Context Templates**: Pre-defined contexts for common queries
- **Multi-language**: Context in English/German based on query
- **Analytics**: Track which contexts are used most