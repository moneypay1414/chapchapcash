import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';

export default function AdminStateSettings() {
  const [states, setStates] = useState([]);
  const [name, setName] = useState('');
  const [commission, setCommission] = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      const res = await adminAPI.getStateSettings();
      setStates(res.data.states || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load state settings');
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const payload = { name, commissionPercent: Number(commission || 0) };
      if (editing) {
        await adminAPI.updateStateSetting(editing._id, payload);
      } else {
        await adminAPI.createStateSetting(payload);
      }
      setName(''); setCommission(''); setEditing(null);
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setName(s.name);
    setCommission(String(s.commissionPercent || 0));
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this state?')) return;
    try {
      await adminAPI.deleteStateSetting(id);
      await load();
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <div>
      <h2>State Settings</h2>
      <form onSubmit={handleAdd} style={{display: 'flex', gap: 8, marginBottom: 12}}>
        <input placeholder="State name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Commission %" value={commission} onChange={(e) => setCommission(e.target.value)} />
        <button className="btn" type="submit">{editing ? 'Update' : 'Create'}</button>
        {editing && <button type="button" onClick={() => { setEditing(null); setName(''); setCommission(''); }}>Cancel</button>}
      </form>

      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Commission %</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {states.map(s => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{s.commissionPercent}%</td>
              <td>
                <button className="btn" onClick={() => handleEdit(s)}>Edit</button>
                <button className="btn btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
