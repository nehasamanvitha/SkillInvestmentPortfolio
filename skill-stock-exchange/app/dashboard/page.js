"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }} className="mono-text text-green">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user_id');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tickerData, setTickerData] = useState([]);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard?user_id=${userId}`);
        const result = await res.json();
        
        if (result.success) {
          setData(result.data);
          setTickerData(result.data.marketData);
        } else {
          setError(result.error);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  useEffect(() => {
    if (!data) return;
    
    // Subscribe to realtime updates for market_data
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'market_data' },
        (payload) => {
          setTickerData(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new : item
          ));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [data]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--color-green)' }} className="mono-text">Loading Dashboard Data...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'var(--color-red)' }}>Error loading dashboard: {error}</div>;
  if (!data || !data.analysis) return <div style={{ padding: '2rem' }}>No analysis found.</div>;

  const { analysis, marketData, skillHistory } = data;

  // Pie chart colors
  const VERDICT_COLORS = {
    'STRONG BUY': '#00ff88',
    'BUY': '#00cc66',
    'HOLD': '#ffcc00',
    'REDUCE': '#ff6600',
    'DROP': '#ff4444'
  };

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* SECTION 1 - Live Ticker Bar */}
      <div style={{ 
        width: '100%', 
        backgroundColor: 'var(--bg-ticker)', 
        borderBottom: '1px solid var(--border-color)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '0.5rem 0'
      }}>
        <div style={{ display: 'inline-block', animation: 'scroll 30s linear infinite' }}>
          {tickerData.map(item => (
            <span key={item.id} className="mono-text" style={{ 
              marginRight: '2rem', 
              color: item.reward_score > 60 ? 'var(--color-green)' : item.reward_score < 40 ? 'var(--color-red)' : 'var(--color-yellow)'
            }}>
              {item.skill_name.toUpperCase()} {item.demand_trend >= 0 ? '▲' : '▼'} {item.reward_score}
            </span>
          ))}
          {/* Duplicate for seamless scrolling */}
          {tickerData.map(item => (
             <span key={`dup-${item.id}`} className="mono-text" style={{ 
              marginRight: '2rem', 
              color: item.reward_score > 60 ? 'var(--color-green)' : item.reward_score < 40 ? 'var(--color-red)' : 'var(--color-yellow)'
            }}>
              {item.skill_name.toUpperCase()} {item.demand_trend >= 0 ? '▲' : '▼'} {item.reward_score}
            </span>
          ))}
        </div>
      </div>
      <style justify="true">{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* SECTION 2 - Portfolio Summary Row */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Portfolio Health Score</h3>
            <div className="mono-text" style={{ 
              fontSize: '4rem', 
              fontWeight: 'bold', 
              lineHeight: 1,
              color: analysis.portfolio_health >= 80 ? 'var(--color-green)' : analysis.portfolio_health >= 60 ? 'var(--color-yellow)' : 'var(--color-red)'
            }}>
              {analysis.portfolio_health}
            </div>
            <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>{analysis.portfolio_label}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Combined risk-weighted opportunity</div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Top Skill To Invest In</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {analysis.top_skill} <span style={{ fontSize: '1rem', background: 'var(--color-green)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '0.5rem' }}>STRONG BUY</span>
            </div>
            <div className="mono-text" style={{ marginTop: '1.5rem', fontSize: '1.2rem', color: 'var(--color-green)' }}>
              +{analysis.time_allocation.find(t => t.name === analysis.top_skill)?.hours || 0} hrs/week
            </div>
          </div>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Biggest Risk In Portfolio</h3>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
              {analysis.biggest_risk} <span style={{ fontSize: '1rem', background: 'var(--color-red)', color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', verticalAlign: 'middle', marginLeft: '0.5rem' }}>DROP</span>
            </div>
            <div style={{ marginTop: '1.5rem', color: 'var(--color-red)' }}>
              {analysis.skill_verdicts.find(s => s.name === analysis.biggest_risk)?.bear_reason || 'High decline in job volume'}
            </div>
          </div>
        </section>

        {/* SECTION 3 - Skill Cards Grid */}
        <section>
          <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Detailed Asset Analysis</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            {analysis.skill_verdicts.sort((a,b) => {
              const weights = { 'STRONG BUY': 5, 'BUY': 4, 'HOLD': 2, 'REDUCE': 1, 'DROP': 0 };
              return weights[b.verdict] - weights[a.verdict];
            }).map(sv => (
              <div key={sv.name} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a1a1a' }}>
                  <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{sv.name}</h3>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {/* Left Side: Bull */}
                  <div style={{ flex: '1 1 300px', padding: '1.5rem', borderRight: '1px solid var(--border-color)', background: 'rgba(0, 255, 136, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>MARKET BULL ANALYSIS</div>
                      <div style={{ background: VERDICT_COLORS[sv.verdict], color: '#000', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>{sv.verdict}</div>
                    </div>
                    
                    <div className="mono-text" style={{ fontSize: '2.5rem', color: 'var(--color-green)', lineHeight: 1, marginBottom: '0.5rem' }}>{sv.reward_score}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Reward Score / 100</div>
                    
                    <p style={{ minHeight: '3rem', fontSize: '0.95rem' }}>{sv.bull_reason}</p>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Action: </span> 
                      <strong style={{ color: 'var(--color-green)' }}>Invest {sv.recommended_hours_per_week} hrs/week</strong>
                    </div>
                  </div>

                  {/* Right Side: Bear */}
                  <div style={{ flex: '1 1 300px', padding: '1.5rem', background: 'rgba(255, 68, 68, 0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ color: 'var(--color-red)', fontWeight: 'bold' }}>MARKET BEAR ANALYSIS</div>
                      <div style={{ border: `1px solid var(--color-red)`, color: 'var(--color-red)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.8rem' }}>{sv.risk_level} RISK</div>
                    </div>

                    <div className="mono-text" style={{ fontSize: '2.5rem', color: 'var(--color-red)', lineHeight: 1, marginBottom: '0.5rem' }}>{sv.risk_score}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Risk Score / 100</div>

                    <p style={{ minHeight: '3rem', fontSize: '0.95rem' }}>{sv.bear_reason}</p>
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Main Threat: </span> 
                      <strong style={{ color: 'var(--color-red)' }}>{analysis.bear_analysis?.skills?.find(s => s.name === sv.name)?.main_threat || 'Market Saturation'}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Bars */}
                <div style={{ display: 'flex', height: '6px' }}>
                  <div style={{ width: `${sv.reward_score}%`, background: 'var(--color-green)' }}></div>
                  <div style={{ width: `${100 - sv.reward_score}%`, background: 'var(--bg-card)' }}></div>
                  <div style={{ width: `${sv.risk_score}%`, background: 'var(--color-red)' }}></div>
                  <div style={{ width: `${100 - sv.risk_score}%`, background: 'var(--bg-card)' }}></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4 - Three Charts Side By Side */}
        <section>
          <h2 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Portfolio Metrics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
            
            {/* Chart 1: Scatter Plot */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>Risk vs Reward Matrix</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis type="number" dataKey="risk_score" name="Risk Score" domain={[0, 100]} stroke="#888" />
                    <YAxis type="number" dataKey="reward_score" name="Reward Score" domain={[0, 100]} stroke="#888" />
                    <ZAxis type="number" range={[100, 400]} />
                    <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                    {analysis.skill_verdicts.map((sv, index) => (
                      <Scatter key={sv.name} name={sv.name} data={[sv]} fill={VERDICT_COLORS[sv.verdict]} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Time Allocation Donut */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>Weekly Time Allocation</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={analysis.time_allocation.filter(t => t.hours > 0)}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={100}
                      paddingAngle={5}
                      dataKey="hours"
                      nameKey="name"
                      label={({ name, hours }) => `${name} (${hours}h)`}
                    >
                      {analysis.time_allocation.filter(t => t.hours > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={VERDICT_COLORS[entry.verdict]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Skill Momentum Line Chart */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', textAlign: 'center' }}>Reward Score Momentum</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={skillHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="recorded_at" tickFormatter={(val) => new Date(val).toLocaleDateString()} stroke="#888" />
                    <YAxis domain={[0, 100]} stroke="#888" />
                    <RechartsTooltip labelFormatter={(val) => new Date(val).toLocaleString()} contentStyle={{ backgroundColor: '#111', borderColor: '#333' }} />
                    <Legend />
                    {Array.from(new Set(skillHistory.map(h => h.skill_name))).map((skill, index) => (
                      <Line 
                        key={skill} 
                        type="monotone" 
                        dataKey="reward_score" 
                        data={skillHistory.filter(h => h.skill_name === skill)}
                        name={skill} 
                        stroke={`hsl(${index * 50}, 70%, 50%)`} 
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
