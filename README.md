# Library Management System

Production-ready, closed Library Management System built with **Next.js 14**, **FastAPI (async SQLAlchemy 2.0)**, and **PostgreSQL**.

---

## 1. Backend Setup (FastAPI & PostgreSQL)

### Requirements
- Python 3.10+
- PostgreSQL database

### Installation & Run
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt

# Create .env based on .env.example
copy .env.example .env

# Run FastAPI server (auto-creates tables and initial admin: admin / admin123)
uvicorn app.main:app --reload --port 8000
```

---

## 2. Frontend Setup (Next.js 14 & Tailwind CSS)

### Requirements
- Node.js 18+

### Installation & Run
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Initial Default Credentials
- **Username:** `admin`
- **Password:** `admin123`
