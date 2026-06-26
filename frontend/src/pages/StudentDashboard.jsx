import React, { useState, useEffect } from 'react';
import { GraduationCap, Map, MessageSquareQuote, Activity, Zap, PlayCircle, Star, Code2, Loader2, Save, ExternalLink } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/StatCard';
import AIChatWidget from '../components/AIChatWidget';
import axios from 'axios';

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [assessmentHistory, setAssessmentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);



  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await axios.get('/student/assessment/history');
      setAssessmentHistory(data.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const tabStyle = (tab) => ({
    width: 'auto',
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--text-muted)',
    border: 'none',
    padding: '8px 16px',
    fontSize: '0.85rem',
  });



  const getTopicProgressData = () => {
    if (!assessmentHistory || assessmentHistory.length === 0) return [];
    const topicMap = {};
    assessmentHistory.forEach(a => {
      const topicName = a.topic || 'Unknown';
      if (!topicMap[topicName]) topicMap[topicName] = { total: 0, count: 0 };
      topicMap[topicName].total += (a.aiScore || 0);
      topicMap[topicName].count += 1;
    });
    return Object.keys(topicMap).map(topic => ({
      name: topic,
      score: Math.round(topicMap[topic].total / topicMap[topic].count)
    })).sort((a, b) => b.score - a.score);
  };
  const topicData = getTopicProgressData();

  return (
    <div className="dashboard-container animate-fade-in" style={{ paddingBottom: '100px' }}>
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <GraduationCap size={32} color="var(--primary)" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Student Portal</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>Welcome back, {user?.name}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="role-badge" style={{ background: 'rgba(52, 211, 153, 0.2)', color: '#34d399' }}>Student</span>
          <button onClick={() => { logout(); navigate('/'); }} className="glass-button" style={{ padding: '8px 16px', width: 'auto' }}>Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button className="glass-button" style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className="glass-button" style={tabStyle('history')} onClick={() => setActiveTab('history')}>Assessment History</button>
        <button className="glass-button" style={tabStyle('roadmap')} onClick={() => setActiveTab('roadmap')}>Roadmap</button>
        <button className="glass-button" style={tabStyle('feedback')} onClick={() => setActiveTab('feedback')}>Feedback</button>
      </div>

      {activeTab === 'overview' && (
        <div className="delay-100">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <StatCard title="Overall Score" value={`${user?.score || 0}%`} progress={user?.score || 0} icon={<Activity size={24} />} color="#34d399" />
            <StatCard title="Performance Status" value={user?.performance || "Pending"} icon={<Star size={24} />} color="#fbbf24" />
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', textAlign: 'center' }}>
              <button onClick={() => navigate('/assessment')} className="glass-button" style={{ background: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem', width: 'auto' }}>
                <PlayCircle /> Take Assessment
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Zap size={20} /> My Strengths</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {user?.strengths?.map((str, i) => <li key={i}>{str}</li>)}
                {(!user?.strengths || user?.strengths.length === 0) && <li style={{ color: 'var(--text-muted)' }}>Complete an assessment to see analysis.</li>}
              </ul>
            </div>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Map size={20} /> Areas to Improve</h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-main)', lineHeight: '1.8' }}>
                {user?.weaknesses?.map((wk, i) => <li key={i}>{wk}</li>)}
                {(!user?.weaknesses || user?.weaknesses.length === 0) && <li style={{ color: 'var(--text-muted)' }}>Complete an assessment to see analysis.</li>}
              </ul>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} /> Topic-wise Performance
            </h3>
            {topicData.length > 0 ? (
              <div style={{ width: '100%', height: Math.max(250, topicData.length * 50) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicData} layout="vertical" margin={{ top: 5, right: 50, left: 60, bottom: 5 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#d4d4d4', fontSize: 13 }} width={120} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ background: '#1e1e1e', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#818cf8' }} />
                    <Bar dataKey="score" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} label={{ position: 'right', fill: '#d4d4d4', formatter: (val) => `${val}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>Complete assessments to see your topic-wise progress.</p>
            )}
          </div>
        </div>
      )}



      {activeTab === 'history' && (
        <div className="delay-100">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Assessment History</h2>
          {historyLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
          {!historyLoading && assessmentHistory.length === 0 && (
            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No assessments taken yet. Click "Take Assessment" to start!
            </div>
          )}
          {!historyLoading && assessmentHistory.map((a, i) => (
            <div key={i} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderLeft: `4px solid ${a.aiScore >= 75 ? '#34d399' : a.aiScore >= 50 ? '#fbbf24' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem' }}>{a.title || a.topic}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {a.topic} • {a.difficulty} • {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: a.aiScore >= 75 ? '#34d399' : a.aiScore >= 50 ? '#fbbf24' : '#ef4444' }}>
                    {a.aiScore || 0}/100
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{a.status}</div>
                </div>
              </div>
              {a.feedbackData && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a.feedbackData.explanation}</p>
                  {a.feedbackData.motivationalNote && (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#818cf8', fontStyle: 'italic' }}>"{a.feedbackData.motivationalNote}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="glass-panel delay-100" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Current Learning Path</h2>
          {Array.isArray(user?.roadmap) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {user.roadmap.map((step, idx) => (
                <div key={idx} style={{ padding: '1.5rem', background: 'rgba(52, 211, 153, 0.05)', borderLeft: '4px solid #34d399', borderRadius: '4px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#34d399' }}>Week {step.week}: {step.topic}</h4>
                  <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: '1.6' }}>{step.focus}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.5rem', background: 'rgba(52, 211, 153, 0.1)', borderLeft: '4px solid #34d399', borderRadius: '4px' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#34d399' }}>Active Phase</h4>
              <p style={{ margin: 0 }}>{user?.roadmap || 'Complete an assessment to unlock your roadmap.'}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="glass-panel delay-100" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><MessageSquareQuote size={24} color="#818cf8" /> AI Feedback</h2>
          <p style={{ lineHeight: '1.6', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
            "{user?.feedback || 'Awaiting first assessment review.'}"
          </p>
        </div>
      )}

      <AIChatWidget />
    </div>
  );
}

function DifficultyBar({ label, solved, total, color }) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
        <span style={{ color }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{solved}/{total}</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
