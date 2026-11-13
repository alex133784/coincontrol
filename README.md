# CoinControl

Lightweight, offline-first personal budget and expense tracker built as a Progressive Web App (PWA).

## Features

- **Quick Entry:** Log expenses by category in two taps using an on-screen keypad.
- **Daily Limit Calculation:** Automatically divides available balance by remaining days in the period.
- **Expense Analytics:** Client-side donut chart rendered via HTML5 Canvas with 50/30/20 spending breakdown.
- **Savings Goal ("Pay Yourself First"):** Optional automatic 20% allocation from incoming funds toward a target goal.
- **Local Storage & Backup:** All data stays on the device in `localStorage` with JSON export, import, and clipboard copy.

## Tech Stack

- HTML5, CSS3 (Flexbox / Grid, CSS Custom Properties)
- Vanilla JavaScript (ES6 Modules)
- HTML5 Canvas API & Web Storage API
- Service Worker & Web App Manifest

## Live Demo

Hosted via GitHub Pages: `https://alex133784.github.io/coincontrol/`
