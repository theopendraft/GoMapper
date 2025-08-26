# GoMapper: Your Intelligent Outreach & Location Tracker

[![GoMapper Screenshot](https://ik.imagekit.io/jgy2bd7dv/Screenshot%202025-07-27%20032144.png?updatedAt=1753566762952)](https://go-mapper.vercel.app/)

**[GoMapper is Live! Click here to try it out.](https://go-mapper.vercel.app/)**

---

## 1. About GoMapper

GoMapper is a versatile, web-based mapping application designed to help individuals and organizations efficiently track, manage, and visualize location-based data. Whether you're an NGO coordinating medical check-ups in remote villages, a survey team organizing field data collection, or an adventurer planning custom trekking routes, GoMapper provides the tools you need to map your world with precision and insight.

Our mission is to transform traditional location tracking into a dynamic, user-centric, and data-rich experience, all within a secure and intuitive interface.

## 2. Core Features Implemented

GoMapper offers a robust set of features designed for modern data management and field operations.

### **Authentication & User Management**

- **Modern UI:** A sleek, dark-themed, and animated interface for Login, Signup, and the public Landing Page.
- **Secure Authentication:** User login and signup using email/password, including secure "Forgot Password" flow.
- **Social Login:** Seamless one-click sign-in with Google.
- **User-Specific Data Isolation:** All user data (projects, pins, contacts) is strictly compartmentalized and accessible only by the authenticated owner, enforced by Firebase Security Rules.

### **Project Management**

- **User-Specific Projects:** Create and manage distinct projects, each acting as an independent map workspace.
- **Intuitive Sidebar:** A collapsible sidebar for easy project creation, selection, renaming, and deletion.
- **Auto-Selection:** The application intelligently opens the last-edited project upon login for a seamless workflow.

### **Pin Management & Mapping**

- **Flexible Pin Addition:**
  - **Manual Map Click:** Add new pins by simply clicking anywhere on the map.
  - **Global Location Search:** A powerful, navbar-integrated search finds locations worldwide.
- **Pin Status Tracking:** Categorize pins with "Not Visited," "Planned," and "Visited" statuses, reflected by distinct pin colors for at-a-glance understanding.
- **Comprehensive Pin Details:**
  - Edit pin information including Name, Status, Notes, Last Visit Date, Next Visit Target Date, Tehsil, and Population.
- **Pin Actions:** Edit and delete individual pins directly from their map popups.
- **Live Geolocation:** A "Locate Me" button to instantly center the map on the user's current physical location.
- **Dynamic Map View:** The map automatically adjusts its zoom and center (`fitBounds`) to display all currently filtered pins.

### **Contact Management**

- **Location-Based Contacts:** A dedicated "Contacts" page to manage contacts associated with specific map locations.
- **Interactive Modal:** Click on a location card to open a full-featured modal for adding, viewing, editing, and deleting contacts for that pin.
- **Responsive Design:** The contacts management interface is fully responsive for seamless use on desktop and mobile.

### **Dashboard & Data Insights**

- **Interactive Dashboard:** A dedicated page with analytics and visual summaries, including charts for pin status, a calendar for visit planning, and an activity log.
- **Map Summary Panel:** An expandable/collapsable and resizable panel on the map screen providing:
  - Real-time statistics (Total, Visited, Planned, Not Visited pins).
  - Clickable stat cards to filter pins by status.
  - Integrated search bar to filter pins by name.
  - A scrollable list view of filtered pins.
  - **CSV Export:** Download your filtered pin data with a single click.

### **Advanced Routing**

- **Multi-Stop Route Planning:** Add any number of pins to a route.
- **Turn-by-Turn Directions:** Generate and view detailed driving directions for your created route.
- **Route Optimization (TSP):** For routes with up to 10 pins, use the one-click "Optimize Route" feature to automatically reorder the pins for the shortest possible path (Traveling Salesperson Problem solver).

## 3. Technology Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Mapping:** Leaflet, React-Leaflet, Leaflet.MarkerCluster
- **On-Map Search & Routing:** Leaflet-GeoSearch, OSRM (Open Source Routing Machine)
- **Authentication & Database:** Google Firebase (Authentication, Firestore)
- **UI Components & Animations:** Shadcn UI, Framer Motion, Vaul, Lottie
- **Notifications:** Sonner (for toasts/snackbars)
- **Utilities:** Lodash, date-fns

## 4. Getting Started

To get GoMapper up and running on your local machine, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/theopendraft/Go_Mapper.git
    cd Go_Mapper
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Firebase:**

    - Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
    - Enable **Firestore Database** and set up security rules to protect user data.
    - Enable **Authentication** methods (Email/Password, Google).
    - In your project settings, create a `.env` file in the root and add your Firebase configuration keys:
      ```env
      VITE_FIREBASE_API_KEY=your_firebase_api_key
      VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
      VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
      VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
      VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
      VITE_FIREBASE_APP_ID=your_firebase_app_id
      ```
    - **Important:** Do not commit your `.env` file to version control.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
5.  **Open your browser** and navigate to `http://localhost:5173` (or the port specified by Vite).

## 5. Contributing

We welcome contributions! If you have suggestions or want to contribute to GoMapper, please feel free to open an issue or submit a pull request.

## 6. License

This project is licensed under the MIT License.
