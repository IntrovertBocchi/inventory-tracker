# Small Business Inventory Tracker

A full-stack inventory management system built for a single authenticated business owner to track products, manage stock levels, and view pricing across currencies.

Built as a practice project to learn end-to-end authentication, REST API design, and production-style frontend/backend hardening.

## Features

- **Authentication** — secure login/logout via Auth0, with protected routes on both frontend and backend
- **Product Management** — full CRUD (create, read, update, delete) with server-side validation
- **Live Currency Conversion** — view any product's price converted into a selected foreign currency, using live exchange rates
- **Inventory Dashboard** — total inventory value, low-stock alerts, and a full product overview
- **Sandbox Payments** — record a sale through a real payment provider (Stripe test mode or Billplz sandbox), with stock automatically reduced once payment is confirmed — built behind a swappable gateway interface, so either provider runs through the exact same routes with a one-line config change
- **Dark / light theme** — with system-preference detection and persistence across sessions

## Tech Stack

**Frontend:** React, Vite, React Router, SCSS, Framer Motion, Auth0 React SDK
**Backend:** Flask, SQLAlchemy, SQLite, joserfc (JWT verification)
**Auth:** Auth0 (SPA Application + API, RS256, PKCE flow)
**Payments:** Stripe (test mode / Checkout Sessions + webhooks) and Billplz (sandbox), both behind a provider-agnostic `PaymentGateway` interface
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

PAYMENT_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=http://localhost:5173
```

`STRIPE_WEBHOOK_SECRET` comes from the [Stripe CLI](https://stripe.com/docs/stripe-cli) — run `stripe listen --forward-to localhost:5000/webhooks/stripe` once, and it will print the secret to use. This forwards Stripe's webhook events to your local server, since Stripe can't reach `localhost` directly. The root `npm run dev` script (below) starts this automatically alongside both servers.

**To use Billplz instead**, set `PAYMENT_PROVIDER=billplz` and add:

```
BILLPLZ_SECRET_KEY=your-secret-key
BILLPLZ_COLLECTION_ID=your-collection-id
BILLPLZ_API_BASE=https://www.billplz-sandbox.com/api/v3
BILLPLZ_CALLBACK_BASE=https://your-tunnel-url.ngrok-free.app
```

Billplz has no official local-tunneling tool (unlike Stripe's CLI), so `BILLPLZ_CALLBACK_BASE` needs a public URL pointing at your local server — [ngrok](https://ngrok.com) (`ngrok http 5000`) works well for this. Note the URL changes each time you restart ngrok on its free tier, so `BILLPLZ_CALLBACK_BASE` needs updating each session.

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

This starts the Flask backend (`http://localhost:5000`), the Vite frontend (`http://localhost:5173`), and the Stripe CLI's webhook listener together, with labeled, color-coded output for each.

Visit `http://localhost:5173` and log in.

## Project Structure

```
inventory-tracker/
├── backend/
│   ├── app.py              # Flask app entry point, config
│   ├── auth.py             # JWT verification (joserfc)
│   ├── models.py           # SQLAlchemy Product and Sale models
│   ├── routes.py           # Product CRUD + currency conversion endpoints
│   ├── sales_routes.py     # Sale creation + payment provider webhook endpoint
│   ├── payments/
│   │   ├── base.py             # PaymentGateway interface (create_payment, verify_webhook)
│   │   ├── factory.py          # Returns the active gateway based on PAYMENT_PROVIDER
│   │   ├── stripe_gateway.py   # Stripe implementation of the interface
│   │   └── billplz_gateway.py  # Billplz implementation of the interface
│   ├── extensions.py       # Shared SQLAlchemy db instance
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── hooks/          # useProducts, useCurrencyRate, useTheme, usePaymentStatus
│   │   ├── utils/          # formatPrice, formatCurrency, sanitizeNumericInput
│   │   ├── styles/         # SCSS partials (tokens, base, nav, layout, table, dashboard, home, dialog)
│   │   ├── Home.jsx
│   │   ├── Products.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ProductRow.jsx
│   │   ├── AddProductForm.jsx
│   │   ├── SellDialog.jsx
│   │   ├── ConfirmDialog.jsx
│   │   ├── PaymentStatusBanner.jsx
│   │   ├── Nav.jsx
│   │   └── Auth0ProviderWithNavigate.jsx
│   └── package.json
└── package.json            # Root script to run backend, frontend, and Stripe CLI together
```

## Screenshots

**Dashboard — healthy inventory**
![Dashboard, all products sufficiently stocked](./assets/dashboard-healthy.png)

**Dashboard — low stock alerts**
![Dashboard, showing low stock warnings](./assets/dashboard-low-stock.png)

**Responsive table with a long product name**
![Product table with a long name wrapping cleanly](./assets/long-name-wrap.png)

Long product names wrap cleanly within their column instead of breaking the table layout or spilling into adjacent columns.

