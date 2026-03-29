import { supabase } from './supabase';

const normalize = (value, max) => Math.min(value / max, 1) * 100;

export async function scrape_market_data(skill_name) {
  // 1. Check Supabase market_data table
  const { data: existingData, error: dbError } = await supabase
    .from('market_data')
    .select('*')
    .eq('skill_name', skill_name)
    .single();

  if (existingData) {
    const lastUpdated = new Date(existingData.last_updated);
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    if (lastUpdated > sixHoursAgo) {
      return existingData;
    }
  }

  // 2. Mocking Bright Data Scraper API interactions
  // In a real app we would call Bright Data with process.env.BRIGHT_DATA_API_KEY
  console.log(`Scraping market data for ${skill_name}...`);
  
  // Simulated scrape results
  const job_count = Math.floor(Math.random() * 50000) + 1000;
  const avg_salary = Math.floor(Math.random() * 80000) + 60000;
  const trend_score = Math.floor(Math.random() * 100);
  const trend_direction = trend_score > 60 ? 'rising' : trend_score < 40 ? 'declining' : 'stable';
  
  // Kaggle mock values if missing
  const decay_rate = existingData?.decay_rate ?? Math.floor(Math.random() * 100);
  const supply_demand_ratio = existingData?.supply_demand_ratio ?? (Math.random() * 2).toFixed(2);
  const ai_replacement_risk = existingData?.ai_replacement_risk ?? Math.floor(Math.random() * 100);
  const community_health = existingData?.community_health ?? Math.floor(Math.random() * 100);

  // 4. Compute scores
  const reward_score = Math.round(
    normalize(job_count, 100000) * 0.30 +
    normalize(avg_salary, 200000) * 0.25 +
    trend_score * 0.20 +
    community_health * 0.15 +
    10
  );
  
  const risk_score = Math.round(
    decay_rate * 0.35 +
    normalize(supply_demand_ratio, 3) * 0.35 +
    ai_replacement_risk * 0.30
  );

  const newData = {
    skill_name,
    reward_score,
    risk_score,
    job_count,
    avg_salary,
    trend_direction,
    demand_trend: trend_direction === 'rising' ? 1 : trend_direction === 'declining' ? -1 : 0,
    supply_demand_ratio,
    ai_replacement_risk,
    decay_rate,
    community_health,
    last_updated: new Date().toISOString()
  };

  // 5. Save back to market_data table
  const { data: savedData } = await supabase
    .from('market_data')
    .upsert(newData, { onConflict: 'skill_name' })
    .select()
    .single();

  // 6. Insert into skill_history
  await supabase
    .from('skill_history')
    .insert({
      skill_name,
      reward_score,
      risk_score
    });

  return savedData || newData;
}
