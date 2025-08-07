# Chatbot Cost Optimization Guide

## Current Costs with OpenAI

- **Model**: gpt-4o-mini
- **Input**: $0.15 per 1M tokens
- **Output**: $0.60 per 1M tokens
- **Monthly estimate**: Can quickly add up with regular usage

## Recommended Solutions

### Option 1: Switch to Google Gemini Flash (95% Cheaper!) ⭐ RECOMMENDED

**Best for**: Maximum cost savings with good quality

#### Setup:

1. Get a free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to your `.env` file:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   ```
3. Use the provided `chatServiceWithGemini.ts` implementation
4. Update your import in `ChatbotScreen.tsx`:
   ```typescript
   import ChatService from "../services/chat/chatServiceWithGemini";
   ```

**Costs**:

- Input: $0.075 per 1M tokens (95% cheaper!)
- Output: $0.30 per 1M tokens (50% cheaper!)
- Free tier: 1,500 requests per day

### Option 2: Implement Smart Caching (70-90% Cost Reduction)

**Best for**: Predictable questions, maintaining current API

#### How it works:

- Caches responses for common questions (hours, location, parking, etc.)
- Only calls API for unique/complex questions
- Responses stored locally for 24 hours

#### Setup:

1. Install AsyncStorage:
   ```bash
   npm install @react-native-async-storage/async-storage
   ```
2. Use the provided `chatServiceWithCache.ts` implementation
3. Can be combined with any API (OpenAI, Gemini, Claude, etc.)

### Option 3: Other Cheaper API Alternatives

#### Claude Haiku (Anthropic) - 80% Cheaper

```javascript
// API endpoint: https://api.anthropic.com/v1/messages
// Pricing: $0.25 per 1M input, $1.25 per 1M output
// Good for: Better reasoning, safer responses
```

#### Mistral 7B API - 85% Cheaper

```javascript
// API endpoint: https://api.mistral.ai/v1/chat/completions
// Pricing: ~$0.2 per 1M tokens
// Good for: European data privacy compliance
```

#### Groq Cloud (Llama 3) - Free Tier Available

```javascript
// API endpoint: https://api.groq.com/openai/v1/chat/completions
// Pricing: Free tier, then very cheap
// Good for: Fast inference, testing
```

### Option 4: On-Device Models (NOT Recommended for This Use Case)

**Why not recommended**:

- Complex setup requiring model downloads (300MB-2GB)
- Poor performance on older phones
- Lower quality responses
- Significant battery drain
- Complex implementation

If you still want to explore:

- `llama.rn` - Run Llama models locally
- `react-native-executorch` - Meta's on-device solution
- `react-native-transformers` - ONNX-based models

## Implementation Steps

### Step 1: Choose Your Approach

For your restaurant app, I recommend:

1. **Immediate**: Switch to Gemini Flash (Option 1)
2. **Enhancement**: Add caching layer (Option 2)
3. **Result**: 95%+ cost reduction with better user experience

### Step 2: Update Environment Variables

Add to your `.env` file:

```
# For Gemini
EXPO_PUBLIC_GEMINI_API_KEY=your-key-here

# For Claude (if using)
EXPO_PUBLIC_CLAUDE_API_KEY=your-key-here

# For Mistral (if using)
EXPO_PUBLIC_MISTRAL_API_KEY=your-key-here
```

### Step 3: Test Implementation

1. Replace the import in `ChatbotScreen.tsx`
2. Test common questions to ensure quality
3. Monitor API usage in respective dashboards

## Cost Comparison Table

| Service            | Input Cost/1M | Output Cost/1M | Monthly Est.\* | Quality       | Setup Ease |
| ------------------ | ------------- | -------------- | -------------- | ------------- | ---------- |
| OpenAI gpt-4o-mini | $0.15         | $0.60          | $50-200        | Excellent     | Current    |
| **Gemini Flash**   | **$0.075**    | **$0.30**      | **$2-10**      | **Very Good** | **Easy**   |
| Claude Haiku       | $0.25         | $1.25          | $10-40         | Very Good     | Easy       |
| Mistral 7B         | $0.20         | $0.20          | $8-30          | Good          | Easy       |
| With Caching       | -70%          | -70%           | $1-20          | Same          | Moderate   |
| On-Device          | $0            | $0             | $0             | Fair          | Complex    |

\*Monthly estimates based on 1000 daily queries

## Quick Migration Checklist

- [ ] Choose your preferred solution (Gemini Flash recommended)
- [ ] Get API key from provider
- [ ] Add API key to environment variables
- [ ] Copy the appropriate service file to your project
- [ ] Update import in ChatbotScreen.tsx
- [ ] Test with common questions
- [ ] Deploy and monitor costs

## FAQ

**Q: Will switching affect response quality?**
A: For a restaurant chatbot with simple Q&A, Gemini Flash or Claude Haiku provide excellent quality at a fraction of the cost.

**Q: Can I use multiple approaches?**
A: Yes! You can combine caching with any API for maximum savings.

**Q: What about response time?**
A: Gemini Flash is very fast. Caching makes responses instant for common questions.

**Q: Is the ChatGPT OSS 20b model good?**
A: While it's a capable open-source model, for your use case it requires complex setup and offers lower quality than API solutions. The cost savings from Gemini Flash (95% cheaper) make it a better choice.

## Support

For questions or issues with implementation, check:

- [Google AI Studio](https://makersuite.google.com/)
- [Anthropic Console](https://console.anthropic.com/)
- [Mistral Platform](https://console.mistral.ai/)
