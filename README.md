# NE-Connect AI

> Intelligent Logistics & Transit Coordination Platform

---

## 📖 About NE-Connect AI

**NE-Connect AI** is an advanced operational platform designed to unify fleet operations, driver management, automated dispatching, and predictive route optimization. By fusing real-time telematics with AI-assisted decision making, NE-Connect AI enhances resource allocation, cuts transit latency, and offers seamless visibility across all stakeholders.

---

## 🎯 Purpose of the Project

- **Intelligent Dispatching**: Optimize vehicle-to-load assignments dynamically using predictive algorithms.
- **Real-Time Telemetry & Tracking**: Provide low-latency status updates between drivers, dispatchers, and clients via WebSockets.
- **Actionable Operational Analytics**: Deliver unified reporting dashboards for system performance, driver utilization, and efficiency bottlenecks.
- **Modular Monorepo Architecture**: Streamline full-stack development, continuous integration, and deployments across web, mobile, AI, and backend services.

---

## 🚀 Current Development Phase

- **Current Milestone**: `NEC-7 — Initialize NE-Connect monorepo skeleton and workspace structure`
- **Branch**: `feature/NEC-7-monorepo-skeleton`
- **Phase Status**: Workspace structure initialization, baseline backend configuration, and architecture definition. Application features, models, pipelines, and AI engines will be developed in subsequent milestone sprints.

---

## 📂 Repository Structure

```
ne-connect/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration & DB connection logic
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Custom Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Business logic layer
│   │   ├── utils/           # Utility helpers & shared functions
│   │   └── server.js        # Main Express server entrypoint
│   ├── tests/               # Backend test suites
│   ├── .env.example         # Example environment configuration
│   └── package.json         # Node.js dependencies and run scripts
│
├── dashboard/               # Web management portal
│   └── README.md
│
├── driver-app/              # Mobile driver client
│   └── README.md
│
├── ai-engine/               # AI & optimization services
│   └── README.md
│
├── infra/                   # Infrastructure configuration
│   ├── docker/              # Container specifications
│   └── ansible/             # Configuration management scripts
│
├── docs/                    # Architecture and documentation
│   └── ARCHITECTURE.md
│
├── .gitignore               # Root git ignore definitions
└── README.md                # Project documentation root
```

---

## 🛠️ Getting Started (Backend Service)

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Install Dependencies
Navigate to the backend directory and install the packages:
```bash
cd backend
npm install
```

### 2. Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Health Check
Verify the service is running by requesting the health check endpoint:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "NE-Connect API is running"
}
```
