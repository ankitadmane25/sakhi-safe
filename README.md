# 🌸 Sakhi Safe

A mobile-first web application designed for women's safety, featuring a calming pastel pink UI, panic button, shake detection, and Firebase Realtime Database integration for emergency contacts.

## ✨ Features
- **SOS Panic Button**: Triggers a 5-second countdown with a loud siren alarm and vibration.
- **Shake Detection**: Automatically triggers the SOS flow if the device is shaken vigorously.
- **Live Location Tracking**: Grabs the user's high-accuracy GPS coordinates to generate a Google Maps link.
- **Multilingual Support**: Supports sending emergency messages in English, Hindi, and Marathi.
- **Trusted Contacts**: Securely stores and manages emergency contact numbers in Firebase Realtime Database.
- **Email-free Authentication**: Simple, seamless manual login using just a Phone Number and Name.

## 🚀 How to Run Locally

### 1. Start a Local Web Server
Since this app uses ES Modules (`type="module"`) for Firebase initialization, it must be served over HTTP/HTTPS, **not** via the `file://` protocol.

You can use any local web server, for example:
- **VS Code Live Server** extension.
- **Python**: Run `python -m http.server 8000` in the directory, then visit `http://localhost:8000`.
- **Node.js**: Run `npx serve` or `npm install -g http-server` and run `http-server`.

### 2. Configure Firebase
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new Firebase project.
3. Add a **Web App** to your project to get your specific Firebase configuration object.
4. Open `firebase-config.js` in this application folder and replace the `firebaseConfig` variables with your actual keys.

### 3. Setup Firebase Realtime Database
1. In the Firebase Console, navigate to **Build > Realtime Database**.
2. Click **Create Database**.
3. Go to the **Rules** tab and set the following basic rules to allow read/write access (for simplified testing purposes):
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
*Note: In a true production environment, you should restrict writes to verified authenticated users using Firebase Rules.*

## 📱 Testing Shake Detection
To test shake detection:
1. You must run the app on a physical mobile device (or an emulator that supports simulating device motion).
2. The site should be served over HTTPS or `localhost` (browsers block accelerometer access on insecure `http://` sites).
3. Shake the device vigorously!

## 🛠️ Built With
- HTML5 / CSS3 (Vanilla)
- Vanilla JavaScript (ES6 Modules)
- Firebase Realtime Database v10.8
