import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Cpu, 
  Terminal, 
  Sparkles, 
  Upload, 
  Settings,
  Copy, 
  Check, 
  RefreshCw, 
  Send, 
  Bot, 
  User, 
  AlertCircle, 
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { useNavigate } from 'react-router-dom';

export default function Dashboard({ setIsLoggedIn }) {
  const navigate = useNavigate();
  // Form states
  const [textInput, setTextInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summaryType, setSummaryType] = useState('Bullets');
  const [tone, setTone] = useState('Professional');
  const [model, setModel] = useState('gemini-2.5-flash');

  // App UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryResult, setSummaryResult] = useState('');
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'chat'

  // Chat states
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Profile states
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Admin states
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminUsersList, setAdminUsersList] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);

  // File drag states
  const [isDragActive, setIsDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isChatLoading]);

  // Silent profile fetch on load
  useEffect(() => {
    const fetchInitialProfile = async () => {
      try {
        const token = localStorage.getItem('AUTH_SESSION');
        if (!token) return;
        const response = await fetch('http://127.0.0.1:5000/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) {
          setProfileData(data);
        }
      } catch (err) {
        console.error("Silent profile fetch failed", err);
      }
    };
    fetchInitialProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('AUTH_SESSION');
    setIsLoggedIn(false);
    navigate('/');
  };

  const handleProfileClick = async () => {
    setShowProfile(true);
    setProfileLoading(true);
    try {
      const token = localStorage.getItem('AUTH_SESSION');
      const response = await fetch('http://127.0.0.1:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProfileData(data);
    } catch (err) {
      setError('Failed to load profile data.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleAdminClick = async () => {
    setShowAdminPanel(true);
    setAdminLoading(true);
    try {
      const token = localStorage.getItem('AUTH_SESSION');
      const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setAdminUsersList(data.users);
    } catch (err) {
      setError('Failed to load admin users.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'pdf' && ext !== 'txt') {
      setError('Unsupported file type. Please upload a PDF or TXT file.');
      return;
    }
    if (file.size > 16 * 1024 * 1024) {
      setError('File is too large. Max size is 16MB.');
      return;
    }
    setUploadedFile(file);
    setTextInput(''); // Clear text input if file is chosen
    setError('');
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Summarize call
  const generateSummary = async () => {
    setError('');
    setSummaryResult('');
    setStats(null);
    setChatHistory([]); // Clear chat since context changes
    
    if (!textInput.trim() && !uploadedFile) {
      setError('Please provide text input or upload a document.');
      return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append('summary_type', summaryType);
    formData.append('tone', tone);
    formData.append('model', model);

    if (uploadedFile) {
      formData.append('file', uploadedFile);
    } else {
      formData.append('text', textInput);
    }

    try {
      const token = localStorage.getItem('AUTH_SESSION');
      const response = await fetch('http://127.0.0.1:5000/api/summarize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary.');
      }

      setSummaryResult(data.summary);
      setStats({
        wordCount: data.word_count,
        charCount: data.character_count,
        timestamp: new Date().toLocaleTimeString()
      });

      // Fire premium confetti effect!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00FF41', '#FFFFFF', '#121212']
      });

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chat call
  const sendChatMessage = async (e) => {
    e.preventDefault();
    const msg = chatMessage.trim();
    if (!msg) return;

    if (!summaryResult) {
      setError('Please generate a summary first to create a document context.');
      return;
    }

    // Add user message to history
    const userEntry = { role: 'user', content: msg };
    setChatHistory(prev => [...prev, userEntry]);
    setChatMessage('');
    setIsChatLoading(true);

    // Context is the parsed text or the summary. To keep prompt size reasonable,
    // we can send the summary + the text if it's small, or just prompt the backend.
    // The backend uses pypdf, so we pass the context.
    let docContext = textInput;
    if (uploadedFile) {
      // In a production app, the backend caches text or we pass it back.
      // Since our Flask backend is local and processes the context, we will send the summary
      // as document context for simplicity, or the pasted text. 
      // To ensure chat is accurate, we will send the summary text as document_context
      // so it serves as the knowledge base.
      docContext = `Here is the summary of the document to chat about:\n${summaryResult}`;
    }

    try {
      const token = localStorage.getItem('AUTH_SESSION');
      const response = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          document_context: docContext,
          message: msg,
          history: chatHistory,
          model: model
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get chat response.');
      }

      setChatHistory(prev => [...prev, { role: 'model', content: data.response }]);

    } catch (err) {
      setError(err.message || 'Failed to communicate with chat engine.');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Clipboard copy helper
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)' }}>
      {/* Top Accent Line */}
      <div style={{ height: '4px', backgroundColor: 'var(--accent-color)', width: '100%' }}></div>

      {/* Main Container */}
      <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem', flexGrow: 1 }}>
        
        {/* Header */}
        <header className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-color)', letterSpacing: '0.1em' }}>// CORE_MODULE_INTELLIGENCE</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
              AI INSIGHT ENGINE
            </h1>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)', padding: '0.4rem 0.8rem', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}>
              <span className="pulse-dot"></span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '600' }}>SYS_ACTIVE</span>
            </div>
            
            {profileData?.username === 'admin' && (
              <button 
                onClick={handleAdminClick}
                style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'rgba(255, 95, 86, 0.2)', border: '1px solid #ff5f56', color: '#ff5f56', borderRadius: '8px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                title="Admin Panel"
              >
                <Settings size={14} />
                <span style={{ fontSize: '0.7rem' }}>ADMIN PANEL</span>
              </button>
            )}

            <button 
              onClick={handleProfileClick}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              title="User Profile"
            >
              <User size={14} />
              <span style={{ fontSize: '0.7rem' }}>PROFILE</span>
            </button>
            <button 
              onClick={handleLogout}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
              title="End Session"
            >
              <LogOut size={14} />
              <span style={{ fontSize: '0.7rem' }}>LOGOUT</span>
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div style={{ backgroundColor: 'rgba(255, 95, 86, 0.1)', border: '1px solid #ff5f56', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ff5f56', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Workspace Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start', flexGrow: 1 }}>
          
          {/* Left Column - Inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Input Module */}
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '600' }}>// INPUT_MANIFEST</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>TXT_OR_PDF</span>
              </div>

              {/* Upload Dropzone */}
              {!uploadedFile && (
                <div 
                  onDragEnter={handleDrag} 
                  onDragOver={handleDrag} 
                  onDragLeave={handleDrag} 
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ 
                    border: isDragActive ? '1px dashed var(--accent-color)' : '1px dashed var(--border-color)', 
                    backgroundColor: isDragActive ? 'var(--accent-color-dim)' : 'var(--bg-primary)',
                    padding: '2.5rem 1.5rem', 
                    textAlign: 'center', 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '1rem'
                  }}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept=".pdf,.txt" 
                    style={{ display: 'none' }} 
                  />
                  <Upload size={32} style={{ color: isDragActive ? 'var(--accent-color)' : 'var(--text-muted)', margin: '0 auto 1rem' }} />
                  <p style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                    DRAG & DROP DOCUMENT HERE
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Supports PDF or TXT up to 16MB
                  </p>
                </div>
              )}

              {/* Uploaded File Info */}
              {uploadedFile && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)', padding: '1rem', backgroundColor: 'var(--bg-primary)', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <FileText size={24} className="text-accent" />
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                        {uploadedFile.name}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={clearFile} 
                    style={{ background: 'none', border: 'none', color: 'var(--text-dark)', cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#ff5f56'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-dark)'}
                    title="Remove file"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Plain Text Input */}
              {!uploadedFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>OR PASTE TEXT_CONTENT:</span>
                    {textInput && (
                      <button 
                        onClick={() => setTextInput('')}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dark)', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        [CLEAR]
                      </button>
                    )}
                  </div>
                  <textarea 
                    placeholder="Enter document raw string text here for AI synthesis..."
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '180px', 
                      backgroundColor: 'var(--bg-primary)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-primary)', 
                      padding: '0.8rem 1rem', 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '0.8rem', 
                      outline: 'none', 
                      resize: 'vertical'
                    }}
                    className="glow-border"
                  />
                </div>
              )}
            </section>

            {/* Parameters Settings */}
            <section className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: '600' }}>// CONFIG_SPECIFICATION</span>
                <Settings size={14} style={{ color: 'var(--text-muted)' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Summary Type */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>SUMMARY_FORMAT:</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Bullets', 'Short Paragraph', 'Executive Summary'].map(type => (
                      <button
                        key={type}
                        onClick={() => setSummaryType(type)}
                        style={{
                          flexGrow: 1,
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'none',
                          border: summaryType === type ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                          color: summaryType === type ? 'var(--accent-color)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tone */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>EXPRESSION_TONE:</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['Professional', 'Technical', 'Casual'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        style={{
                          flexGrow: 1,
                          padding: '0.5rem',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'none',
                          border: tone === t ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                          color: tone === t ? 'var(--accent-color)' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                      >
                        {t.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Model */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>GENAI_CORE_MODEL:</label>
                  <select 
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '0.5rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="gemini-2.5-flash">GEMINI_2.5_FLASH (Fast, Default)</option>
                    <option value="gemini-2.5-pro">GEMINI_2.5_PRO (Complex Reasoning)</option>
                    <option value="gemini-2.0-flash">GEMINI_2.0_FLASH (Speed Optimized)</option>
                    <option value="gemini-3.5-flash">GEMINI_3.5_FLASH (Latest Model)</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={generateSummary}
                disabled={isLoading || (!textInput.trim() && !uploadedFile)}
                style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
                className="btn-primary"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 2s linear infinite' }} />
                    SYNTHESIZING_DOCUMENT...
                  </>
                ) : (
                  <>
                    <Cpu size={16} />
                    EXECUTE_AI_ANALYSIS
                  </>
                )}
              </button>
            </section>
          </div>

          {/* Right Column - Outputs & Chat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
            
            {/* Terminal Tab Container */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
              
              {/* Terminal Header Tabs */}
              <div style={{ display: 'flex', backgroundColor: 'var(--surface-opaque)', borderBottom: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => setActiveTab('summary')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRight: '1px solid var(--border-color)',
                    color: activeTab === 'summary' ? 'var(--accent-color)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'summary' ? '600' : '400',
                    backgroundColor: activeTab === 'summary' ? 'rgba(10, 10, 10, 0.4)' : 'transparent'
                  }}
                >
                  [SUMMARY_LOG.txt]
                </button>
                <button 
                  onClick={() => setActiveTab('chat')}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderRight: '1px solid var(--border-color)',
                    color: activeTab === 'chat' ? 'var(--accent-color)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    padding: '0.75rem 1.25rem',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'chat' ? '600' : '400',
                    backgroundColor: activeTab === 'chat' ? 'rgba(10, 10, 10, 0.4)' : 'transparent'
                  }}
                >
                  [INTERACTIVE_CHAT.sh]
                </button>
              </div>

              {/* Terminal Body */}
              <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(10, 10, 10, 0.95)' }}>
                
                {/* Summary Tab */}
                {activeTab === 'summary' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                    {/* Header Details */}
                    {stats && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-dark)' }}>
                        <span>WORDS: {stats.wordCount} | CHARS: {stats.charCount}</span>
                        <span>COMPILATION_TIME: {stats.timestamp}</span>
                      </div>
                    )}

                    {summaryResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                        {/* Summary Output Area */}
                        <div style={{ 
                          whiteSpace: 'pre-wrap', 
                          fontFamily: 'var(--font-mono)', 
                          fontSize: '0.8rem', 
                          color: 'var(--text-primary)', 
                          lineHeight: '1.6', 
                          flexGrow: 1, 
                          maxHeight: '350px', 
                          overflowY: 'auto', 
                          paddingRight: '0.5rem' 
                        }}>
                          {summaryResult}
                        </div>
                        
                        {/* Copy / Action buttons */}
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={copyToClipboard}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            className="btn-secondary"
                          >
                            {copied ? (
                              <>
                                <Check size={14} className="text-accent" />
                                [COPIED_TO_CLIPBOARD]
                              </>
                            ) : (
                              <>
                                <Copy size={14} />
                                [COPY_MANIFEST]
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-dark)', fontFamily: 'var(--font-mono)', gap: '1rem', padding: '3rem 0' }}>
                        <Terminal size={36} />
                        <p style={{ fontSize: '0.8rem' }}>[AWAITING_INPUT_MANIFEST_EXECUTION]</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textAlign: 'center', maxWidth: '300px' }}>
                          Upload a file or paste text content on the left and run analysis to compile summary specs.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat Tab */}
                {activeTab === 'chat' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flexGrow: 1 }}>
                    {!summaryResult ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-dark)', fontFamily: 'var(--font-mono)', gap: '1rem', padding: '3rem 0' }}>
                        <Bot size={36} />
                        <p style={{ fontSize: '0.8rem' }}>[CONTEXT_AWAITING_DOCUMENT_UPLOAD]</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dark)', textAlign: 'center', maxWidth: '300px' }}>
                          You must execute document analysis first to load context into the chat engine memory buffer.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', height: '400px', justifyContent: 'space-between', flexGrow: 1 }}>
                        
                        {/* Conversation List */}
                        <div style={{ 
                          flexGrow: 1, 
                          overflowY: 'auto', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '1rem', 
                          paddingRight: '0.5rem',
                          maxHeight: '320px',
                          marginBottom: '1rem'
                        }}>
                          {/* Welcome bot msg */}
                          <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                            <Bot size={16} className="text-accent" style={{ marginTop: '0.2rem' }} />
                            <div>
                              <span style={{ color: 'var(--accent-color)' }}>[SYSTEM_BOT]</span>
                              <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                Context loaded. I can answer questions about the generated summary and context text. Ask anything!
                              </p>
                            </div>
                          </div>

                          {chatHistory.map((chat, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                              {chat.role === 'user' ? (
                                <>
                                  <User size={16} style={{ color: 'var(--text-primary)', marginTop: '0.2rem' }} />
                                  <div>
                                    <span style={{ color: 'var(--text-primary)' }}>[USER]</span>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                      {chat.content}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Bot size={16} className="text-accent" style={{ marginTop: '0.2rem' }} />
                                  <div>
                                    <span style={{ color: 'var(--accent-color)' }}>[SYSTEM_BOT]</span>
                                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                      {chat.content}
                                    </p>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}

                          {isChatLoading && (
                            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                              <Bot size={16} className="text-accent" style={{ marginTop: '0.2rem' }} />
                              <div>
                                <span style={{ color: 'var(--accent-color)' }}>[SYSTEM_BOT]</span>
                                <p style={{ color: 'var(--text-dark)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <RefreshCw className="animate-spin" size={12} style={{ animation: 'spin 2s linear infinite' }} />
                                  RETRIEVING_INFERENCE...
                                </p>
                              </div>
                            </div>
                          )}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Message Input Box */}
                        <form onSubmit={sendChatMessage} style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <input 
                            type="text" 
                            placeholder="Type queries regarding document content..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            disabled={isChatLoading}
                            style={{ 
                              flexGrow: 1, 
                              backgroundColor: 'var(--bg-primary)', 
                              border: '1px solid var(--border-color)', 
                              color: 'var(--text-primary)', 
                              padding: '0.6rem 1rem', 
                              fontFamily: 'var(--font-mono)', 
                              fontSize: '0.8rem', 
                              outline: 'none' 
                            }}
                            className="glow-border"
                          />
                          <button 
                            type="submit" 
                            disabled={isChatLoading || !chatMessage.trim()}
                            className="btn-primary"
                            style={{ padding: '0.6rem 1.2rem' }}
                          >
                            <Send size={14} />
                          </button>
                        </form>

                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
            
          </div>

        </div>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-dark)' }}>
          <span>AI_INSIGHT_ENGINE_v1.0.0</span>
          <a 
            href="http://localhost:5173" 
            style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
            onMouseEnter={e => e.target.style.color = 'var(--accent-color)'}
            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
          >
            BACK_TO_PORTFOLIO <ExternalLink size={12} />
          </a>
        </footer>

      </div>
      
      {/* Profile Modal */}
      {showProfile && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button 
              onClick={() => setShowProfile(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            >
              [CLOSE]
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ backgroundColor: 'var(--surface-opaque)', padding: '1rem', borderRadius: '50%', border: '1px solid var(--accent-color)' }}>
                <User size={32} className="text-accent" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>USER_PROFILE</h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>ID: {profileData?.username || 'UNKNOWN'}</span>
              </div>
            </div>

            {profileLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem', display: 'block' }} />
                Loading details...
              </div>
            ) : profileData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>FIRST_NAME:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{profileData.first_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>LAST_NAME:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{profileData.last_name || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>EMAIL_ADDR:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{profileData.email || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>PHONE_NUM:</span>
                  <span style={{ color: 'var(--text-primary)' }}>{profileData.phone || 'N/A'}</span>
                </div>
              </div>
            ) : (
              <div style={{ color: '#ff5f56', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>Failed to load profile.</div>
            )}
          </div>
        </div>
      )}

      {/* Admin Modal */}
      {showAdminPanel && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '900px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
            <button 
              onClick={() => setShowAdminPanel(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
            >
              [CLOSE]
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ backgroundColor: 'rgba(255, 95, 86, 0.1)', padding: '1rem', borderRadius: '50%', border: '1px solid #ff5f56' }}>
                <Settings size={32} color="#ff5f56" />
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', color: '#ff5f56', margin: 0 }}>SYSTEM_ADMIN_OVERRIDE</h2>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Accessing secure user manifest</span>
              </div>
            </div>

            {adminLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 1rem', display: 'block' }} />
                Decrypting user databanks...
              </div>
            ) : (
              <div style={{ overflowX: 'auto', overflowY: 'auto', flexGrow: 1, maxHeight: '60vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--accent-color)', color: 'var(--accent-color)' }}>
                      <th style={{ padding: '0.75rem' }}>ID</th>
                      <th style={{ padding: '0.75rem' }}>USERNAME</th>
                      <th style={{ padding: '0.75rem' }}>PASSWORD</th>
                      <th style={{ padding: '0.75rem' }}>NAME</th>
                      <th style={{ padding: '0.75rem' }}>EMAIL</th>
                      <th style={{ padding: '0.75rem' }}>PHONE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        <td style={{ padding: '0.75rem' }}>{u.id}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>{u.username}</td>
                        <td style={{ padding: '0.75rem', color: '#ff5f56' }}>{u.password}</td>
                        <td style={{ padding: '0.75rem' }}>{u.first_name || '-'} {u.last_name || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{u.email || '-'}</td>
                        <td style={{ padding: '0.75rem' }}>{u.phone || '-'}</td>
                      </tr>
                    ))}
                    {adminUsersList.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Keyframe Spin in JS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
