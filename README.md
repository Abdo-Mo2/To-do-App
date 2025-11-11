# Professional To-Do App

A professional Angular To-Do application with Firebase authentication and cloud synchronization.

## Features

- ✅ **User Authentication**: Sign up and login with email/password
- ✅ **Cloud Sync**: Tasks are saved to Firebase Firestore and sync across all devices
- ✅ **Task Management**: Add, edit, delete, and toggle task completion
- ✅ **Filtering**: View All, Completed, or Pending tasks
- ✅ **Dark/Light Mode**: Toggle between themes with smooth transitions
- ✅ **GSAP Animations**: Smooth animations for all UI interactions
- ✅ **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password"
4. Create a Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (or set up security rules)
5. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web icon
   - Copy the Firebase configuration object

### 3. Update Environment Files

Update `src/environments/environment.development.ts` and `src/environments/environment.ts` with your Firebase configuration:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',
    authDomain: 'YOUR_AUTH_DOMAIN',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

### 4. Set Up Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/tasks/{taskId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Run the Application

```bash
npm start
```

The app will open at `http://localhost:4200`

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── header/
│   │   ├── add-todo/
│   │   ├── todo-list/
│   │   └── todo-item/
│   ├── pages/
│   │   ├── dashboard/
│   │   └── auth/
│   │       ├── login/
│   │       └── signup/
│   ├── services/
│   │   ├── auth.service.ts
│   │   └── todo.service.ts
│   ├── guards/
│   │   └── auth.guard.ts
│   ├── models/
│   │   └── task.model.ts
│   └── app.module.ts
├── assets/
│   ├── icons/
│   └── logo.png
└── environments/
    ├── environment.ts
    └── environment.development.ts
```

## Technologies Used

- **Angular 17**: Frontend framework
- **Firebase Authentication**: User authentication
- **Firestore**: Cloud database for task storage
- **Tailwind CSS**: Styling
- **GSAP**: Animations
- **Font Awesome**: Icons

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Login**: Sign in with your credentials
3. **Add Tasks**: Type a task and press Enter or click Add
4. **Edit Tasks**: Click the edit icon, modify, and save
5. **Toggle Completion**: Click the checkbox to mark tasks as complete
6. **Delete Tasks**: Click the trash icon to remove tasks
7. **Filter**: Use the filter buttons to view different task states
8. **Theme Toggle**: Click the moon/sun icon to switch themes
9. **Sign Out**: Click the Sign out button to log out

## Notes

- Tasks are automatically saved to Firebase and sync across devices
- Your theme preference is saved locally
- All animations use GSAP for smooth transitions

