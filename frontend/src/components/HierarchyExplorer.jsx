import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, User, Users, Layers, GraduationCap, BarChart3, Loader2 } from 'lucide-react';
import axios from 'axios';

const roleColors = {
  dean: '#818cf8',
  hod: '#34d399',
  mentor: '#fbbf24',
  student: '#f43f5e',
};

const roleIcons = {
  hod: Layers,
  mentor: Users,
  student: GraduationCap,
};

function HierarchyNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children && node.children.length > 0;
  const color = roleColors[node.role] || '#818cf8';
  const Icon = roleIcons[node.role] || User;

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0 }}>
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '0.5rem',
          borderLeft: `4px solid ${color}`,
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.2s ease',
        }}
        onClick={() => hasChildren && setExpanded(!expanded)}
        onMouseOver={(e) => { if (hasChildren) e.currentTarget.style.transform = 'translateX(4px)'; }}
        onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {hasChildren ? (
              expanded ? <ChevronDown size={18} color={color} /> : <ChevronRight size={18} color={color} />
            ) : (
              <Icon size={18} color={color} />
            )}
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{node.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {node.role?.toUpperCase()} {node.dept ? `• ${node.dept.toUpperCase()}` : ''} {node.year ? `• ${node.year}` : ''} • {node.email}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {node.role === 'student' && (
              <>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Score</div>
                  <div style={{
                    fontWeight: 'bold',
                    color: node.score >= 75 ? '#34d399' : node.score >= 50 ? '#fbbf24' : '#ef4444',
                  }}>{node.score || 0}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Status</div>
                  <div style={{ fontSize: '0.8rem' }}>{node.performance || 'Pending'}</div>
                </div>
              </>
            )}
            {hasChildren && (
              <span style={{
                background: `${color}22`,
                color: color,
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                {node.children.length} {node.children[0]?.role || 'sub'}s
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div style={{ borderLeft: `2px solid ${color}33`, marginLeft: '0.5rem', paddingLeft: '0.5rem' }}>
          {node.children.map((child) => (
            <HierarchyNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HierarchyExplorer() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/users/hierarchy/deep')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load hierarchy');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return <p style={{ color: 'var(--error)', textAlign: 'center' }}>{error}</p>;
  }

  if (!data || !data.children || data.children.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No subordinates found yet.</p>;
  }

  return (
    <div>
      {data.stats && (
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', flex: '1 1 200px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Students</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#818cf8' }}>{data.stats.totalStudents}</div>
          </div>
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', flex: '1 1 200px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Score</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>{data.stats.averageScore}%</div>
          </div>
        </div>
      )}
      {data.children.map((node) => (
        <HierarchyNode key={node._id} node={node} />
      ))}
    </div>
  );
}
