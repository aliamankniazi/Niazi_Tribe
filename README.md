# Niazi Tribe

A modern family tree application built with React, TypeScript, and Firebase.

## Features

- Interactive family tree visualization with D3.js
- Real-time updates and collaboration
- Offline support with PWA capabilities
- GEDCOM import/export
- Photo and document management
- Timeline visualization
- Sharing and access control
- PDF export functionality

## Tech Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Material-UI
- **State Management**: React Query & Context API
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting
- **Visualization**: D3.js
- **Build Tool**: Vite
- **Package Manager**: npm
- **Monorepo Management**: Turborepo

## Project Structure

```
niazi-tribe/
├── apps/
│   └── ui/               # React frontend application
├── services/
│   ├── gedcom/          # GEDCOM processing service
│   └── matching/        # Family matching algorithms
├── packages/            # Shared packages
└── firebase/           # Firebase configuration
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Firebase CLI

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/niazi-tribe.git
   cd niazi-tribe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

4. Create environment files:
   ```bash
   # apps/ui/.env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Start Firebase emulators:
   ```bash
   npm run firebase:emulators
   ```

The application will be available at `http://localhost:3000`.

### Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   npm run firebase:deploy
   ```

## Testing

Run the test suite:
```bash
npm run test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [D3.js](https://d3js.org/) for visualization
- [Firebase](https://firebase.google.com/) for backend services
- [Material-UI](https://mui.com/) for UI components
- [React](https://reactjs.org/) for the frontend framework 