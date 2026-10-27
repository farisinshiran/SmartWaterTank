# Architecture Diagram

This document describes the checked-in React Native application and the two separate ESP32 firmware modes. The Firestore mode is the path used for tank telemetry; the local web-server mode is a separate DHT demonstration and does not write to Firestore.

## Application Architecture

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart TD
    subgraph Inputs["Physical inputs"]
        Button20["Button GPIO 25"]
        Button90["Button GPIO 26"]
    end
    subgraph Device["ESP32 firmware"]
        Firmware["Firebase telemetry firmware"]
    end
    subgraph Firebase["Firebase services"]
        Auth["Firebase Authentication"]
        Telemetry[("Firestore telemetry_logs")]
        Access[("Membership and alarm settings")]
        Notices[("User notification documents")]
        Functions["Cloud Functions"]
        Push["Firebase Cloud Messaging"]
    end
    subgraph Clients["Application clients"]
        Android["React Native Android"]
        Web["React Native Web"]
    end

    Button20 -->|"debounced input"| Firmware
    Button90 -->|"debounced input"| Firmware
    Firmware -->|"email password sign in"| Auth
    Firmware -->|"create telemetry document"| Telemetry
    Auth -->|"authenticated session"| Android
    Auth -->|"authenticated session"| Web
    Telemetry -->|"real time snapshots"| Android
    Telemetry -->|"real time snapshots"| Web
    Telemetry -->|"document created trigger"| Functions
    Functions -->|"read membership and settings"| Access
    Functions -->|"write alert records"| Notices
    Functions -->|"send device push"| Push
    Notices -->|"notification snapshots"| Android
    Notices -->|"notification snapshots"| Web
    Push -->|"deliver push"| Android
    Push -->|"deliver push"| Web
    Android -->|"test notification call"| Functions
    Web -->|"test notification call"| Functions
~~~

### Technology Stack Summary

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Firmware | Arduino framework on ESP32 | PlatformIO platform is not pinned | Read GPIO inputs, debounce changes, authenticate, and create telemetry documents |
| Firmware data path | Firebase ESP Client | Not pinned in `platformio.ini` | Write telemetry to Cloud Firestore |
| Application | React Native and React Native Web | React Native 0.87.1; React 19.2.3 | Shared Android and browser UI |
| Native Firebase | React Native Firebase | 26.4.0 | Android authentication, Firestore, and messaging |
| Web Firebase | Firebase JavaScript SDK | 13.0.0 | Browser authentication, Firestore, and messaging |
| Backend | Firebase Cloud Functions | Node.js 22; Functions v2 | Evaluate telemetry and manage alarm notifications |
| Build | Webpack and Android Gradle | Webpack 5; Gradle wrapper | Serve the browser client and build the Android app |

### Data Storage & External Services

Cloud Firestore is the shared source for `telemetry_logs`, membership, alarm settings, and per-user notifications. The Android and web clients subscribe to telemetry with Firestore snapshots; Cloud Functions react to new telemetry and handle notification workflows, with Firebase Cloud Messaging for device push. Firebase Authentication protects the app's membership-based reads. Realtime Database also exists in the codebase, but it is not the source read by the current dashboard and history flow. The separate ESP32 `webserver` build serves DHT readings and a lamp control page locally and does not connect to Firestore.

### Key Architectural Decisions

- The app separates UI, hooks, repositories, mappers, and Firebase services; Android and web use different Firebase SDK adapters.
- `src/main.cpp` and `src/webserver/main.cpp` are mutually exclusive PlatformIO firmware environments. The former writes Firestore telemetry; the latter serves local SSE sensor data and lamp control.
- Cloud Functions own alarm evaluation and notification creation; client notifications are read from Firestore and push delivery is a separate FCM path.

## Component Relationships

