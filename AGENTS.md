# Your AI

Your AI is a Next.js workspace for managing specialist agents and meetings. The application lives in src/. The separate browser demo lives in docs/demo/.

## Preserve the product

- Preserve Okan's existing interface. Use the application styling restored in be94111 as the reference for layout, typography, navigation, and components. Fix behavior using the existing screens, controls, and styles.
- Treat redesigns, features, hosting, and database changes as separate tasks. Make those changes only when requested. Keep the README and public URL in place until a replacement is verified.
- Inspect the working tree before editing. Preserve user changes and Git history. Push, merge, and publish only when the user has authorized that operation.

## Keep the work focused

- Identify the requested outcome and how to verify it. Read the relevant entry point and its dependencies first. Expand the search to resolve a concrete question.
- Reuse existing components and helpers. Keep durable rules here and task-specific decisions in the issue or PR.
- Run checks proportional to the change. Reuse passing results when the relevant code and conditions are unchanged. Report what changed, what passed, and any remaining blocker.

## Run and verify

- Install with npm ci. For a fresh local copy without a hosted database configured, run npm run setup, then npm run dev.
- Use npm run lint and npm run typecheck for applicable source changes. Use npm run build for deployment or build changes. Exercise the affected workflow in a browser when behavior changes.
- Routes are in src/app. Features and tRPC procedures are in src/modules, shared components in src/components, and the Drizzle schema in src/db/schema.ts.

## Data and hosting

- Local development can use PGlite. Hosted Next.js uses Neon via DATABASE_URL, plus BETTER_AUTH_URL and BETTER_AUTH_SECRET. Keep credentials in ignored local env files or host secret settings.
- Use a separate database or Neon branch for tests that write data. Review schema changes before applying them to a hosted database. Confirm the target before running npm run setup or npm run db:push.
- Verify the hosted application and sign-in before updating the README or repository website URL. Label the browser demo and the hosted application clearly.
