# Small Business Inventory Tracker

A full-stack inventory management system built for a single authenticated business owner to track products, manage stock levels, and view pricing across currencies.

Built as a practice project to learn end-to-end authentication, REST API design, and production-style frontend/backend hardening.

## Features

- **Authentication** — secure login/logout via Auth0, with protected routes on both frontend and backend
- **Product Management** — full CRUD (create, read, update, delete) with server-side validation
- **Live Currency Conversion** — view any product's price converted into a selected foreign currency, using live exchange rates
- **Inventory Dashboard** — total inventory value, low-stock alerts, and a full product overview
- **Dark / light theme** — with system-preference detection and persistence across sessions

## Tech Stack

**Frontend:** React, Vite, React Router, SCSS, Framer Motion, Auth0 React SDK
**Backend:** Flask, SQLAlchemy, SQLite, joserfc (JWT verification)
**Auth:** Auth0 (SPA Application + API, RS256, PKCE flow)
**External API:** [Frankfurter](https://frankfurter.app) for live currency exchange rates

## Prerequisites

- Node.js and npm
- Python 3.10+
- An [Auth0](https://auth0.com) account (free tier is sufficient)

## Setup

### 1. Clone the repository

```
git clone <your-repo-url>
cd inventory-tracker
```

### 2. Auth0 configuration

You'll need two things set up in your Auth0 dashboard:

- **An Application** (type: Single Page Application) — note its **Domain** and **Client ID**
- **An API** (signing algorithm: RS256) — note its **Identifier**, and add `http://localhost:5173` to the Application's Allowed Callback URLs, Allowed Logout URLs, and Allowed Web Origins

### 3. Backend setup

```
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_API_AUDIENCE=https://your-api-identifier
FLASK_DEBUG=true
```

### 4. Frontend setup

```
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_API_AUDIENCE=https://your-api-identifier
```

### 5. Install root dev dependencies

From the project root:

```
npm install
```

This installs `concurrently`, which lets both servers start together with one command.

## Running the app

From the project root:

```
npm run dev
```

This starts both the Flask backend (`http://localhost:5000`) and the Vite frontend (`http://localhost:5173`) together, with labeled, color-coded output for each.

Visit `http://localhost:5173` and log in.

## Project Structure

```
inventory-tracker/
├── backend/
│   ├── app.py              # Flask app entry point, config
│   ├── auth.py             # JWT verification (joserfc)
│   ├── models.py           # SQLAlchemy Product model
│   ├── routes.py           # Product CRUD + currency conversion endpoints
│   ├── extensions.py       # Shared SQLAlchemy db instance
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── hooks/          # useProducts, useCurrencyRate, useTheme
│   │   ├── utils/          # formatPrice, formatCurrency
│   │   ├── styles/         # SCSS partials (tokens, base, nav, layout, table, dashboard, home)
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ProductRow.jsx
│   │   ├── AddProductForm.jsx
│   │   ├── Nav.jsx
│   │   └── Auth0ProviderWithNavigate.jsx
│   └── package.json
└── package.json            # Root script to run both servers together
```

## Scope

This project intentionally does not include: multi-user accounts, payment processing, cloud hosting, a mobile app, automated restocking/supplier integration, or historical reporting. See the original project documentation for full scope boundaries.
