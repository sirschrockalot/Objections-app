# ResponseReady

**Always Ready. Always Confident.**

A Next.js application designed to help real estate disposition agents practice overcoming buyer objections. This interactive training tool allows agents to:

- Practice with random objections
- View suggested responses
- Add and save custom responses
- Share responses with team members

## Features

- **Random Objection Display**: Click a button to get a random objection to practice with
- **Animated Loading**: Engaging roulette-style animation while the app "searches" for the next objection
- **Response Library**: View default responses for each objection
- **Custom Responses**: Add your own responses and save them for future use
- **Team Sharing**: All custom responses are saved and visible to all team members
- **Modern UI**: Beautiful, responsive design with smooth animations powered by Animate UI and framer-motion

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Dependency Management

This project uses **automated dependency updates** via Dependabot:

- ✅ **Automatic Updates:** Dependabot creates PRs for dependency updates weekly
- ✅ **Auto-Merge:** Patch/minor updates that pass CI are automatically merged
- ✅ **Security First:** Security updates are prioritized and auto-merged
- ✅ **Manual Review:** Major updates require manual review

**Manual Commands:**
```bash
npm run deps:check          # Check for outdated packages
npm run deps:audit          # Check for security vulnerabilities
npm run deps:fix            # Fix security vulnerabilities
npm run deps:check-manual   # Detailed dependency report
```

For more information, see [docs/dependencies/DEPENDENCY_MANAGEMENT.md](./docs/dependencies/DEPENDENCY_MANAGEMENT.md).

## How to Use

1. **Start a Practice Session**: Click the "Start Practice Session" button
2. **View Objection**: A random objection will be displayed after a brief roulette-style animation
3. **See Responses**: Click "Show Responses" to view suggested responses
4. **Add Your Response**: Click "Add Your Response" to contribute your own answer
5. **Get Next Objection**: Click "Get Next Objection" to practice with another one

## Data Storage

Custom responses are stored in the browser's localStorage, making them:
- Persistent across sessions
- Shared with all team members using the same browser/device
- Easy to export/import (via browser developer tools)

## Project Structure

```
response-ready/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── ObjectionCard.tsx # Component for displaying objections
│   ├── LoadingAnimation.tsx # Loading animation component
│   └── ui/               # Animate UI components (Button, Card)
├── data/
│   └── objections.ts     # Initial objection data (20 objections)
├── lib/
│   ├── storage.ts        # Data persistence utilities
│   └── utils.ts          # Utility functions
└── types/
    └── index.ts          # TypeScript type definitions
```

## Customization

### Adding More Objections

Edit `data/objections.ts` to add more objections with their default responses.

### Styling

The app uses Tailwind CSS and Animate UI components. Modify the classes in components to customize the appearance.

## Technologies Used

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Animate UI / shadcn/ui** - UI components

## Future Enhancements

Consider adding:
- User authentication for multi-user support
- Database integration (instead of localStorage)
- Analytics to track practice sessions
- Export/import functionality for responses
- Categories or tags for objections
- Search functionality

## Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory, organized by category:

- **[Architecture & Design](./docs/architecture/)** - System design, cost optimization, and code improvements
- **[Dependencies](./docs/dependencies/)** - Dependency management and automation
- **[Security](./docs/security/)** - Security audits, authentication, and JWT implementation
- **[Testing](./docs/testing/)** - Testing guidelines, status, and fixes
- **[Features](./docs/features/)** - Feature implementation guides (voice agent, video recommendations, etc.)
- **[Deployment](./docs/deployment/)** - Deployment guides (Heroku, MongoDB setup)
- **[Recommendations](./docs/recommendations/)** - Feature recommendations and quality reports

See [docs/README.md](./docs/README.md) for a complete index of all documentation.

## License

Private - For internal use only