<!-- mermaid-checked: no \n, no em-dash/en-dash, no {} in labels, subgraphs are id["label"], arrows are -->|"label"|, all subgraphs closed by end, ids unique -->
~~~mermaid
flowchart LR
    subgraph DeviceParts["ESP32 input and firmware"]
        cButtons["Buttons GPIO 25 and 26"]
        cFirmware["Firestore firmware"]
    end
    subgraph Presentation["Application presentation"]
        cDashboard["Dashboard"]
        cHistory["History"]
        cNotifications["Notification center"]
        cDemo["Demo control panel"]
    end
    subgraph AppData["Application data flow"]
        cHook["useTelemetry"]
        cRepository["Telemetry repository"]
        cFirestoreService["Firestore telemetry service"]
        cNotificationService["Notification service"]
    end
    subgraph Cloud["Firebase backend"]
        cTelemetry[("Firestore telemetry_logs")]
        cAccess[("Membership and alarm settings")]
        cNotice[("User notification documents")]
        cFunction["Cloud Functions"]
        cRTDB[("Realtime Database")]
        cFCM["Firebase Cloud Messaging"]
    end

    cButtons -->|"debounced sensor state"| cFirmware
    cFirmware -->|"writes telemetry"| cTelemetry
    cDashboard -->|"latest and history data"| cHook
    cHistory -->|"history data"| cHook
    cHook -->|"subscribes"| cRepository
    cRepository -->|"maps rows"| cFirestoreService
    cFirestoreService -->|"onSnapshot query"| cTelemetry
    cNotifications -->|"membership and notices"| cNotificationService
    cNotificationService -->|"reads and updates"| cAccess
    cNotificationService -->|"subscribes and updates status"| cNotice
    cNotificationService -->|"callable test request"| cFunction
    cTelemetry -->|"create trigger"| cFunction
    cFunction -->|"creates notices"| cNotice
    cFunction -->|"sends push"| cFCM
    cDemo -.->|"native scenario write path"| cRTDB
    cDemo -.->|"web or fallback write attempt"| cTelemetry
~~~

### Component Inventory

| Component | Layer | Type | Responsibility |
|---|---|---|---|
| GPIO 25 and GPIO 26 buttons | Device | Inputs | Simulate the 20% and 90% sensor states; LOW means detected |
| Firestore firmware | Device | ESP32 firmware | Debounce button state and create a Firestore record on change or heartbeat |
| Dashboard | Presentation | React Native component | Render current level, sensor states, pump status, and a telemetry chart |
| History | Presentation | React Native screen | Render recent Firestore telemetry records |
| Notification center | Presentation | React Native component | Check membership, show alarm settings and notices, and offer push actions |
| Demo control panel | Presentation | React Native component | Expose demo scenarios and architecture view; its current write paths differ by platform |
| useTelemetry | Application logic | Hook | Subscribe to recent telemetry and provide loading/error state |
| Telemetry repository | Data | Repository | Subscribe, map Firestore rows, and expose logs to the UI |
| Firestore telemetry service | Data | Firebase service | Query `telemetry_logs` by tank and newest `createdAt` |
| Notification service | Data | Firebase service | Read membership/settings/notices and call the test-notification function |
| Cloud Functions | Backend | Serverless functions | Evaluate telemetry, manage alarm incidents, and create notification records |

## Current Demo Trace and Known Gaps

Example trace for GPIO 26: pressing the button pulls the input LOW. After the debounce interval, the firmware sets `sensor90Percent` to `true`; its pump status is derived as `OFF` when the 90% input is active. When Firebase is ready, it creates `telemetry_logs/{tankId}_{epoch}` with `tankId`, both sensor booleans, `pumpStatusRead`, and a UTC `createdAt` timestamp. The app's Firestore query filters by tank ID, orders by `createdAt` descending, and maps the newest row into dashboard level `90%`; the same query supplies the history list. A new document can also trigger the server-side alarm workflow.

The following behavior should be presented as incomplete until its cause is addressed:

- The selected Firestore Emulator is not configured in `firebase.json` or in the app SDK setup. The clients and firmware currently target Firebase project configuration, so running the existing scenario controls or physical buttons would not seed the emulator.
- The existing `scripts/seed-firestore.js` uses a placeholder demo UID and service-account credentials, and initializes Firebase Admin without emulator routing. It must not be run as-is for this emulator demo.
- The app's `DemoControlPanel` uses Realtime Database first on native and returns after that write, while the dashboard and history read Firestore. On web it attempts a Firestore write with a numeric `createdAt` and an extra `sensor50Percent` field; the Firestore rules require a timestamp and reject fields outside the allowed schema.
- The notification center only renders the app when the signed-in UID has active tank membership. The seed script's placeholder UID therefore does not grant access to an unrelated signed-in user.
- The test-notification button calls a regional Cloud Function, and push delivery additionally requires a registered device token and messaging setup. Neither is routed to a local emulator by the current configuration.
- The pump status in the GPIO firmware is simulated from sensor state; it does not control a physical pump. The alternative local web-server firmware is a DHT/lamp demonstration, not the Firestore telemetry pipeline.
