# NetLearn

Interactive computer networks learning platform with a browser-based packet simulator, protocol demonstrations, practical labs, a resource hub, and a graded multiple-choice quiz.

## Run locally

**Prerequisite:** Node.js

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

## Deploy to Vercel

1. Import `https://github.com/saisurya-2406/Net-Learn` into Vercel.
2. Use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. These values are also set in `vercel.json`.
3. Add `GEMINI_API_KEY` in the Vercel project's Environment Variables if you want AI tutor responses from Gemini. The tutor's offline fallback works without this key.
4. Deploy. The Vite single-page app uses a fallback rewrite for direct page loads, and `/api/ai/ask` is handled by the Express-backed Vercel Function in `api/ai/ask.ts`.

For local and traditional Node hosting, `npm run dev` and `npm run start` continue to use the Express server.

## Features

- Five-unit networking syllabus and 15 practical lab experiments
- Browser-based topology editor with validated NetLearn JSON import/export and browser-local topology snapshots
- Deterministic educational packet traces for selected ICMP, HTTP, and DNS scenarios
- Subnetting and networking calculators, routing demonstrations, and protocol visualizers
- Resource Hub with filters for provider, topic/protocol, type, difficulty, and language; resource bookmarks stay in the current browser profile
- Directory records for official simulators, packet analysis tools, RFCs, courses, YouTube channels, and topic discovery searches
- Practice room with 1,000 viva prompts and 198 multiple-choice questions, topic filters, model answers, explanations, and score summary
- AI tutor support with optional local fallback logic

Resource links are labeled as official source listings, items that need manual review, or discovery links. A catalog date is not a successful live link check. YouTube channel and search pages are not represented as individually verified videos. Course access and pricing vary by provider.

## Tests and build

```sh
npm test
npm run lint
npm run build
npm run check:resource-links
```

The optional link checker makes at most one request per second to each host. It reports HTTP or network failures as items needing manual review; an automated failure is not treated as proof that a resource is permanently broken.

From the dashboard, choose **Build a network** to open a blank canvas. Add devices from the component palette, connect interfaces, then use **Send Message** to inspect a simulated packet path and event timeline. Topology snapshots stay in the current browser profile; JSON export is the portable backup format.

The packet trace checks device power, interface state, physical links, IPv4 address and subnet-mask syntax, duplicate active addresses, default-gateway reachability, and longest-prefix routes along the selected path, including the return path. It remains a deterministic educational model: it does not implement complete Ethernet switching or ARP state, all routing protocols, real TCP state machines, or actual network transmission. The browser simulator is not a CORE/GNS3 runtime, real Cisco IOS, or an Internet connection. External simulators require separate installation and suitable local infrastructure.

Resource entries are maintained in `src/data/resourceLibrary.ts`; question content is in `src/data/questionsData.ts`; practical lab definitions are in `src/data/labs/`.
