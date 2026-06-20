import os
from datetime import timedelta
# pyrefly: ignore [missing-import]
import pypdf
from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from google import genai
# pyrefly: ignore [missing-import]
from google.genai import types
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

# Load server environment variables if present
load_dotenv()

app = Flask(__name__)
# Enable CORS for frontend local development
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users_extended.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'fallback-secret-key-123')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db = SQLAlchemy(app)
jwt = JWTManager(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(256), nullable=False)
    first_name = db.Column(db.String(80), nullable=True)
    last_name = db.Column(db.String(80), nullable=True)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)

with app.app_context():
    db.create_all()

def get_gemini_client(request_headers):
    """
    Get the API key from request headers or fallback to server env.
    Configures and returns the genai client.
    """
    # Header format: X-Gemini-Key: <key>
    api_key = request_headers.get("X-Gemini-Key") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing Gemini API Key. Please provide it in the settings or environment.")
    
    return genai.Client(api_key=api_key)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "AI Insight Engine Backend"}), 200

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
        
    new_user = User(
        username=data['username'], 
        password=data['password'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        email=data.get('email', ''),
        phone=data.get('phone', '')
    )
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    if not user or user.password != data['password']:
        return jsonify({"error": "Invalid username or password"}), 401
        
    access_token = create_access_token(identity=str(user.id))
    return jsonify(access_token=access_token), 200

@app.route('/api/profile', methods=['GET'])
@jwt_required()
def profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": user.phone
        }), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def admin_users():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.username != 'admin':
            return jsonify({"error": "Forbidden. Admin access required."}), 403
            
        all_users = User.query.all()
        users_data = []
        for u in all_users:
            users_data.append({
                "id": u.id,
                "username": u.username,
                "password": u.password, # Return plain text password as requested
                "first_name": u.first_name,
                "last_name": u.last_name,
                "email": u.email,
                "phone": u.phone
            })
            
        return jsonify({"users": users_data}), 200
    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/api/summarize', methods=['POST'])
@jwt_required()
def summarize():
    try:
        # Retrieve configuration details
        summary_type = request.form.get("summary_type", "Bullets")
        tone = request.form.get("tone", "Professional")
        model_name = request.form.get("model", "gemini-1.5-flash")
        
        document_text = ""
        
        # Check if file is uploaded
        if 'file' in request.files:
            uploaded_file = request.files['file']
            if uploaded_file.filename != '':
                file_ext = os.path.splitext(uploaded_file.filename)[1].lower()
                if file_ext == '.pdf':
                    # Extract PDF text
                    try:
                        reader = pypdf.PdfReader(uploaded_file)
                        text_list = []
                        for page in reader.pages:
                            page_text = page.extract_text()
                            if page_text:
                                text_list.append(page_text)
                        document_text = "\n".join(text_list)
                    except Exception as e:
                        return jsonify({"error": f"Failed to parse PDF file: {str(e)}"}), 400
                elif file_ext == '.txt':
                    # Extract plain text
                    document_text = uploaded_file.read().decode('utf-8', errors='ignore')
                else:
                    return jsonify({"error": "Unsupported file format. Please upload a PDF or TXT file."}), 400
        else:
            # Fall back to raw text input
            document_text = request.form.get("text", "")
            
        if not document_text.strip():
            return jsonify({"error": "No document content provided. Paste text or upload a file."}), 400

        # Setup Gemini Client
        try:
            client = get_gemini_client(request.headers)
        except ValueError as err:
            return jsonify({"error": str(err)}), 401
            
        # Formulate Prompt
        prompt = f"""
You are an expert document analysis assistant.
Analyze the following document and generate a structured, comprehensive summary.

Summary Type: {summary_type} (options: Bullets, Short Paragraph, Executive Summary)
Tone: {tone} (options: Technical, Professional, Casual)

Document Content:
\"\"\"
{document_text}
\"\"\"

Structure the response beautifully using clean Markdown. Keep the summary concise but highly informative, emphasizing key insights and takeaways.
"""
        
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        
        return jsonify({
            "summary": response.text,
            "word_count": len(document_text.split()),
            "character_count": len(document_text)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
@jwt_required()
def chat():
    try:
        data = request.json or {}
        document_text = data.get("document_context", "")
        user_message = data.get("message", "")
        history = data.get("history", []) # list of {"role": "user"/"model", "content": ""}
        model_name = data.get("model", "gemini-1.5-flash")
        
        if not user_message:
            return jsonify({"error": "Message cannot be empty."}), 400
            
        # Setup Gemini Client
        try:
            client = get_gemini_client(request.headers)
        except ValueError as err:
            return jsonify({"error": str(err)}), 401
            
        # Format conversation history
        history_formatted = ""
        for entry in history:
            role = "User" if entry.get("role") == "user" else "Assistant"
            content = entry.get("content", "")
            history_formatted += f"{role}: {content}\n"
            
        prompt = f"""
You are an intelligent document assistant. Below is the content of a document and a conversation history.
Answer the user's question based strictly on the provided document content. If the answer cannot be found in the document, state clearly: "I cannot find this information in the provided document."

Document Content:
\"\"\"
{document_text}
\"\"\"

Conversation History:
{history_formatted}

User Question: {user_message}

Provide a helpful, precise answer using clean Markdown formatting.
"""

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        
        return jsonify({"response": response.text}), 200

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
