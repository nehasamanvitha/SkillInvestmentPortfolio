"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SKILLS_LIST = [
  'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Java', 'C++', 'Rust', 'Go',
  'Kubernetes', 'Docker', 'AWS', 'Machine Learning', 'System Design', 'Data Science',
  'TypeScript', 'Vue', 'Angular', 'MongoDB', 'PostgreSQL', 'Figma', 'DevOps',
  'Blockchain', 'Cybersecurity', 'Flutter'
];

export default function ProfilePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    hours_per_week: 10,
    goal: 'Get Promoted',
    experience_level: 'Mid',
    risk_appetite: 'Balanced',
    location: ''
  });
  
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [status, setStatus] = useState(''); // text for loading state
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSkillToggle = (e) => {
    const skillName = e.target.value;
    if (!skillName) return;
    
    if (!selectedSkills.find(s => s.name === skillName)) {
      setSelectedSkills(prev => [...prev, { name: skillName, proficiency: 5 }]);
    }
    e.target.value = ""; // reset dropdown
  };

  const handleSkillRemove = (skillName) => {
    setSelectedSkills(prev => prev.filter(s => s.name !== skillName));
  };

  const handleProficiencyChange = (skillName, val) => {
    setSelectedSkills(prev => prev.map(s => 
      s.name === skillName ? { ...s, proficiency: parseInt(val) } : s
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      alert("Please select at least one skill.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      // 1. Save profile to Supabase
      setStatus("Saving profile...");
      const user_id = "user_" + Math.random().toString(36).substr(2, 9);
      
      const profileToSave = {
        user_id,
        name: formData.name,
        skills: selectedSkills,
        hours_per_week: parseInt(formData.hours_per_week),
        goal: formData.goal,
        experience_level: formData.experience_level,
        risk_appetite: formData.risk_appetite,
        location: formData.location
      };
      
      const { data: profileRecord, error } = await supabase
        .from('profiles')
        .insert(profileToSave)
        .select()
        .single();
        
      const profile_id = profileRecord?.id || null;

      // 2. Trigger analysis pipeline with visual delays
      setStatus("Scraping live market data...");
      
      // We don't await immediately, we will manually cycle text or let the endpoint run
      // since the prompt says "Show realistic loading messages during analysis". We can simulate the messages
      // by starting the fetch and updating status in parallel, or better, the endpoint runs and we cycle the text manually.
      
      const timer1 = setTimeout(() => setStatus("Fetching salary benchmarks..."), 1500);
      const timer2 = setTimeout(() => setStatus("Running opportunity analysis..."), 3000);
      const timer3 = setTimeout(() => setStatus("Running risk analysis..."), 4500);
      const timer4 = setTimeout(() => setStatus("Computing portfolio health..."), 6000);
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_id, user_id, profile: profileToSave })
      });
      
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      
      const result = await res.json();
      
      if (result.success) {
        setStatus("Building your dashboard...");
        setTimeout(() => {
          router.push(`/dashboard?user_id=${user_id}`);
        }, 500);
      } else {
        setStatus("Analysis failed: " + result.error);
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setStatus("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <h2 className="mono-text text-green">{status}</h2>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '8px' }}>
          <div className="spinner"></div>
        </div>
        <style jsx>{`
          .spinner {
            width: 40px; height: 40px;
            border: 4px solid var(--border-color);
            border-top-color: var(--color-green);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <main style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="mono-text" style={{ marginBottom: '2rem' }}>&gt; INIT_PORTFOLIO_ANALYSIS</h1>
      
      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Full Name</label>
          <input type="text" name="name" required style={{ width: '100%' }} value={formData.name} onChange={handleInputChange} />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Location</label>
            <input type="text" name="location" placeholder="e.g. San Francisco, US" required style={{ width: '100%' }} value={formData.location} onChange={handleInputChange} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Hours available / week</label>
            <input type="number" name="hours_per_week" required max="40" min="1" style={{ width: '100%' }} value={formData.hours_per_week} onChange={handleInputChange} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Select Skills (Pick up to 10)</label>
          <select onChange={handleSkillToggle} style={{ width: '100%', marginBottom: '1rem' }} defaultValue="">
            <option value="" disabled>-- Add a skill --</option>
            {SKILLS_LIST.map(s => (
              <option key={s} value={s} disabled={selectedSkills.find(sel => sel.name === s)}>{s}</option>
            ))}
          </select>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedSkills.map(skill => (
              <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: '150px', fontWeight: 'bold' }}>{skill.name}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="mono-text">Level: {skill.proficiency}</span>
                  <input 
                    type="range" 
                    min="1" max="10" 
                    value={skill.proficiency}
                    onChange={(e) => handleProficiencyChange(skill.name, e.target.value)}
                    style={{ flex: 1, accentColor: 'var(--color-green)' }}
                  />
                </div>
                <button type="button" onClick={() => handleSkillRemove(skill.name)} style={{ background: 'transparent', border: 'none', color: 'var(--color-red)' }}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Career Goal</label>
            <select name="goal" value={formData.goal} onChange={handleInputChange} style={{ width: '100%' }}>
              <option>Get First Job</option>
              <option>Get Promoted</option>
              <option>Switch Domain</option>
              <option>Freelance</option>
              <option>Research</option>
            </select>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Experience Level</label>
            <select name="experience_level" value={formData.experience_level} onChange={handleInputChange} style={{ width: '100%' }}>
              <option>Fresher</option>
              <option>Junior</option>
              <option>Mid</option>
              <option>Senior</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Risk Appetite</label>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {['Conservative', 'Balanced', 'Aggressive'].map(level => (
              <label key={level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="risk_appetite" 
                  value={level} 
                  checked={formData.risk_appetite === level}
                  onChange={handleInputChange}
                  style={{ accentColor: 'var(--color-green)' }}
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
          Analyze My Portfolio
        </button>
      </form>
    </main>
  );
}
