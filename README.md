# GoMapper: Your Intelligent Outreach & Location Tracker

[![GoMapper Screenshot]([[https://via.placeholder.com/1200x600?text=GoMapper+Screenshot]](https://ik.imagekit.io/jgy2bd7dv/Screenshot%202025-07-27%20032144.png?updatedAt=1753566762952)(https://ik.imagekit.io/jgy2bd7dv/Screenshot%202025-07-27%20031733.png?updatedAt=1753566763772))]

- [GoMapper](https://go-mapper.vercel.app/) is Live

## Table of Contents

-   [About GoMapper](#about-gomapper)
-   [Core Features Implemented](#core-features-implemented)
-   [Future Enhancements & Ideas](#future-enhancements--ideas)
-   [Getting Started](#getting-started)
-   [Technology Stack](#technology-stack)
-   [Contributing](#contributing)
-   [License](#license)

---

## 1. About GoMapper

GoMapper is a versatile web-based mapping application designed to help individuals and organizations efficiently track, manage, and visualize location-based data for various purposes. Whether you're an NGO coordinating medical check-ups in remote villages, a survey team organizing field data collection, or an adventurer planning custom trekking routes, GoMapper provides the tools you need to map your world.

Our goal is to transform traditional location tracking into a dynamic, user-specific, and insightful experience.

## 2. Core Features Implemented

GoMapper currently offers a robust set of features to empower your mapping needs:

### **Authentication & User Management**

-   **Secure Authentication:** User login and signup using email/password.
-   **Social Login:** Seamless integration with Google authentication.
-   **Password Recovery:** Secure "Forgot Password" flow with email-based reset links.
-   **User-Specific Data Isolation:** All user data (projects and pins) is strictly compartmentalized and accessible only by the authenticated owner, enforced by Firebase Security Rules.
-   **Auth Flow:** Dedicated landing page for unauthenticated users, with automatic redirection to the map for logged-in users.

### **Project Management**

-   **User-Specific Projects:** Authenticated users can create and manage their own distinct projects. Each project acts as an independent map workspace.
-   **Project Creation:** Intuitive interface in the sidebar to create new projects.
-   **Project Selection:** Easily switch between existing projects, dynamically updating the map and associated data.
-   **Project Actions:** Rename and delete projects directly from the sidebar.

### **Pin Management & Mapping**

-   **Flexible Pin Addition:**
    -   **Manual Map Click:** Add new pins by simply clicking on the map.
    -   **Location Search:** Utilize a global "Search Map" button (bottom-right) to open a search modal. Search for locations by name (powered by OpenCage Geocoding API), view results, and select a location to place a temporary marker on the map.
    -   **Temporary Marker Confirmation:** Click the temporary marker to confirm the location and open the pin details form.
-   **Pin Status Tracking:** Categorize pins with "Not Visited," "Planned," and "Visited" statuses, reflected by distinct pin colors on the map.
-   **Comprehensive Pin Details:**
    -   Edit pin information including: Name, Status, Notes, Last Visit Date, Next Visit Target Date, Tehsil, and Population.
    -   Manage multiple "Parent Contacts" (Name & Contact Number) for each pin.
    -   Additional details fields are togglable for a cleaner form interface.
-   **Pin Actions:** Edit and delete individual pins directly from their map popups.
-   **Live Geolocation:** A "Locate Me" button to instantly center the map on the user's current physical location.
-   **Dynamic Map View:** The map automatically adjusts its zoom and center (`fitBounds`) to display all currently filtered and visible pins within the selected project.

### **Dashboard & Data Insights**

-   **Map Summary Panel:** An expandable/collapsible panel (bottom-right) provides:
    -   Real-time statistics (Total, Visited, Planned, Not Visited pins).
    -   Clickable stats cards to filter pins by status.
    -   Integrated search bar to filter pins by name.
    -   List view of filtered pins.
    -   Export functionality to download pin data as a CSV.
-   **Detailed Dashboard Page:** Includes analytics and visual summaries of project data (charts, calendars, activity logs).
-   **Contacts Page:** A dedicated page to view and manage parent contacts associated with your pins.

## 3. Future Enhancements & Ideas

GoMapper is continuously evolving. Here are some exciting features we envision:

### **Advanced Mapping & Geolocation**

-   **Automated Pin Generation for Regions:** For "village outreach" users, integrate advanced geocoding services to automatically generate pins for all entities (e.g., villages) within a specified administrative boundary (district/tehsil).
-   **Route Optimization & Path Drawing:** Enable users to draw lines/polygons on the map and integrate with routing APIs (e.g., Google Directions API, Mapbox Directions) to generate optimized paths between selected pins, useful for hikers/travelers.
-   **Geofencing:** Define custom boundaries on the map and trigger actions or alerts when pins enter/exit these zones.
-   **Custom Map Layers:** Implement a "Layer Control" to switch between different map types (e.g., satellite, terrain, custom themes) and overlay various data layers.

### **Enhanced Project Management & Collaboration**

-   **Project Sharing & Collaboration:** Allow users to invite others to view or edit their projects with different permission levels.
-   **Project Archiving:** Ability to archive old projects without permanently deleting them.
-   **Project Search/Filter:** Implement search and additional filtering options within the sidebar for users with many projects.

### **Data Visualization & Analytics**

-   **Customizable Dashboard Widgets:** Allow users to personalize their dashboard with preferred charts and metrics.
-   **Heatmaps:** Visualize pin density based on status or other attributes for deeper insights.
-   **Time-Series Tracking:** Track changes in pin status over time to monitor progress.

### **User Experience & Platform Growth**

-   **Offline Capabilities:** Enable users to download map tiles and pin data for offline access in areas with no internet connectivity.
-   **User Profile & Settings:** A dedicated "My Profile" page to update username, email, password, and manage app preferences.
-   **Native Mobile Applications:** Explore building companion mobile applications for seamless field data collection.

## 4. Getting Started

To get GoMapper up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/theopendraft/Go_Mapper.git](https://github.com/theopendraft/Go_Mapper.git)
    cd Go_Mapper
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Set up Firebase:**
    -   Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
    -   Enable **Firestore Database** (start in production mode and immediately set up [Security Rules](https://firebase.google.com/docs/firestore/security/overview)).
        ```firestore
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            match /users/{userId} {
              allow read, create: if request.auth != null && request.auth.uid == userId;
              allow update, delete: if request.auth.uid == userId;

              match /projects/{projectId} {
                allow read, create: if request.auth != null && request.auth.uid == userId;
                allow update, delete: if request.auth.uid == userId;

                match /pins/{pinId} {
                  allow read, create: if request.auth != null && request.auth.uid == userId;
                  allow update, delete: if request.auth.uid == userId;
                }
              }
            }
          }
        }
        ```
    -   Enable **Authentication** methods you intend to use (Email/Password, Google).
    -   **Crucially, configure the "Custom action URL"** in Firebase Authentication Settings (under "Email templates"). This is the URL Firebase redirects to for password resets, email verifications, etc.
        -   **For Local Development:** `http://localhost:5173/auth-action` (replace `5173` with your actual Vite port).
        -   **For Production:** `https://yourdomain.com/auth-action` (replace `yourdomain.com` with your app's domain).
        -   Add `localhost` and your production domain to the "Authorized domains" list.
    -   Create a `.env` file in your project root and add your Firebase configuration and OpenCage API key:
        ```env
        VITE_FIREBASE_API_KEY=your_firebase_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
        VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
        VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
        VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_Messaginger_id
        VITE_FIREBASE_APP_ID=your_firebase_app_id
        VITE_OPENCAGE_API_KEY=your_opencage_api_key # Get this from OpenCage dashboard: [https://opencagedata.com/](https://opencagedata.com/)
        ```
    -   **Important:** Replace placeholder values with your actual Firebase and OpenCage credentials. **Do not commit your `.env` file to Git.**
4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
5.  **Open your browser:**
    -   Navigate to `http://localhost:5173` (or the port Vite outputs).

## 5. Technology Stack

-   **Frontend:** React, TypeScript, Vite
-   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
-   **Mapping:** [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/)
-   **On-Map Search:** [Leaflet-GeoSearch](https://github.com/smeijer/leaflet-geosearch)
-   **Geocoding:** [OpenCage Geocoding API](https://opencagedata.com/)
-   **Authentication & Database:** [Google Firebase](https://firebase.google.com/) (Authentication, Firestore)
-   **Icons:** [React Icons](https://react-icons.github.io/react-icons/) (Feather Icons, Font Awesome)
-   **Animations:** [Framer Motion](https://www.framer.com/motion/) (for subtle UI animations)
-   **Routing:** [React Router DOM](https://reactrouter.com/en/main)
-   **Notifications:** [React Toastify](https://fkhadra.github.io/react-toastify/)
-   **Utilities:** [Lodash](https://lodash.com/) (for debounce)

## 6. Contributing

We welcome contributions! If you have suggestions or want to contribute to GoMapper, please feel free to open issues or submit pull requests.

## 7. License

This project is licensed under the MIT License.

---
