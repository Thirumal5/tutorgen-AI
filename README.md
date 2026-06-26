# TutorGen AI 🚀

TutorGen AI is a comprehensive, full-stack educational and mentorship management system. It provides an institutional hierarchy to manage students' academic progress while offering AI-driven, competitive programming (DSA) assessments with real-time feedback, complexity analysis, and personalized learning roadmaps.

## 🌟 Key Features

*   **Hierarchical Role Management**: A deeply integrated role system defining institutional structure.
    *   **Super Admin** -> Creates and manages Deans.
    *   **Dean** -> Manages Heads of Departments (HODs).
    *   **HOD** -> Manages Mentors within their department.
    *   **Mentor** -> Directly manages and tracks a group of Students.
*   **AI-Powered Assessments**: Powered by the Groq SDK (`llama-3.3-70b-versatile`), students receive dynamically generated Data Structures and Algorithms (DSA) problems tailored to specific topics and difficulty levels.
*   **Automated Code Review**: The AI acts as an expert code reviewer, analyzing student submissions for Correctness, Time/Space Complexity, and Edge Case handling.
*   **Personalized Roadmaps**: Students receive actionable feedback and AI-generated roadmaps to improve weak areas and strengthen their competitive programming skills.
*   **Performance Tracking**: Dashboards for all roles to track hierarchical metrics and student progress seamlessly.

## 💻 Tech Stack

*   **Frontend**: React 19, Vite, Tailwind CSS v4, React Router DOM, Lucide React, Axios.
*   **Backend**: Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Bcrypt, Multer (for CSV bulk uploads).
*   **Database**: MongoDB.
*   **AI Engine**: Groq SDK (LLaMA 3.3 70B model).

## 📂 Project Structure

```text
tutorgen-AI/
├── backend/
│   ├── Ai/             # AI Agents (Question Generator, Reviewer, Feedback)
│   ├── Controllers/    # API Controllers
│   ├── DB/             # MongoDB Connection Setup
│   ├── Middleware/     # Auth & Role verification middlewares
│   ├── Model/          # Mongoose Models (User, Assessment, Feedback, etc.)
│   ├── routes/         # Express API Routes
│   └── index.js        # Main Express server entry point
├── frontend/
│   ├── src/
│   │   ├── assets/     # Static assets
│   │   ├── components/ # Reusable UI components
│   │   ├── context/    # React Context (AuthContext)
│   │   ├── pages/      # Dashboards and Assessment views
│   │   └── App.jsx     # Main App routing
│   └── package.json    # Frontend dependencies
└── package.json        # Root workspace configuration
```

## 🛠️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd tutorgen-AI
   ```

2. **Install Root Dependencies (if applicable):**
   ```bash
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd backend
   npm install
   ```

4. **Install Frontend Dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Environment Variables:**
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GROQ_API_KEY=your_groq_api_key
   ```
   *Note: Also configure any necessary frontend `.env` files inside the `frontend` folder (e.g., `VITE_API_URL=http://localhost:5000`)*.

6. **Start the Application:**
   *   **Backend** (from `backend` directory):
       ```bash
       npm run dev
       ```
   *   **Frontend** (from `frontend` directory):
       ```bash
       npm run dev
       ```

## 🔐 Default Admin Login

Upon successfully connecting to the database, the backend automatically seeds a default **Super Admin** account:

*   **Email**: `superadmin@gmail.com`
*   **Password**: `thisissuperadminhere`

*Note: For all newly created sub-roles (Dean, HOD, Mentor, Student), the default password is `Kit@123` unless specified otherwise.*