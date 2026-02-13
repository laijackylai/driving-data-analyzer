# Claude Instructions

## Project Context

This is a driving data analyzer project designed to process and analyze driving behavior data.

## Development Guidelines

### General
- Keep code modular and well-documented
- Follow consistent naming conventions
- Add tests for new features
- Update documentation as the project evolves

### Next.js Specific
- Use App Router (not Pages Router)
- Prefer Server Components by default, use "use client" only when necessary
- Place client components in separate files
- Use Next.js built-in optimizations (Image, Font, Metadata)

### TypeScript
- Enable strict mode in tsconfig.json
- Define types in `src/types/index.ts`
- Use type guards for runtime validation
- Prefer interfaces over types for object shapes

### Tailwind CSS
- Use utility classes for styling
- Use the `cn()` utility for conditional classes
- Define custom colors/spacing in tailwind.config.ts
- Follow mobile-first responsive design

### Component Structure
- UI components in `src/components/ui/` should be generic and reusable
- Feature components in `src/components/features/` can be more specific
- Export components with named exports
- Use forwardRef for components that need ref access

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and routes
│   ├── api/               # API endpoints (server-side)
│   │   └── analyze/       # POST endpoint for data analysis
│   ├── dashboard/         # Dashboard page (client-side)
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home/landing page
│   └── globals.css        # Global styles with Tailwind directives
├── components/            # Reusable React components
│   ├── ui/               # Generic UI components (Button, Card)
│   └── features/         # Feature-specific components (FileUpload)
├── lib/                   # Utility functions and business logic
│   ├── utils.ts          # General utilities (cn, formatters)
│   └── data/             # Data processing utilities
│       ├── analyzer.ts   # Analysis algorithms and calculations
│       └── validators.ts # Input validation and type guards
├── types/                 # TypeScript type definitions
│   └── index.ts          # Shared types (DrivingDataPoint, AnalysisResult)
└── hooks/                 # Custom React hooks
```

### Technology Stack

- **Next.js 15**: App Router for modern React Server Components
- **TypeScript**: Strict mode enabled for type safety
- **Tailwind CSS**: Utility-first styling
- **React 19**: Latest React features

## Key Considerations

### Data Privacy
- All data processing happens client-side or in API routes (no external services)
- Files are not stored on the server
- Analysis is performed in-memory
- No data is persisted without user consent

### Performance
- Use Server Components for initial page loads
- Client-side processing for file uploads to reduce server load
- Optimize bundle size with code splitting
- Use Next.js Image component for optimized images
- Consider streaming for large datasets in the future

### Accuracy
- Validate all input data before processing
- Use type guards to ensure data integrity
- Handle edge cases (empty files, malformed data)
- Provide clear error messages to users

### Next.js Performance Best Practices
- Use dynamic imports for heavy components
- Implement proper loading states
- Cache API responses where appropriate
- Use React Server Components to reduce client bundle size
