# Aeon

**Aeon** is a next-generation peer-to-peer file-sharing architecture built to replace legacy protocols like BitTorrent and eMule. 

## Features
- **Zero-Config NAT Traversal:** Powered by Iroh, Aeon automatically punches through CGNATs and firewalls using UDP and STUN, with a seamless fallback to DERP relays. Every user is a "HighID" user.
- **BLAKE3 Content Addressing:** Verified, chunked streaming allows peers to verify data instantly in 1KB slices, banishing fake files and "poisoning" instantly.
- **Global Search via Iroh Docs:** Replaces massive DHTs with partitioned, multi-writer eventually consistent namespaces ("Channels"), allowing lightning-fast, spam-free global keyword searches.
- **True Seamless Roaming:** Thanks to QUIC, you can switch from Wi-Fi to 5G without breaking active download connections.
- **Web of Trust (WoT):** A decentralized, cryptographically-signed rating and comment system lets you filter out malicious content based on trusted curators and peers.

## Tech Stack
- **Frontend:** React, TypeScript, Tailwind CSS, Lucide React (via Vite)
- **Backend:** Rust, Tauri
- **P2P Networking:** [Iroh](https://iroh.computer/) (QUIC, BLAKE3, iroh-blobs, iroh-docs, iroh-gossip)

## Development
```bash
# Install dependencies
npm install

# Start the Tauri development server
npm run tauri dev
```
