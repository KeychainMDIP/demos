# MDIP DEX Demo

### Overview
This repository hosts a DEX (decentralized exchange) demo using MDIP. It is split into two main folders:

- **client/** – A React front-end
- **server/** – An Express/Node back-end

### Running the Demo

You can run the demo in two ways:

1. **Run client and server together** – The server will serve the built React client.
2. **Run client and server separately** – The client dev server communicates via an API URL to the back end.

### Repository Structure

- **client/**
  A React front-end, with a `.env` controlling its API endpoint and HTTPS dev settings.
- **server/**
  An Express server that provides `/api` endpoints, using Keymaster for DID-based authentication. Has a .env to set keymaster, Gatekeeper, callback, whether to serve the React client, HTTPS dev settings and CORS for external React app.

### Quick Start

1. **Install** dependencies for both client and server:
  - `npm run install`

2. **Run** both in parallel:
  - `npm start`

3. **Visit** the site in a browser:
  - If you’re serving the client from the server, go to `http://localhost:3009`.


### Further Reading
- **client/README.md** – Explains how to run the React client independently.
- **server/README.md** – Explains how to run the auth server independently.
