# OrientIA — AI-Powered Student Orientation App

OrientIA is a personalized orientation assistant for French students. It combines real Parcoursup 2026 data, a custom scoring algorithm, and Google Gemini AI to recommend the best academic pathways based on each student's profile.

---

## Prerequisites

- **Node.js** v18 or higher
- **Python** 3.x (for the Parcoursup data import script)
- **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com)
- The **Parcoursup dataset** JSON file: `fr-esr-cartographie_formations_parcoursup.json`

---

## Project Structure

```
orientation-app/
├── backend/          # Node.js + Express API
│   ├── prisma/       # Database schema (SQLite)
│   ├── scripts/      # Import scripts
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── frontend/         # React + Vite app
│   └── src/
│       ├── api/
│       ├── components/
│       ├── pages/
│       └── store/
└── formations_2026.json  # Generated Parcoursup data (after step 2)
```

---

## Installation & Setup

### Step 1 — Clone and install dependencies

```bash
# Install backend dependencies
cd orientation-app/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### Step 2 — Generate the Parcoursup dataset

Place the file `fr-esr-cartographie_formations_parcoursup.json` in the same folder as the script below, then run:

```bash
python generer_formations.py
```

This generates `formations_2026.json` with 25,928 cleaned entries from the 2026 dataset. Move it to the root of `orientation-app/`.

---

### Step 3 — Configure environment variables

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_jwt_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3001
```

- `JWT_SECRET` and `JWT_REFRESH_SECRET`: any long random strings
- `GEMINI_API_KEY`: your key from [aistudio.google.com](https://aistudio.google.com)

---

### Step 4 — Initialize the database

```bash
cd backend
npx prisma generate
npx prisma db push
```

---

### Step 5 — Import Parcoursup data

```bash
cd backend
node scripts/importFormations.js
```

You should see:
```
25928 formations à importer...
Import terminé ! 25928 formations dans la base.
```

---

## Running the App

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd orientation-app/backend
npm run dev
```
Server starts on `http://localhost:3001`

**Terminal 2 — Frontend:**
```bash
cd orientation-app/frontend
npm run dev
```
App available at `http://localhost:5173`

---

## How It Works

### Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | SQLite via Prisma ORM |
| AI | Google Gemini 2.5 Flash |
| Data | Parcoursup 2026 (25,928 programs) |

### Key Features

**1. Profile Setup**
Students fill in their academic background, grades (manual or extracted from a report card via Gemini Vision), budget, and geographic mobility preferences.

**2. RAG-based Search**
When a student submits a query, the app uses synonym mapping ("prépa" → CPGE, "médecine" → Etudes de santé) to retrieve matching programs from the Parcoursup database via SQL filtering.

**3. Custom Scoring Algorithm**
Each retrieved program is scored 0→100 based on 4 weighted criteria:
- Academic level (40 pts) — student's average vs program threshold
- Budget (30 pts) — declared budget vs estimated cost
- Mobility (20 pts) — program location vs preferred zones
- School type (10 pts) — public vs private

**4. AI Generation**
The student profile + scored programs are sent to Gemini, which generates the pathway steps, personalized analysis, and recommendations. Scores remain ours.

**5. Exploratory Chatbot**
For undecided students, a multi-turn chatbot asks questions about interests and values, then generates an orientation prompt used to trigger the recommendation engine.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/profile` | Get user profile |
| PUT | `/api/profile` | Update profile |
| POST | `/api/profile/extract-bulletin` | Extract grades from report card |
| POST | `/api/orientation/generate` | Generate pathway recommendations |
| GET | `/api/orientation/history` | Get search history |
| POST | `/api/chat/session` | Start chatbot session |
| POST | `/api/chat/message` | Send message to chatbot |
| GET | `/api/chat/sessions` | Get completed chat sessions |

---

## Database Schema

| Table | Description |
|---|---|
| `User` | Account credentials |
| `Profile` | Academic background, budget, mobility |
| `AcademicGrade` | Grades per subject |
| `MobilityZone` | Preferred geographic zones |
| `Formation` | 25,928 Parcoursup 2026 programs |
| `ChatSession` | Chatbot conversation sessions |
| `ChatMessage` | Individual chat messages |
| `OrientationRequest` | Orientation search queries |
| `OrientationResult` | AI-generated results |