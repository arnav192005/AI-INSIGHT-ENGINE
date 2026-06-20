# 🚀 AI Insight Engine

**AI Insight Engine** is a powerful full-stack web application that leverages the Google Gemini AI model to summarize large documents, extract key insights, and provide a conversational AI chat experience. It features a modern, glassmorphism UI built with React and a robust Flask backend with an admin management panel.

## 🌟 Key Features

### 1. Document Summarization & AI Chat
- Upload PDFs or paste text and get instant, intelligent summaries using Google Gemini 2.5 AI.
- Choose between multiple AI models depending on the complexity of your document.
- Interactive chat feature to ask specific questions about your uploaded documents.

### 2. Modern Glassmorphism UI
- A visually stunning frontend built with **React** and **Vite**.
- Beautiful, responsive glass-like UI components, modals, and dynamic animations.
- "Show/Hide Password" toggle and smooth transition effects.

### 3. Secure User Authentication
- Complete Login and Registration system with data validation.
- Collects First Name, Last Name, Email, Phone, Username, and Password.
- 30-day "Remember Me" auto-login feature using secure cookies.

### 4. Hidden Admin Panel
- Special admin privileges for the `admin` username.
- A secure, hidden **Admin Dashboard** to view and manage all registered users on the platform directly from the UI.

### 5. Local Database
- Uses a local SQLite database (`users_extended.db`) via SQLAlchemy to safely store and manage user credentials and profile information.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, TailwindCSS (Glassmorphism Design)
- **Backend:** Python, Flask, Flask-SQLAlchemy, JWT (JSON Web Tokens)
- **AI Integration:** Google Gemini SDK (@google/generative-ai)
- **Database:** SQLite

## 🚀 Setup & Installation

### Backend Setup (Python/Flask)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the Flask server:
   ```bash
   python app.py
   ```
   *(The backend runs on http://localhost:5000)*

### Frontend Setup (React/Vite)
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(The frontend runs on http://localhost:5173)*

## 👨‍💻 Developer
Designed and developed by **Arnav Panwala**.
