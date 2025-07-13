# Niazi Tribe Deployment Guide

This guide explains how to deploy the Niazi Tribe application using Firebase.

## Prerequisites

- Node.js 18.x or later
- npm 8.x or later
- Firebase CLI (`npm install -g firebase-tools`)
- A Firebase project

## Initial Setup

1. **Firebase Project Setup**
   ```bash
   # Login to Firebase
   firebase login

   # Initialize Firebase in the project
   firebase init
   ```

   Select the following features when prompted:
   - Hosting
   - Firestore
   - Storage
   - Functions (if using Firebase Functions)
   - Emulators (for local development)

2. **Environment Configuration**
   Create a `.env` file in the `apps/ui` directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Local Development**
   ```bash
   # Start the UI development server
   npm run dev

   # Start Firebase emulators (in a separate terminal)
   firebase emulators:start
   ```

## Deployment

1. **Build the Application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

   Or use our deployment script:
   ```bash
   ./deploy.sh
   ```

## Firebase Configuration

### Security Rules

1. **Firestore Rules**
   Review and update `firestore.rules` for your security requirements.
   ```
   firebase deploy --only firestore:rules
   ```

2. **Storage Rules**
   Review and update `storage.rules` for your security requirements.
   ```
   firebase deploy --only storage
   ```

### Custom Domain (Optional)

1. Go to Firebase Console > Hosting
2. Click "Add custom domain"
3. Follow the verification process
4. Update your DNS records as instructed

## Monitoring and Maintenance

1. **Firebase Console**
   - Monitor usage in Firebase Console
   - Check error reports
   - Review authentication logs
   - Monitor Firestore usage

2. **Performance Monitoring**
   - Enable Firebase Performance Monitoring
   - Review load times and other metrics
   - Set up alerts for performance issues

3. **Cost Management**
   - Monitor Firebase usage quotas
   - Set up budget alerts
   - Review pricing tiers

## Local Development Tools

1. **Firebase Emulators**
   ```bash
   # Start all emulators
   firebase emulators:start

   # Start specific emulators
   firebase emulators:start --only firestore,auth
   ```

2. **Development Services**
   Use PM2 to manage local development services:
   ```bash
   # Start all services
   pm2 start ecosystem.config.js

   # Monitor services
   pm2 monit

   # View logs
   pm2 logs
   ```

## Troubleshooting

1. **Deployment Issues**
   - Check Firebase deployment logs
   - Verify build output
   - Check Firebase quotas and limits

2. **Local Development Issues**
   - Clear Firebase emulator data
   - Check port conflicts
   - Verify environment variables

3. **Common Solutions**
   ```bash
   # Clear Firebase cache
   firebase logout
   firebase login

   # Reset emulator data
   firebase emulators:start --clear-data

   # Check Firebase status
   firebase status
   ```

## Support and Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Console](https://console.firebase.google.com)
- [Firebase GitHub](https://github.com/firebase) 