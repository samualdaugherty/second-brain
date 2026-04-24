# Gary — Second Brain PWA: Build Brief
> Feed this entire document into Cursor in Plan Mode before writing a single line of code.

---

## What We're Building

**Gary** is a personal AI-powered Second Brain chat interface — a Progressive Web App (PWA) that lives on your iPhone home screen and lets you talk to your Mac Mini's knowledge system from anywhere in the world.

The name is Gary. Not "Assistant." Not "AI." Gary. He has a personality: helpful, concise, occasionally dry, never sycophantic. He knows where everything is and he never forgets anything.

This is **Phase 1** of a larger system. The goal tonight is a fully functional chat interface that:
- Looks and feels intentional and personal, not like a generic AI chatbot
- Connects to a local Express server running on a Mac Mini (the "bridge" to Claude Code)
- Works as an installable PWA on iPhone
- Is architected correctly for Phase 2 (Supabase database) and Phase 3 (browsable vault front-end)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router, already scaffolded)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: `next-pwa` or `@ducanh2912/next-pwa`
- **Icons**: `lucide-react`
- **Fonts**: Your choice — but NOT Inter, NOT Roboto. Something with character. Suggestions: Geist Mono for code feel, or a pairing like DM Serif Display + DM Sans for warmth, or IBM Plex Mono for utilitarian intelligence.
- **Animations**: Subtle, purposeful. CSS transitions preferred. Nothing flashy.

---

## Design Direction

**Tone**: Refined utility. Think of a well-worn Moleskine notebook meets a terminal. Not cold, not corporate — personal and intelligent. Like a tool built for one person, by that person.

**Theme**: Dark. Deep charcoal/near-black background, not pure `#000000`. Warm off-whites for text. A single accent color — something unexpected. Suggestions: a muted amber `#C9933A`, a dusty sage `#7A9E7E`, or a warm slate blue `#6B7FA3`. Pick one and commit.

**What makes Gary UNFORGETTABLE**: The interface should feel like it was built for exactly one person's life — not a product, not a startup. Small personal touches matter. Gary's name in the header. A subtle status indicator showing if the Mac Mini is online. Message timestamps. The input feeling like a thought, not a search bar.

