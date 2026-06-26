import React, { useState, useEffect, useRef } from 'react';
import { Maximize, ShieldAlert, CheckCircle, Clock, Loader2, ArrowLeft, Code2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';

export default function Assessment() {
  const [phase, setPhase] = useState('setup');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [solution, setSolution] = useState('');
  const [question, setQuestion] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const topics = [
    "Arrays", "Strings", "Linked Lists", "Stacks", "Queues",
    "Trees", "Graphs", "Hash Tables", "Dynamic Programming",
    "Sorting Algorithms", "Two Pointers", "Sliding Window",
    "Recursion", "Backtracking", "Greedy Algorithms"
  ];

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullScreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  useEffect(() => {
    if (phase === 'exam' && isFullScreen) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isFullScreen]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const generateQuestion = async () => {
    setGenerating(true);
    setError('');
    try {
      const { data } = await axios.post('/student/assessment/generate', {
        topic: selectedTopic || null,
        difficulty: selectedDifficulty,
      });
      setQuestion(data.question);
      setAssessmentId(data.assessmentId);
      
      let boilerplate = `function solve(input) {\n  // Write your code here\n  \n}\n\n// --- Test Cases ---\n`;
      if (data.question.examples) {
        data.question.examples.forEach((ex, i) => {
          boilerplate += `// Test ${i + 1} (Expected Output: ${typeof ex.output === 'object' ? JSON.stringify(ex.output) : ex.output})\n`;
          boilerplate += `// console.log(solve(${typeof ex.input === 'object' ? JSON.stringify(ex.input) : ex.input}));\n\n`;
        });
      }
      setSolution(boilerplate);
      
      setPhase('exam');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate question. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const requestFullScreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);

    try {
      const { data } = await axios.post(`/student/assessment/submit/${assessmentId}`, { solution, language: selectedLanguage });
      setReviewResult(data.review);
      setFeedbackResult(data.feedback);
      setPhase('results');

      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
      setSubmitting(false);
    }
  };

  const preventCheating = (e) => e.preventDefault();

  if (phase === 'setup') {
    return (
      <div className="dashboard-container animate-fade-in" style={{ maxWidth: '700px' }}>
        <button onClick={() => navigate('/student')} className="glass-button" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-glass)', color: 'var(--text-muted)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '8px 16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        <div className="glass-panel" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Code2 size={48} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.75rem' }}>AI-Powered DSA Assessment</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>An AI will generate a unique coding problem for you. Solve it within the time limit.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Topic (optional — leave empty for random)</label>
              <select className="glass-input" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)} style={{ appearance: 'none' }}>
                <option value="" style={{ color: '#000' }}>Random Topic</option>
                {topics.map(t => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Difficulty</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {['easy', 'medium', 'hard'].map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className="glass-button"
                    style={{
                      flex: 1,
                      background: selectedDifficulty === d ? (d === 'easy' ? '#34d399' : d === 'medium' ? '#fbbf24' : '#ef4444') : 'transparent',
                      color: selectedDifficulty === d ? '#000' : 'var(--text-muted)',
                      border: '1px solid var(--border-glass)',
                      textTransform: 'capitalize',
                      fontWeight: selectedDifficulty === d ? 700 : 400,
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--error)', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem' }}>{error}</div>}

            <button onClick={generateQuestion} className="glass-button" disabled={generating} style={{ marginTop: '1rem', fontSize: '1rem', padding: '16px' }}>
              {generating ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> AI is generating your question...
                </span>
              ) : 'Start Assessment'}
            </button>
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#fbbf24' }}>
              ⚠️ Full-screen mode is required. Copy/paste is disabled. You have 45 minutes to complete.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    return (
      <div className="dashboard-container animate-fade-in" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <CheckCircle size={64} color="#34d399" style={{ marginBottom: '1rem' }} />
          <h1 style={{ margin: '0 0 0.5rem' }}>Assessment Complete!</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here's your AI-powered analysis</p>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: reviewResult?.score >= 75 ? '#34d399' : reviewResult?.score >= 50 ? '#fbbf24' : '#ef4444' }}>
            {reviewResult?.score || 0}/100
          </div>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>Rating: {reviewResult?.rating || 'N/A'}</div>
        </div>

        {reviewResult && (
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: 'var(--primary)' }}>Code Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <ReviewSection title="Correctness" content={reviewResult.correctnessAnalysis} />
              <ReviewSection title="Time Complexity" content={`${reviewResult.timeComplexity} — ${reviewResult.timeComplexityAnalysis}`} />
              <ReviewSection title="Space Complexity" content={`${reviewResult.spaceComplexity} — ${reviewResult.spaceComplexityAnalysis}`} />
              <ReviewSection title="Code Quality" content={reviewResult.codeQualityNotes} />
              {reviewResult.suggestedApproach && <ReviewSection title="Suggested Approach" content={reviewResult.suggestedApproach} />}
            </div>
          </div>
        )}

        {feedbackResult && (
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', color: '#34d399' }}>Personalized Feedback</h3>
            <p style={{ margin: '0 0 1rem', lineHeight: '1.6' }}>{feedbackResult.summary}</p>

            {feedbackResult.strengths?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#34d399' }}>Strengths</h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                  {feedbackResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}

            {feedbackResult.weaknesses?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#ef4444' }}>Areas to Improve</h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.6' }}>
                  {feedbackResult.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            )}

            {feedbackResult.motivationalNote && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--primary)' }}>
                <p style={{ margin: 0, fontStyle: 'italic', color: '#a5b4fc' }}>"{feedbackResult.motivationalNote}"</p>
              </div>
            )}
          </div>
        )}

        <button onClick={() => navigate('/student')} className="glass-button" style={{ fontSize: '1rem', padding: '16px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: 'var(--bg-dark)', color: 'var(--text-main)', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {!isFullScreen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 17, 21, 0.95)', backdropFilter: 'blur(20px)', zIndex: 1000, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem' }}>
          <ShieldAlert size={64} color="#ef4444" style={{ marginBottom: '2rem' }} />
          <h1 style={{ margin: '0 0 1rem 0' }}>Full Screen Required</h1>
          <p style={{ maxWidth: '500px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '2rem' }}>
            This is a secure assessment environment. You must attend in full-screen mode.
          </p>
          <button onClick={requestFullScreen} className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto', padding: '16px 32px' }}>
            <Maximize /> Enter Full Screen
          </button>
        </div>
      )}

      <header style={{ padding: '1rem 2rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{question?.title || 'Assessment'}</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{question?.topic} • {question?.difficulty}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 300 ? '#ef4444' : '#fbbf24' }}>
            <Clock size={20} /> <span style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}>{formatTime(timeLeft)}</span>
          </div>
          <button onClick={handleSubmit} className="glass-button" disabled={submitting} style={{ background: '#34d399', width: 'auto', padding: '8px 24px' }}>
            {submitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Submit'}
          </button>
        </div>
      </header>

      {error && <div style={{ padding: '0.75rem 2rem', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', borderRight: '1px solid var(--border-glass)' }}>
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', borderRadius: '8px' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary)' }}>Problem</h3>
            <p style={{ lineHeight: '1.8', margin: 0, whiteSpace: 'pre-wrap' }}>{question?.problemStatement}</p>
          </div>

          {question?.examples && (
            <div className="glass-panel" style={{ padding: '2rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#818cf8' }}>Examples</h4>
              {question.examples.map((ex, i) => (
                <div key={i} style={{ background: '#000', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', color: '#a5b4fc', marginBottom: '1rem' }}>
                  <div><strong>Input:</strong> {typeof ex.input === 'object' ? JSON.stringify(ex.input) : String(ex.input)}</div>
                  <div><strong>Output:</strong> {typeof ex.output === 'object' ? JSON.stringify(ex.output) : String(ex.output)}</div>
                  {ex.explanation && <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><strong>Explanation:</strong> {typeof ex.explanation === 'object' ? JSON.stringify(ex.explanation) : String(ex.explanation)}</div>}
                </div>
              ))}
            </div>
          )}

          {question?.constraints && (
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h4 style={{ margin: '0 0 0.75rem', color: '#fbbf24', fontSize: '0.9rem' }}>Constraints</h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {question.constraints.map((c, i) => <li key={i}>{typeof c === 'object' ? JSON.stringify(c) : String(c)}</li>)}
              </ul>
            </div>
          )}

          {question?.hints && (
            <div style={{ padding: '1rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#818cf8' }}>Hints</h4>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {question.hints.map((h, i) => <li key={i}>{typeof h === 'object' ? JSON.stringify(h) : String(h)}</li>)}
              </ul>
            </div>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#2d2d2d', borderBottom: '1px solid #404040', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{ background: '#1e1e1e', color: '#ccc', border: '1px solid #404040', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', outline: 'none' }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
              <span style={{ color: '#ccc', fontSize: '0.875rem', fontWeight: 'bold' }}>
                solution.{selectedLanguage === 'python' ? 'py' : selectedLanguage === 'java' ? 'java' : selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage === 'c' ? 'c' : 'js'}
              </span>
            </div>
            <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>NO COPY/PASTE</span>
          </div>
          <div style={{ flex: 1, padding: '0.5rem', overflow: 'hidden' }}>
            <Editor
              height="100%"
              width="100%"
              theme="vs-dark"
              language={selectedLanguage}
              value={solution}
              onChange={(value) => setSolution(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: '"Fira Code", "Consolas", monospace',
                wordWrap: 'on',
                contextmenu: false,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, content }) {
  return (
    <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
      <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#818cf8' }}>{title}</h4>
      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{content}</p>
    </div>
  );
}
