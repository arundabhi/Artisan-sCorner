# Artisan's Corner Marketplace

Artisan's Corner is a production-ready, full-stack **Multi-Vendor E-Commerce Marketplace** built using the MERN stack (MongoDB, Express, React, Node.js). It connects local artisans, potters, weavers, and leatherworkers directly with buyers looking for high-quality, slow-made handcrafted products.

---

## Key Features

### Buyer Flow
* **Authentication**: Secure logins with JWT access tokens stored in HttpOnly cookies.
* **Persistent Cart**: Unified cart persisting across refreshes (localStorage + server database sync).
* **Wishlist**: Toggles bookmarking favorites.
* **Checkout**: Integration with Stripe payments.
* **Order Tracking**: Detailed buyer history with statuses (`PROCESSING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`).
* **Verified Reviews**: Users can review products they purchased. Product averages and review counts are recalculated dynamically.
* **Become a Seller**: Submission forms to apply for vendor status.

### Vendor Panel
* **Shop Profiles**: Configure custom logos, phone lines, descriptions, and addresses.
* **Product CRUD**: List creations, configure prices/SKUs, toggle availability, and upload up to 5 images.
* **Order Logistics**: Update shipment statuses for items belonging to the vendor. Mask other vendors' totals.
* **Earnings Reports**: Live charts graphing sales over time, net income, and top products (using Recharts).

### Admin Controls
* **Approval Queues**: Review vendor applications and activate/deactivate user accounts.
* **System Margin Control**: Dynamically configure the default 5% platform commission rate, standard taxes, and flat shipping rates.
* **Consolidated Analytics**: Track gross marketplace volume, platform fee revenue, vendor counts, and sales trends.

---

## Tech Stack
* **Frontend**: React.js, Vite, Tailwind CSS v3, Redux Toolkit, React Hook Form, Recharts, Lucide React, React Hot Toast.
* **Backend**: Node.js, Express.js, MongoDB + Mongoose, JWT (HttpOnly cookies), bcryptjs, Multer, Cloudinary v2, Stripe SDK, Helmet, CORS, Express-Rate-Limit, express-mongo-sanitize, Zod.

---

## Folder Architecture

```text
artisan-corner/
│
├── client/                 # Vite React Frontend App
│   ├── src/
│   │   ├── api/            # Axios API config
│   │   ├── components/     # Reusable layout elements (Navbar, Skeletons)
│   │   ├── layouts/        # Page wrappers
│   │   ├── pages/          # Auth, Buyer, Vendor, and Admin views
│   │   ├── store/          # Redux Toolkit config and state slices
│   │   └── ...
│
├── server/                 # Express REST API Server
│   ├── src/
│   │   ├── config/         # DB connection & Cloudinary setup
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth checks, error handling, validation
│   │   ├── models/         # Mongoose DB models
│   │   ├── routes/         # Express endpoint routing
│   │   ├── services/       # Cloudinary streams and product queries
│   │   └── scripts/        # Seeding scripts
│   ├── tests/              # Jest backend integration tests
│   └── ...
│
├── docs/
│   └── database-schema.md  # Schema specs & ER Mermaid diagram
└── ...
```

---

## Local Setup & Installation

### Prerequisite
Ensure [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) are installed locally.

### 1. Clone & Install Dependencies
Run command lines in the root workspace:

```bash
# Install root package configs if necessary, then install child directories
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root workspace directory. Copy values from `.env.example`:

```env
# Server Settings
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/artisans_corner

# Authentication Secrets
JWT_ACCESS_SECRET=your_jwt_access_secret_key_change_me_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_change_me_in_production

# Frontend Client URL
CLIENT_URL=http://localhost:5173

# Cloudinary Credentials (Required for logo/product image uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Stripe Credentials (Required for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Default Platform Commission
PLATFORM_COMMISSION_PERCENT=5
```

### 3. Seed Database
Load default users (Admin, Vendor, Buyer), store profile, and 15 product listings:
```bash
cd server
npm run seed
```

### 4. Running Backend Tests
Ensure MongoDB is running, then run backend integration tests:
```bash
cd server
npm run test
```

### 5. Running the Application Locally
In separate terminals, run the start scripts:

```bash
# Start backend Express server (starts on port 5000)
cd server
npm run start

# Start frontend Vite server (starts on port 5173 with proxy configuration)
cd client
npm run dev
```

---

## Stripe Webhook Routing Local Setup
To forward events to your local server webhook `/api/payments/webhook`:
1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli).
2. Login and listen:
   ```bash
   stripe login
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
3. Set the returned webhook signing secret `whsec_...` to `STRIPE_WEBHOOK_SECRET` in your `.env`.

---

## Demo Credentials
Use these pre-seeded logins:

* **Demo Buyer**
  * Email: `buyer@artisanscorner.com`
  * Password: `password123`

* **Demo Vendor / Seller**
  * Email: `vendor@artisanscorner.com`
  * Password: `password123`

* **Demo Admin**
  * Email: `admin@artisanscorner.com`
  * Password: `password123`

---

## API Endpoints

### Auth
* `POST /api/auth/register` - Create account
* `POST /api/auth/login` - Login (sets HttpOnly cookie)
* `POST /api/auth/logout` - Clear cookies
* `GET /api/auth/me` - Profile context

### Products
* `GET /api/products` - Catalog search & paging
* `GET /api/products/:slug` - Details
* `POST /api/products` - Create (Vendor only)
* `PATCH /api/products/:id` - Edit (Vendor only)
* `DELETE /api/products/:id` - Delete (Vendor/Admin)

### Orders & Payments
* `POST /api/orders` - Prepare checkout & return Stripe clientSecret
* `GET /api/orders` - Buyer history
* `GET /api/orders/vendor` - Vendor payout shares list
* `PATCH /api/orders/:id/item-status` - Update shipping details
* `POST /api/payments/webhook` - Stripe webhook listener
