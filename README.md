# Room Reservation System

A web-based application for managing organizational meeting rooms and halls. The system enables employees to request facilities, supports approval workflows, and helps administrators manage facilities, users, and reservations.

## Features

- **User authentication** — Sign-in and role-based access.
- **Reservation requests** — Submit room or hall reservation requests with dates, times, purposes, and participant details.
- **Approval workflows** — Support for two approval routes:
  - Employee → Facility Manager
  - Employee → Department Head → Facility Manager
- **Reservation management** — View reservations and track their statuses.
- **Facility management** — Manage meeting rooms, halls, and facility information.
- **User and department management** — Support administrative management of users, roles, and departments.
- **Approval route management** — Configure approval routes.
- **Audit logging** — Record relevant system activities.
- **Multilingual interface** — English, Amharic, and Afaan Oromo language resources.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Authentication | JWT-based authentication |
| Password hashing | bcryptjs |
| API communication | HTTP/REST |

## Project Structure

```text
RoomReservationSystem/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── i18n/
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the application:

- Node.js and npm
- PostgreSQL
- Git
- Visual Studio Code or another code editor

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Keno-taf/RoomReservationSystem.git
cd RoomReservationSystem
```

### 2. Configure the database

Create a PostgreSQL database for the application.

Configure the backend database connection using environment variables. Refer to the backend configuration and database setup scripts for the required database name, host, port, username, and password.

Do not commit `.env` files, database passwords, JWT secrets, or API credentials to GitHub.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

Configure the required environment variables before starting the backend.

### 4. Start the backend

Check the scripts in `backend/package.json` and use the appropriate development command. For example, if the project defines a `dev` script:

```bash
npm run dev
```

### 5. Install frontend dependencies

Open a second terminal from the project root:

```bash
cd frontend
npm install
```

### 6. Start the frontend

Check the scripts in `frontend/package.json`. If a `dev` script is defined, run:

```bash
npm run dev
```

Open the local URL displayed in the terminal, typically `http://localhost:5173`.

## Security

- Keep environment files and secrets out of version control.
- Store passwords as secure hashes rather than plain text.
- Use appropriate authentication and authorization for protected endpoints.
- Use test accounts and non-sensitive sample data when demonstrating the application.

## Project Status

This project is under development. Features, configuration requirements, and setup instructions may change as development progresses.

## Author

**Keno Taf**

GitHub: https://github.com/Keno-taf

## License

No license has been specified yet.
