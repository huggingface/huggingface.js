# @huggingface/responses-server

A lightweight Express.js server supporting Responses API on top of Inference Provider Chat Completion API.

## 📁 Project Structure

```
responses-server/
├── src/
│   ├── index.ts           
│   ├── server.ts     # Express app configuration (e.g. route definition)
│   ├── routes/       # Routes implementation
│   ├── middleware/   # Middlewares (validation + logging)
│   └── schemas/      # Zod validation schemas
├── scripts/          # Utility scripts
├── package.json      # Package configuration
```

## 🚀 Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Run a simple POST request with 

```bash
# Make dummy call
pnpm dummy
```

## 🛠️ Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm start` - Start production server
- `pnpm build` - Build for production
- `pnpm dummy` - Run test API call
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm format` - Format code with Prettier
- `pnpm test` - Run tests
- `pnpm check` - Type check with TypeScript
