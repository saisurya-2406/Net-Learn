import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize AI client if a key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'netlearn-app',
        },
      },
    });
  } catch (err) {
    console.error('Failed to initialize AI client:', err);
  }
}

// 1. AI Networking Tutor Endpoint
app.post('/api/ai/ask', async (req, res) => {
  const { question, context, level } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  // If Gemini API is available, invoke Gemini 3.8 Flash
  if (aiClient) {
    try {
      const systemInstruction = `You are NetLearn AI, an expert Senior Computer Networking Professor and CCIE Network Engineer.
Your role is to teach Computer Networks clearly, intuitively, and rigorously.
Teaching Level requested: ${level || 'College'} (Options: Beginner [intuitive analogies], College [rigorous university exam syllabus], Advanced [CCNA/CCNP industry packets & CLI]).

When responding:
1. Provide a direct, crystal-clear conceptual explanation with an intuitive real-world analogy.
2. Outline the exact Protocol / OSI Layer mechanism (Headers, Addresses, State machines).
3. Walk through a concrete numerical or packet step if applicable.
4. Highlight 1 Common Mistake or Exam Pitfall.
5. Provide a quick check-for-understanding practice question.
Formatting: Use clean Markdown with bullet points, bold terms, and code blocks for IP addresses or CLI commands. Keep it punchy and engaging.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `${context ? `[Context]: ${context}\n\n` : ''}[User Question]: ${question}`,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text || 'I could not generate an answer right now.';
      return res.json({ reply, source: 'gemini' });
    } catch (err: any) {
      console.error('Gemini API call failed:', err?.message || err);
      // Fall through to offline knowledge base
    }
  }

  // Offline Expert Fallback
  const q = question.toLowerCase();
  let offlineReply = '';

  if (q.includes('vlsm') || q.includes('subnet')) {
    offlineReply = `### VLSM (Variable Length Subnet Masking) Explained

**Intuition**: Traditional fixed subnetting (FLSM) wastes precious IP addresses by giving every subnet the same size. VLSM allows network architects to allocate subnets of differing prefix lengths (/26, /27, /30) tailored precisely to host counts.

#### The 5 Golden Steps:
1. **Sort requirements descending**: Always allocate the largest subnet first down to point-to-point /30 links.
2. **Determine host bits ($h$)**: Find smallest $h$ where $2^h - 2 \\ge \\text{Hosts Needed}$.
3. **Calculate new prefix**: $32 - h = /\\text{prefix}$.
4. **Determine Block Size**: $256 - \\text{Interesting Octet Mask}$.
5. **Assign sequentially**: Start from base address, next network = previous network + block size.

*Common Pitfall*: Forgetting that 2 addresses are reserved in each subnet (Network ID and Directed Broadcast).
*Practice Question*: How many usable IPs are in a /29 subnet? (Answer: $2^3 - 2 = 6$ hosts).`;
  } else if (q.includes('tcp') && (q.includes('handshake') || q.includes('3-way'))) {
    offlineReply = `### TCP 3-Way Handshake (SYN → SYN-ACK → ACK)

**Purpose**: Establishes a reliable full-duplex byte-stream connection before any application data is exchanged, synchronizing Initial Sequence Numbers (ISNs) and Maximum Segment Size (MSS).

#### The Exchange:
1. **Step 1: Client → Server [SYN]**
   - Flags: \`SYN=1, ACK=0\`
   - Sequence: \`Seq = Client_ISN (e.g. 1000)\`
   - State: Client enters \`SYN_SENT\`. Server is \`LISTEN\`.
2. **Step 2: Server → Client [SYN, ACK]**
   - Flags: \`SYN=1, ACK=1\`
   - Sequence: \`Seq = Server_ISN (e.g. 5000)\`, \`Ack = Client_ISN + 1 (1001)\`
   - State: Server enters \`SYN_RCVD\`.
3. **Step 3: Client → Server [ACK]**
   - Flags: \`ACK=1, SYN=0\`
   - Sequence: \`Seq = 1001\`, \`Ack = Server_ISN + 1 (5001)\`
   - State: Both reach \`ESTABLISHED\`.

*Common Pitfall*: SYN packets consume 1 sequence number even though they carry 0 application bytes!`;
  } else if (q.includes('arp')) {
    offlineReply = `### Address Resolution Protocol (ARP)

**Purpose**: Maps a known Layer 3 IPv4 address to an unknown Layer 2 physical MAC address on the local broadcast domain.

#### How It Works:
- **ARP Request**: Broadcast (\`FF:FF:FF:FF:FF:FF\`). "Who has 192.168.1.5? Tell 192.168.1.2!" Every host on the switch receives it.
- **ARP Reply**: Unicast. Host with 192.168.1.5 inspects its IP, replies directly with its MAC: "192.168.1.5 is at 00:1A:2B:3C:4D:5E".
- **ARP Cache**: Both machines cache the mapping in memory (\`arp -a\`) with a TTL timer to avoid flooding subsequent packets.

*Exam Note*: ARP does NOT cross routers! A router will only respond with its own interface MAC (or via Proxy ARP).`;
  } else if (q.includes('ping') && (q.includes('fail') || q.includes('unreachable') || q.includes('troubleshoot'))) {
    offlineReply = `### Troubleshooting Ping Failures: Systematic Diagnostic

When an ICMP Echo Request fails, the symptom tells you the layer:

1. **"Destination Host Unreachable"**:
   - The local gateway (router) has no route to the destination network, OR local ARP for the default gateway failed.
   - *Fix*: Check IP default-gateway on PC and \`show ip route\` on router.
2. **"Request Timed Out"**:
   - Packet reached the target or transit network, but was dropped along the path (e.g., ACL blocking ICMP, router interface \`shutdown\`, or target has no return route back to sender!).
   - *Fix*: Verify return routing and interface status.
3. **Subnet Mask Mismatch**:
   - PC believes the destination is local when it's remote, or vice versa, skipping the default gateway.`;
  } else {
    offlineReply = `### NetLearn Networking Tutor

Here is the key breakdown for **${question}**:

- **Core Concept**: In computer networking, communication relies on layered encapsulation (OSI 7-layer / TCP/IP 4-layer). Each layer adds its specific header and delegates transmission downward.
- **Key Protocol Mechanics**: Ensure correct Layer 2 (MAC addressing & ARP), Layer 3 (IP Addressing, Subnet Masking, Default Gateway), and Layer 4 (TCP/UDP port numbers).
- **Pro Tip**: Use the NetLearn **Simulator** to build this topology and inspect packets hop-by-hop with the **Packet Inspector** to see headers at each interface!`;
  }

  return res.json({ reply: offlineReply, source: 'offline-knowledge-base' });
});

// Mount Vite in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NetLearn server running on http://0.0.0.0:${PORT}`);
  });
}

// Vercel imports the Express app as a serverless function. Keep the listener
// for local and traditional Node deployments, but do not open a port there.
if (!process.env.VERCEL) {
  startServer();
}

export default app;
