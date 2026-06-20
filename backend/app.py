import os
# pyrefly: ignore [missing-import]
import pypdf
from flask import Flask, request, jsonify
from flask_cors import CORS
# pyrefly: ignore [missing-import]
import google.generativeai as genai
from dotenv import load_dotenv

# Load server environment variables if present
load_dotenv()

app = Flask(__name__)
# Enable CORS for frontend local development
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Limit file size to 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

def get_gemini_client(request_headers):
    """
    Get the API key from request headers or fallback to server env.
    Configures and returns the genai client.
    """
    # Header format: X-Gemini-Key: <key>
    api_key = request_headers.get("X-Gemini-Key") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("Missing Gemini API Key. Please provide it in the settings or environment.")
    
    genai.configure(api_key=api_key)
    return genai

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "service": "AI Insight Engine Backend"}), 200

@app.route('/api/summarize', methods=['POST'])
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
        
        model = client.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        
        return jsonify({
            "summary": response.text,
            "word_count": len(document_text.split()),
            "character_count": len(document_text)
        }), 200

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
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

        model = client.GenerativeModel(model_name)
        response = model.generate_content(prompt)
        
        return jsonify({"response": response.text}), 200

    except Exception as e:
        return jsonify({"error": f"Internal Server Error: {str(e)}"}), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
