<div align="center">

# 💰 MyPaisa

### Personal Finance & Expense Tracker

A modern, high-performance personal finance app built with **React Native**, **Expo SDK 54**, **Expo Router v6**, and **NativeWind v5** — track income, expenses, and inter-bank transfers with real-time balances, rich analytics, and offline-first storage.

[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020?style=flat-square&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#-license)

</div>

---

## 🌟 Key Features

|                              |                                                                                                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🏦 **Multi-Bank Accounts**   | Create and track separate bank accounts, set a primary account, and monitor individual + aggregated net balances.                                     |
| 💸 **Transaction Tracking**  | Log **Credits**, **Debits**, and **Self-Transfers** between your own accounts with automatic net-zero balance adjustments.                            |
| 📊 **Interactive Analytics** | Line charts via `react-native-gifted-charts`, filterable by Weekly / Monthly / Yearly / Custom ranges, with account-level and inflow/outflow toggles. |
| 📑 **Grouped Ledger**        | Date-grouped transaction log (Today, Yesterday, specific dates) with search and type/account filters.                                                 |
| 🏷️ **Custom Categories**     | Personalize categories with custom names and icons from `@expo/vector-icons`.                                                                         |
| 💾 **Offline-First**         | Instant local persistence via `zustand` + `@react-native-async-storage/async-storage`.                                                                |
| ⚡ **New Architecture**      | Fabric & TurboModules enabled, React 19, typed routes, and experimental React Compiler support.                                                       |

---

## 🛠️ Tech Stack

| Category        | Technology                                                                                              | Purpose                                                  |
| :-------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------- |
| **Framework**   | [Expo SDK 54](https://expo.dev)                                                                         | Native app framework, New Architecture enabled           |
| **Core**        | [React Native 0.81.5](https://reactnative.dev) / [React 19.1.0](https://react.dev)                      | Cross-platform runtime                                   |
| **Routing**     | [Expo Router v6](https://docs.expo.dev/router/introduction/)                                            | File-based routing with typed routes                     |
| **Styling**     | [NativeWind v5](https://www.nativewind.dev/) + [Tailwind CSS v4](https://tailwindcss.com/)              | Utility-first styling for native primitives              |
| **State**       | [Zustand v5](https://zustand-demo.pmnd.rs/)                                                             | Lightweight state management with persistence middleware |
| **Persistence** | [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)                             | Local key-value device storage                           |
| **Charts**      | [react-native-gifted-charts](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts)         | SVG-based line & bar charts                              |
| **Icons**       | [@expo/vector-icons](https://icons.expo.fyi/)                                                           | Ionicons vector icon set                                 |
| **Date Picker** | [@react-native-community/datetimepicker](https://github.com/react-native-datetimepicker/datetimepicker) | Native date/time selection                               |

---

## 📁 Project Architecture

```text
MyPaisa/
│
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Bottom tab navigation setup
│   │   ├── index.tsx           # Home dashboard view
│   │   ├── report.tsx          # Reports & analytics view
│   │   ├── add.tsx             # Add transaction shortcut tab
│   │   ├── ledger.tsx          # Complete transaction ledger
│   │   └── profile.tsx         # User profile & preferences
│   │
│   ├── _layout.tsx             # Root navigation layout
│   └── addTransaction.tsx      # Modal view for creating a transaction
│
├── assets/
│   ├── images/                 # App imagery & branding
│   └── icons/                  # Custom UI icons
│
├── constants/
│   └── AddTransactions.ts      # Transaction metadata, categories & icons
│
├── store/
│   └── useFinanceStore.ts      # Global finance and transaction state
│
├── app.json                    # Expo configuration & app manifest
├── global.css                  # Global Tailwind CSS styles
├── metro.config.js             # Metro bundler + NativeWind configuration
├── package.json                # Project dependencies & npm scripts
└── tsconfig.json               # TypeScript configuration

```

State is managed centrally in `useFinanceStore` (banks, transactions, categories) with computed helpers like `getBalance()`, `getNetBalance()`, and `getTodayStats()`.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18.x or higher
- **npm** / **yarn** / **pnpm**
- **Expo Go** app (iOS/Android) or a configured Simulator/Emulator

### Installation

```bash
cd MyPaisa
npm install
```

### Run the App

```bash
npx expo start
```

| Platform | Command           |
| :------- | :---------------- |
| Android  | `npm run android` |
| iOS      | `npm run ios`     |
| Web      | `npm run web`     |

---

## 📜 NPM Scripts

| Script            | Command            | Purpose                  |
| :---------------- | :----------------- | :----------------------- |
| `npm start`       | `expo start`       | Start the Metro bundler  |
| `npm run android` | `expo run:android` | Build & run on Android   |
| `npm run ios`     | `expo run:ios`     | Build & run on iOS       |
| `npm run web`     | `expo start --web` | Start the web dev server |
| `npm run lint`    | `expo lint`        | Run ESLint checks        |

---
