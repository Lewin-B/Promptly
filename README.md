# colorstackwinterhack2025-promptly

A full-stack learning platform that helps developers practice building with AI responsibly. Promptly combines guided coding challenges, a secure build-and-run sandbox, and AI-powered analysis so learners can experiment with real code while seeing how their choices affect quality, safety, and outcomes.

## How this solves the problem

Developers often learn AI through scattered tutorials without feedback on safety or efficiency. Promptly closes that gap by:

- Giving hands-on challenges that require real code, not toy prompts.
- Deploying each submission in an isolated sandbox and collecting build logs.
- Running an AI analyzer that explains results, risks, and improvement areas.
- Encouraging responsible usage by surfacing reasoning, token usage, and failure modes.

## Technologies used

- Next.js 15, React 19, TypeScript
- tRPC, Drizzle ORM, Postgres
- Tailwind CSS, Sandpack
- Better Auth (GitHub OAuth)
- Go (judge server), A2A + MCP tooling
- Kubernetes + BuildKit for sandboxed builds

## Setup and installation

### Prerequisites

- Node.js 18+
- Go 1.25+
- Docker or Podman (for local Postgres)
- k8s, minikube / k3s

### 1) Configure environment

```bash
cp client/.env.example client/.env
```

Update the values in `client/.env`:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_GITHUB_CLIENT_ID`
- `BETTER_AUTH_GITHUB_CLIENT_SECRET`
- `AGENT_SERVER_URL`

### 2) Start the database

```bash
cd client
./start-database.sh
```

Then apply the schema:

```bash
bun install
bun run db:push
```

### 3) Create server cluster

```bash
cd judge-server
minikube start
kubectl apply -f k8s-judge-server.yaml
kubectl apply -f k8s-judge-registry.yaml
```

### 4) Start kube service

```bash
minikube service judge-serve --url
```

Set `AGENT_SERVER_URL` to the running judge server address.

### 5) Start the web app

```bash
cd client
bun run dev
```

Open `http://localhost:3000`.

### 6) Or just check it out at the following link

[My Project](https://promptly-snowy.vercel.app/)

## Team members and contributions

- Lewin Bobda - Coded

## Demo video and screenshots

- Demo video: [Adding link here](https://example.com/demo)
- Screenshots:

## slides
