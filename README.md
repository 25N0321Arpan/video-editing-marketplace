# VideoMarket - Video Editing Marketplace

A full-featured marketplace web application connecting video owners with professional editors. Built with Node.js, Express, SQLite, and Bootstrap 5.

## Features

- **User Authentication** - JWT-based auth with role management (owner/editor/both/admin)
- **Job Marketplace** - Post, browse, filter, and claim video editing jobs
- **Escrow Payment System** - Funds held securely until work is approved
- **Submission Workflow** - Editors submit work (file upload or URL), owners review and accept/reject
- **Wallet System** - Deposit, withdraw, and track transactions
- **Admin Dashboard** - Platform revenue tracking and user management
- **Responsive Design** - Bootstrap 5 with custom styling

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: SQLite (better-sqlite3)
- **Templating**: EJS
- **Frontend**: Bootstrap 5
- **File Storage**: Local storage via Multer
- **Auth**: JWT tokens (cookie-based)

## Getting Started

### Prerequisites
- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd video-editing-marketplace

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Seed the database with sample data
npm run seed

# Start the server
npm start
```

The app will be running at `http://localhost:3000`

## Project Structure

```
├── config/          # Database configuration
├── middleware/      # Auth middleware
├── models/          # Database models (User, Job, Submission, Transaction)
├── routes/          # Express route handlers
├── views/           # EJS templates
│   └── partials/    # Shared header/footer
├── public/          # Static assets (CSS, JS, uploads)
├── seed/            # Database seeder
└── server.js        # Application entry point
```

## Test Accounts (after seeding)

| Role   | Email                     | Password    |
|--------|---------------------------|-------------|
| Admin  | admin@videomarket.com     | admin123    |
| Owner  | sarah@example.com         | password123 |
| Owner  | mike@example.com          | password123 |
| Owner  | emma@example.com          | password123 |
| Editor | alex@example.com          | password123 |
| Editor | priya@example.com         | password123 |
| Editor | james@example.com         | password123 |

## Business Logic

### Job Posting
1. Owner deposits funds to wallet
2. Post a job - budget is deducted as escrow
3. Editor claims job, submits edited video
4. Owner accepts → editor paid (90%), platform keeps 10% commission
5. Owner rejects → editor can revise, job stays open

### Commission Structure
- Platform takes **10%** of each completed job
- Editors earn **90%** of the job budget
- Payments are instant upon acceptance

