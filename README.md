# Driving Data Analyzer

A modern web application built with Next.js, TypeScript, and Tailwind CSS for analyzing driving data to gain insights into driving patterns, behavior, and performance metrics.

## Features

- **Data Collection**: Upload CSV or JSON files containing driving data
- **Pattern Analysis**: Automatically identify driving patterns and behaviors
- **Performance Metrics**: Calculate average speed, max speed, distance, and duration
- **Safety Insights**: Detect harsh braking and rapid acceleration events
- **Safety Score**: Get an overall safety assessment (0-100 score)
- **Privacy-First**: All data processing happens on your device

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React 19** - Latest React features

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm, pnpm, or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd driving-data-analyzer
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

### Build for Production

```bash
npm run build
npm run start
```

## Usage

### Data Format

The application accepts CSV or JSON files with driving data.

#### CSV Format
```csv
timestamp,speed,acceleration,braking,latitude,longitude
2024-01-01T10:00:00Z,60,0.5,0,37.7749,-122.4194
2024-01-01T10:00:01Z,62,0.8,0,37.7750,-122.4195
```

Required fields:
- `timestamp`: ISO 8601 date string
- `speed`: Speed in km/h

Optional fields:
- `acceleration`: Acceleration in m/s²
- `braking`: Brake force (0-1)
- `latitude`: GPS latitude
- `longitude`: GPS longitude
- `steering`: Steering angle

#### JSON Format
```json
{
  "id": "session-1",
  "startTime": "2024-01-01T10:00:00Z",
  "endTime": "2024-01-01T10:30:00Z",
  "distance": 25.5,
  "duration": 1800,
  "dataPoints": [
    {
      "timestamp": "2024-01-01T10:00:00Z",
      "speed": 60,
      "acceleration": 0.5,
      "latitude": 37.7749,
      "longitude": -122.4194
    }
  ]
}
```

Or simply an array of data points:
```json
[
  {
    "timestamp": "2024-01-01T10:00:00Z",
    "speed": 60,
    "acceleration": 0.5
  }
]
```

### Uploading Data

1. Navigate to the Dashboard page
2. Drag and drop your CSV or JSON file, or click "Browse Files"
3. The application will automatically analyze your data
4. View your results including safety score and detailed metrics

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── analyze/       # Data analysis endpoint
│   ├── dashboard/         # Dashboard page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # UI primitives (Button, Card)
│   └── features/         # Feature components (FileUpload)
├── lib/                   # Utility functions
│   ├── utils.ts          # General utilities
│   └── data/             # Data processing
│       ├── analyzer.ts   # Analysis logic
│       └── validators.ts # Data validation
├── types/                 # TypeScript types
│   └── index.ts          # Type definitions
└── hooks/                 # Custom React hooks
```

## Development

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## License

MIT License