**Protected routes with correct post-login redirect**
![Demo: unauthenticated user is redirected to login, then returned to the originally requested page](./assets/auth-redirect-demo.gif)

Visiting a protected route while logged out redirects to Auth0 login — and after logging in, lands back on the originally requested page, not a generic home screen.

**Dark / light theme transition**
![Demo: smooth theme toggle between light and dark mode](./assets/theme-toggle-demo.gif)

**Sandbox payment flow — Stripe**
![Demo: selling a product through Stripe test checkout, with stock updating after payment](./assets/sandbox-payment-demo.gif)

**Sandbox payment flow — Billplz**
![Demo: selling a product through Billplz sandbox checkout, with stock updating after payment](./assets/billplz-payment-demo.gif)

Selling a product opens a themed confirmation dialog, then redirects to a real hosted checkout session on whichever provider is active (Stripe test mode or Billplz sandbox). Once payment completes, stock is automatically reduced and a confirmation banner appears. No real money is involved with either provider — both are demoed here in sandbox/test mode only.

## Technical Highlights

### Backend: protecting every route with real token verification

```python
def requires_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)

        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        parts = auth_header.split()
        if parts[0].lower() != "bearer" or len(parts) != 2:
            return jsonify({"error": "Invalid Authorization header format"}), 401

        token = parts[1]
        try:
            claims = verify_token(token)
        except JoseError:
            return jsonify({"error": "Invalid or expired token"}), 401

        request.auth_claims = claims
        return f(*args, **kwargs)
    return decorated
```

Every product endpoint verifies the request's JWT — checking signature, audience, and issuer against Auth0's public keys — before any database logic runs. No route trusts the frontend's auth state alone.

### Frontend: avoiding a race condition on rapid currency switching

```js
useEffect(() => {
  if (!selectedCurrency) {
    setRate(null);
    return;
  }

  const controller = new AbortController();

  async function loadRate() {
    setRateLoading(true);
    setRate(null);
    try {
      const token = await getAccessTokenSilently();
      const data = await apiFetch(`/convert?to=${selectedCurrency}`, token, {
        signal: controller.signal
      });
      setRate(data.rate);
    } catch (err) {
      if (err.name === "AbortError") return;
      setRateError(err.message);
    } finally {
      if (!controller.signal.aborted) setRateLoading(false);
    }
  }

  loadRate();
  return () => controller.abort();
}, [selectedCurrency, getAccessTokenSilently]);
```

If a user switches currencies quickly, an older in-flight request could resolve after a newer one and overwrite it with stale data. `AbortController` cancels the previous request the instant a new one starts, so the displayed rate always matches the currently selected currency.

### Backend: a swappable payment provider interface

```python
class PaymentGateway(ABC):
    """
    The shared contract every payment provider must follow. Routes in the
    rest of the app only ever talk to this interface — never to Stripe or
    Billplz directly — so switching providers later means writing a new
    class that follows this same shape, not rewriting any routes.
    """

    @abstractmethod
    def create_payment(self, amount, description, payer_email):
        raise NotImplementedError

    @abstractmethod
    def verify_webhook(self, request):
        raise NotImplementedError
```

Routes call `get_payment_gateway()` and never know or care whether Stripe or Billplz is actually running underneath. Stock is only ever decremented after a webhook confirms a real payment succeeded — never at checkout creation, since a customer can always abandon or fail the actual payment.

### Backend: verifying a webhook by not trusting it at all

Stripe's SDK verifies its webhook signature directly. Billplz's callback signature turned out to depend on an idiosyncratic key-sorting rule not fully reflected in its own published examples, which made reproducing it exactly fragile. Rather than depend on getting a third-party signing algorithm byte-for-byte correct, the Billplz gateway treats the webhook as an **untrusted trigger only** — it extracts just the bill ID, then makes its own authenticated request back to Billplz's API to ask what actually happened:

```python
def verify_webhook(self, request):
    # We don't trust any field in the webhook's own POST body — a forged
    # request could claim anything. We only take the bill ID from it,
    # then ask Billplz directly, using our own Secret Key, what the
    # bill's real status is.
    params = request.form.to_dict()
    bill_id = params.get("id")

    if not bill_id:
        raise ValueError("Webhook payload missing bill id")

    response = requests.get(
        f"{self.api_base}/bills/{bill_id}",
        auth=(self.secret_key, "")
    )
    response.raise_for_status()
    bill = response.json()

    status = "paid" if bill.get("paid") is True else "failed"
    return {"reference_id": bill["id"], "status": status}
```

The webhook can never directly cause a stock change — it can only tell the server which bill to go check, and only Billplz's own authenticated API response is trusted as the source of truth.

## Scope

This project intentionally does not include: multi-user accounts, cloud hosting, a mobile app, automated restocking/supplier integration, or historical reporting. Payment processing was added later as a sandbox-only, test-mode learning exercise (Stripe test mode / Billplz sandbox) — no real transactions are possible. See the original project documentation for the original scope boundaries.
