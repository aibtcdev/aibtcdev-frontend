# AIBTC Server Actions

Welcome to the AIBTC server actions documentation! This guide will help you effectively use our type-safe, server-side functions in your Next.js 14 application.

## 🌟 Key Features

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Built-in Error Handling**: Consistent error handling across all actions
- **Authentication**: Integrated session management and auth checks
- **Form Handling**: Support for both FormData and direct object inputs
- **Cache Management**: Automatic revalidation after data mutations
- **Progressive Enhancement**: Works with both client and server components

## 🚀 Getting Started

### Basic Usage

Import the actions you need in your components:

```typescript
import { createCrew, getPublicCrews, updateAgent } from "@/actions/server";
```

### In Server Components

Server Components can directly await the actions:

```typescript
// app/crews/page.tsx
async function CrewsPage() {
  const { data: crews, error } = await getPublicCrews();

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="grid gap-4">
      {crews?.map((crew) => (
        <CrewCard key={crew.id} crew={crew} />
      ))}
    </div>
  );
}
```

### In Client Components

For client components, you can use the actions with forms and React's useTransition:

```typescript
"use client";

import { useTransition } from "react";
import { createCrew } from "@/actions/server";

export function CreateCrewForm() {
  const [isPending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await createCrew(formData);
      if (result.success) {
        // Handle success (e.g., show notification, redirect)
      } else {
        // Handle error
      }
    });
  };

  return (
    <form action={onSubmit}>
      <input name="name" required className="border rounded px-3 py-2" />
      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isPending ? "Creating..." : "Create Crew"}
      </button>
    </form>
  );
}
```

## 📚 Available Actions

### Authentication

```typescript
// Get the current authenticated user
const user = await getCurrentUser();

// Require authentication (throws if not authenticated)
const user = await requireAuth();
```

### Crew Management

```typescript
// Create a new crew
const { data: crew } = await createCrew({
  name: "My Crew",
  profileId: "user123",
});

// Get public crews
const { data: crews } = await getPublicCrews();

// Update a crew
const result = await updateCrew(crewId, {
  crew_name: "Updated Name",
});

// Delete a crew
const result = await deleteCrew(crewId);
```

### Agent Management

```typescript
// Create a new agent
const { data: agent } = await createAgent({
  profile_id: "user123",
  crew_id: 1,
  agent_name: "Assistant",
  agent_role: "Helper",
  agent_goal: "Support users",
  agent_backstory: "Experienced AI assistant",
  agent_tools: null,
});

// Get agents for a crew
const { data: agents } = await getAgentsByCrew(crewId);

// Update an agent
const result = await updateAgent(agentId, {
  agent_name: "New Name",
});
```

### Task Management

```typescript
// Create a new task
const { data: task } = await createTask({
  profile_id: "user123",
  crew_id: 1,
  agent_id: 1,
  task_name: "Research",
  task_description: "Gather information",
  task_expected_output: "Summary report",
});

// Get tasks for an agent
const { data: tasks } = await getTasksByAgent(agentId);
```

## 🔒 Error Handling

All actions return a consistent response type:

```typescript
interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
```

Example error handling:

```typescript
const { data, error } = await getPublicCrews();
if (error) {
  // Handle error case
  return <ErrorComponent message={error} />;
}
// Use data safely
return <SuccessComponent crews={data} />;
```

## 🎯 Best Practices

1. **Type Safety**: Leverage TypeScript types for better development experience

   ```typescript
   const { data: crew } = (await getCrew(id)) as ActionResponse<Crew>;
   ```

2. **Loading States**: Use React's useTransition for better UX

   ```typescript
   const [isPending, startTransition] = useTransition();
   // Show loading state while action is pending
   ```

3. **Form Handling**: Take advantage of FormData for simple forms

   ```typescript
   <form action={createCrew}>
     <input name="name" required />
     <button type="submit">Create</button>
   </form>
   ```

4. **Error Boundaries**: Implement error boundaries for graceful error handling
   ```typescript
   <ErrorBoundary fallback={<ErrorComponent />}>
     <YourComponent />
   </ErrorBoundary>
   ```

## 🤝 Contributing

Found a bug or want to contribute? Please check our contributing guidelines and feel free to submit a PR!

## 📝 License

MIT License - feel free to use in your own projects!
