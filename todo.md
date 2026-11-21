# GPB Payments Platform — Build Plan

## 1. Design & Structure
- [x] Create folder structure (gpb/index.html, gpb/css/styles.css, gpb/js/app.js)
- [x] Build dark fintech design system (CSS variables, layout, components)

## 2. Core Application
- [x] Auth screen (demo login + admin PIN)
- [x] Dashboard: account card, 10-digit NUBAN, balances, FX engine, crypto wallet
- [x] Transfer flow: Bank / Wallet / Crypto routing, account name resolution, PIN, receipt
- [x] Transaction ledger with serial number, tx ID, timestamp, status
- [x] Admin back-office: debit/credit, freeze, activate, block
- [x] Cards (Visa/Mastercard), ATM/ISO 8583, USSD module
- [x] SMS + Email alert engine simulation
- [x] API / Monnify integration page (masked keys, backend note)

## 3. The Terminal
- [x] Live streaming transaction terminal (NIP / ISO8583 / SWIFT gpi / Chain / Webhook)
- [x] Status LEDs, TPS + latency stats, filters, pause, export
- [x] Interactive command line (help, status, tx, send, rates, netstat)

## 4. Deploy & Verify
- [x] Syntax check JS, validate HTML
- [x] Deploy to S3 pages
- [x] Live check deployed URL
