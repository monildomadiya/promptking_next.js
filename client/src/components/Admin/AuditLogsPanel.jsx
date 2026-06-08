import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../api';
import { FileText, Clock, AlertCircle } from '../Common/Icons';

const glassPanelStyle = {
  background: 'var(--glass-bg)',
  backdropFilter: 'var(--glass-blur)',
  WebkitBackdropFilter: 'var(--glass-blur)',
  border: '1px solid var(--glass-border)',
  borderRadius: '24px',
};

const AuditLogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/admin/logs');
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
      <div style={{ ...glassPanelStyle, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '2px' }}>System Audit Logs</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Track all administrative actions securely.</p>
          </div>
        </div>
      </div>

      <div style={{ ...glassPanelStyle, padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={32} opacity={0.5} />
            <p>No activity logs found.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Time</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Action</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-dim)', fontSize: '0.8rem' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} /> {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{log.action}</td>
                  <td style={{ padding: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <pre style={{ margin: 0, fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '4px' }}>
                      {log.details}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
};

export default AuditLogsPanel;
