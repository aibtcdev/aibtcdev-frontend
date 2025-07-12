# AIBTCDEV Frontend

## Prerequisites
- Node.js (recommended version 18+)
- npm
- Backend repository: [aibtcdev-backend](https://github.com/aibtcdev/aibtcdev-backend)

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/aibtcdev/aibtcdev-frontend.git
cd aibtcdev-frontend
```

### 2. Environment Setup
Create a `.env.local` file in the project root and add the following variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://addyourown.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=add_your_anon_key
HIRO_API_KEY=hiro_api_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
NEXT_PUBLIC_STACKS_NETWORK=testnet
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Husky for Pre-commit Hooks
Install and configure Husky to ensure code quality before commits:

```bash
# Initialize husky
npx husky init

# Add a pre-commit hook to run Prettier on staged TypeScript files
echo 'npx prettier --write --list-different "**/*.{ts,tsx}"' > .husky/pre-commit

# Make the pre-commit hook executable
chmod +x .husky/pre-commit
```

This setup will automatically format your TypeScript and TSX files before each commit, ensuring consistent code formatting across the project.

### 5. Run Backend
Clone and set up the backend repository:
```bash
git clone https://github.com/aibtcdev/aibtcdev-backend.git
cd aibtcdev-backend
# Follow backend setup instructions
```

### 6. Run Frontend Development Server
```bash
npm run dev
```