'use client';
// Medical ID — emergency card for mute patients
// One tap shows: name, conditions, allergies, medications, emergency contacts, communication note
// Critical: first thing a paramedic or ER nurse should see
import { useState, useEffect } from 'react';

interface MedicalID {
  name:          string;
  dob:           string;
  conditions:    string;
  allergies:     string;
  medications:   string;
  bloodType:     string;
  emergencyName: string;
  emergencyPhone:string;
  aacNote:       string;
  language:      string;
  doctorName:    string;
  doctorPhone:   string;
}

const EMPTY: MedicalID = { name:'',dob:'',conditions:'',allergies:'',medications:'',bloodType:'',emergencyName:'',emergencyPhone:'',aacNote:'This person communicates using GestureTalk AAC. Please allow them time to respond. They are using hand gestures or symbols to communicate.',language:'English',doctorName:'',doctorPhone:'' };
const KEY = 'gesturetalk-medical-id';

export default function MedicalIDPage() {
  const [id,      setId]      = useState<MedicalID>(EMPTY);
  const [editing, setEditing] = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [draft,   setDraft]   = useState<MedicalID>(EMPTY);

  useEffect(() => {
    try { const r = localStorage.getItem(KEY); if (r) { const d = JSON.parse(r) as MedicalID; setId(d); setDraft(d); } } catch { /* ignore */ }
  }, []);

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); setId(draft); setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 2000); } catch { /* ignore */ }
  }

  function field(key: keyof MedicalID, label: string, placeholder = '', textarea = false) {
    return (
      <div key={key} className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</label>
        {textarea ? (
          <textarea value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} placeholder={placeholder} rows={3}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600 resize-none placeholder-gray-600" />
        ) : (
          <input value={draft[key]} onChange={e=>setDraft(d=>({...d,[key]:e.target.value}))} placeholder={placeholder}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-cyan-600 placeholder-gray-600" />
        )}
      </div>
    );
  }

  const isEmpty = !id.name;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Emergency card view */}
      {!editing && (
        <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
          {/* Emergency banner */}
          <div className="bg-red-950 border-2 border-red-600 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-4xl" aria-hidden="true">🆔</span>
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Medical ID — Emergency</p>
                <h1 className="text-2xl font-black text-white">{id.name || 'No name set'}</h1>
              </div>
            </div>

            {/* AAC communication note — most important */}
            <div className="bg-red-900/60 border border-red-700 rounded-xl p-3">
              <p className="text-xs font-bold text-red-300 uppercase mb-1">⚠️ Communication Note</p>
              <p className="text-sm text-red-100 leading-relaxed">{id.aacNote}</p>
            </div>
          </div>

          {/* Clinical info */}
          {[
            { label:'Date of Birth', value:id.dob },
            { label:'Blood Type',    value:id.bloodType },
            { label:'Conditions',    value:id.conditions },
            { label:'Allergies',     value:id.allergies, urgent:true },
            { label:'Medications',   value:id.medications },
            { label:'Language',      value:id.language },
          ].filter(f => f.value).map(f => (
            <div key={f.label} className={`bg-gray-900 border rounded-xl p-3 ${f.urgent ? 'border-orange-700 bg-orange-950/20' : 'border-gray-800'}`}>
              <p className="text-xs text-gray-500 font-medium uppercase">{f.urgent ? '⚠️ ' : ''}{f.label}</p>
              <p className={`text-sm mt-1 font-medium ${f.urgent ? 'text-orange-300' : 'text-gray-200'}`}>{f.value}</p>
            </div>
          ))}

          {/* Emergency contacts */}
          {(id.emergencyName || id.doctorName) && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-gray-400 uppercase">Emergency Contacts</p>
              {id.emergencyName && (
                <div className="flex items-center justify-between">
                  <div><p className="text-xs text-gray-500">Next of kin</p><p className="text-sm text-white font-medium">{id.emergencyName}</p></div>
                  <a href={`tel:${id.emergencyPhone}`} className="bg-emerald-700 hover:bg-emerald-600 text-white text-sm px-4 min-h-[44px] rounded-xl flex items-center font-medium">📞 Call</a>
                </div>
              )}
              {id.doctorName && (
                <div className="flex items-center justify-between border-t border-gray-800 pt-3">
                  <div><p className="text-xs text-gray-500">Doctor</p><p className="text-sm text-white font-medium">{id.doctorName}</p></div>
                  <a href={`tel:${id.doctorPhone}`} className="bg-cyan-700 hover:bg-cyan-600 text-white text-sm px-4 min-h-[44px] rounded-xl flex items-center font-medium">📞 Call</a>
                </div>
              )}
            </div>
          )}

          {isEmpty && (
            <div className="text-center py-8 text-gray-600">
              <p className="text-4xl mb-3">🆔</p>
              <p className="text-sm">No Medical ID set up yet.</p>
              <p className="text-xs mt-1">Set it up so paramedics and nurses know how to help you.</p>
            </div>
          )}

          <button onClick={() => setEditing(true)}
            className="w-full min-h-[52px] bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-2xl transition-colors">
            {isEmpty ? '+ Set up Medical ID' : '✏️ Edit Medical ID'}
          </button>
          <p className="text-xs text-gray-600 text-center">Stored only on this device · Never transmitted</p>
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="max-w-md mx-auto p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Edit Medical ID</h2>
            <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-300 text-sm min-h-[44px] px-2">Cancel</button>
          </div>
          {field('name',           'Full name',              'e.g. Priya Sharma')}
          {field('dob',            'Date of birth',          'e.g. 15 March 1975')}
          {field('bloodType',      'Blood type',             'e.g. B+')}
          {field('language',       'Preferred language',     'e.g. Hindi, Tamil, English')}
          {field('conditions',     'Medical conditions',     'e.g. ALS, Cerebral Palsy, Stroke', true)}
          {field('allergies',      'Allergies',              'e.g. Penicillin, Latex', true)}
          {field('medications',    'Current medications',    'e.g. Baclofen 10mg twice daily', true)}
          {field('emergencyName',  'Emergency contact name', 'e.g. Rahul Sharma (husband)')}
          {field('emergencyPhone', 'Emergency contact phone','e.g. +91 98765 43210')}
          {field('doctorName',     'Doctor name',            'e.g. Dr Meera Nair')}
          {field('doctorPhone',    'Doctor phone',           'e.g. +91 80123 45678')}
          {field('aacNote',        'Communication note (shown to emergency responders)', 'Describe how this person communicates', true)}
          <button onClick={save}
            className="w-full min-h-[52px] bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors">
            {saved ? '✓ Saved!' : 'Save Medical ID'}
          </button>
        </div>
      )}
    </div>
  );
}