**Layout**:
- Full viewport height, mobile-first
- Fixed header (small, Gary's name + connection status)
- Scrollable message thread (flex-col, messages anchored to bottom)
- Fixed input bar at the bottom (above iOS safe area)
- No sidebars, no nav — this is a single-purpose tool

---

## Core Features to Build

### 1. Chat Interface
- Message thread displaying conversation history
- User messages right-aligned, Gary responses left-aligned
- Gary's messages support markdown rendering (bold, lists, links)
- Timestamps on messages (subtle, small)
- Auto-scroll to latest message
- Loading state while Gary is thinking (subtle animated indicator, not a spinner)
- Error state if Mac Mini is unreachable

### 2. Input Bar
- Textarea that grows with content (not a fixed-height input)
- Send on Enter (Shift+Enter for new line)
- Send button with lucide-react icon
- Voice input button (Web Speech API) — microphone icon, toggles recording state
- Clear visual state for: idle / recording / sending

### 3. Connection Status
- On mount, hit `GET /health` on the Mac Mini bridge server
- Show a subtle status dot in the header: green = online, amber = checking, red = unreachable
- If unreachable, show a friendly message in the thread: *"Gary's home base isn't reachable right now. Make sure Tailscale is running."*

### 4. PWA Configuration
- `manifest.json` with name "Gary", short_name "Gary"
- App icon (simple — a "G" monogram in the accent color, or a small brain icon)
- `theme_color` matching the app background
- `display: standalone`
- iOS-specific meta tags for full-screen experience
- Service worker for offline shell (the UI loads even if Gary can't be reached)

---

## API Integration

### Bridge Server (Mac Mini)
The Mac Mini runs an Express server at a local IP (currently `192.168.0.144`, will be a Tailscale IP after setup). This will be an environment variable.

```
Base URL: process.env.NEXT_PUBLIC_BRIDGE_URL
API Key: process.env.BRIDGE_API_KEY (sent as x-api-key header)
```

**Health check:**
```
GET /health
Response: { status: "ok" }
```

**Send message:**
```
POST /message
Headers: { x-api-key: process.env.BRIDGE_API_KEY, Content-Type: application/json }
Body: { message: string }
Response: text/event-stream (Server-Sent Events)

Each SSE event is JSON:
{ text: string }     — append to Gary's current response
{ error: string }    — something went wrong
{ done: true }       — response complete
```

### Next.js API Route
Create `/app/api/chat/route.ts` as a proxy between the PWA and the bridge server. This:
- Accepts `POST { message: string }` from the frontend
- Forwards to the bridge server with the API key (kept server-side, never exposed to client)
- Streams the SSE response back to the client
- Handles errors gracefully

This keeps `BRIDGE_API_KEY` server-side only. `NEXT_PUBLIC_BRIDGE_URL` can be public since the API key is the auth mechanism.

---

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_BRIDGE_URL=http://192.168.0.144:3000
BRIDGE_API_KEY=0cc25112699844306d6738a6ed108897644ea22716ab8bde
NEXT_PUBLIC_APP_NAME=Gary
```

> Note: The bridge URL will be updated to a Tailscale IP once that's configured on the Mac Mini. The API key should be regenerated before production use — this one has been shared.

---

## File Structure

```
second-brain-pwa/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          ← SSE proxy to bridge server
│   ├── globals.css               ← Global styles, CSS variables
│   ├── layout.tsx                ← Root layout, PWA meta tags, fonts
│   └── page.tsx                  ← Main chat interface
├── components/
│   ├── ChatThread.tsx            ← Message list
│   ├── Message.tsx               ← Individual message bubble
│   ├── InputBar.tsx              ← Text input + voice + send
│   ├── StatusIndicator.tsx       ← Connection status dot
│   └── GaryHeader.tsx            ← Top bar
├── hooks/
│   ├── useChat.ts                ← Chat state, send logic, SSE handling
│   └── useVoiceInput.ts          ← Web Speech API wrapper
├── lib/
│   └── types.ts                  ← Shared TypeScript types
├── public/
│   ├── manifest.json             ← PWA manifest
│   ├── icon-192.png              ← PWA icon
│   └── icon-512.png              ← PWA icon large
├── .env.local                    ← Environment variables (gitignored)
└── next.config.ts                ← Next.js config with PWA plugin
```

---

## TypeScript Types

```typescript
// lib/types.ts

export type MessageRole = 'user' | 'gary';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: 'sending' | 'complete' | 'error';
}

export type ConnectionStatus = 'checking' | 'online' | 'offline';
```

---

## useChat Hook Logic

```typescript
// hooks/useChat.ts — logic outline

const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    // 1. Add user message to thread immediately
    // 2. Add empty Gary message with status 'sending'
    // 3. POST to /api/chat with { message: content }
    // 4. Parse SSE stream — append each { text } chunk to Gary's message
    // 5. On { done: true } — set Gary's message status to 'complete'
    // 6. On { error } or fetch failure — set status to 'error', show friendly message
  };

  return { messages, isLoading, sendMessage };
};
```

---

## Gary's Personality (System Context)

When the bridge server receives a message, it pipes it to Claude Code which has access to the full SecondBrain system with its CLAUDE.md instructions. Gary's personality is already baked into the Mac Mini's CLAUDE.md. The PWA doesn't need to send a system prompt — it just forwards the user's message as-is.

However, the UI should reflect Gary's personality:
- Loading indicator text (if any): subtle, not "Thinking..." — maybe just an animated dot
- Error messages: matter-of-fact, not alarmed. *"Can't reach the Mac Mini right now."*
- Empty state (first load): A single line. *"Hey. What do you want to remember?"*

---

## Phase 2 Preparation (Don't Build Yet, But Architect For It)

Keep these in mind so we don't have to rework things later:

- **Auth**: The `/app/api/chat/route.ts` proxy will eventually check a session token (Supabase Auth). Leave a comment placeholder.
- **Conversation persistence**: Messages are currently in-memory (useState). Phase 2 adds Supabase to persist them. The `Message` type is already designed for this.
- **Multi-user**: Daryl will eventually have her own login. The architecture (Next.js API routes as the backend layer) supports this without restructuring.
- **Navigation**: Phase 3 adds browsable vault views (Travel, Recipes, People, etc.). The layout should leave room for a bottom nav bar — even if it's not built yet, don't design the input bar in a way that makes adding one painful.

---

## PWA Install Experience

On iOS:
- User opens the URL in Safari
- Taps Share → Add to Home Screen
- Gary appears on home screen with the icon
- Opens full-screen, no Safari chrome, feels native

Make sure these meta tags are in `layout.tsx`:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Gary" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

---

## What Success Looks Like Tonight

1. `npm run dev` runs clean with no errors
2. `localhost:3000` shows Gary's chat interface — dark, clean, personal
3. The health check hits `/health` and shows a status dot
4. Typing a message and hitting send fires a request to `/api/chat`
5. The SSE stream renders Gary's response word-by-word in the thread
6. Voice input button activates the microphone and transcribes speech to the input
7. The app is installable as a PWA (manifest + meta tags in place)

**The Mac Mini connection will timeout tonight** — that's expected. Tailscale gets set up Sunday when back home. Build against the API contract and it'll just work when the URL is updated.

---

## Notes for Cursor

- Build components in the order listed in the file structure — types first, hooks second, components third, page last
- Use Tailwind exclusively for styling — no CSS modules, no styled-components
- Every component gets proper TypeScript typing — no `any`
- The SSE streaming is the trickiest part — handle the ReadableStream carefully, don't lose chunks
- Mobile-first, but make sure it's not broken on desktop either (it'll be used in the browser too)
- Commit to the design direction fully — this should feel like a designed product, not a tutorial project
- The name is Gary. Use it everywhere it makes sense in the UI copy.
