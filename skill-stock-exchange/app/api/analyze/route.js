import { scrape_market_data } from '@/lib/scraping';
import { run_bull_analysis, run_bear_analysis } from '@/lib/ai-analysis';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const { profile_id, user_id, profile } = body;
    
    // 1. Fetch market data for each skill in parallel
    const skillPromises = profile.skills.map(skill => scrape_market_data(skill.name));
    const skillScores = await Promise.all(skillPromises);
    
    // 2. Run Bull and Bear analyses in parallel
    const [bullResult, bearResult] = await Promise.all([
      run_bull_analysis(profile, skillScores),
      run_bear_analysis(profile, skillScores)
    ]);
    
    // 3. Reconcile verdicts
    const skill_verdicts = profile.skills.map(userSkill => {
      const bull = bullResult.skills?.find(s => s.name === userSkill.name) || {};
      const bear = bearResult.skills?.find(s => s.name === userSkill.name) || {};
      const score = skillScores.find(s => s.skill_name === userSkill.name) || {};
      
      let finalVerdict = 'HOLD';
      const bVerdict = bull.verdict;
      const bRisk = bear.risk_level;
      
      if (bVerdict === 'BUY' && bRisk === 'LOW') finalVerdict = 'STRONG BUY';
      else if (bVerdict === 'STRONG BUY') finalVerdict = 'STRONG BUY';
      else if (bVerdict === 'BUY' && bRisk === 'MEDIUM') finalVerdict = 'BUY';
      else if (bVerdict === 'BUY' && bRisk === 'HIGH') finalVerdict = 'HOLD';
      else if (bVerdict === 'HOLD' && bRisk === 'HIGH') finalVerdict = 'REDUCE';
      else if (bVerdict === 'REDUCE' || bRisk === 'CRITICAL') finalVerdict = 'DROP';
      
      return {
        name: userSkill.name,
        verdict: finalVerdict,
        reward_score: score.reward_score,
        risk_score: score.risk_score,
        bull_reason: bull.bull_reason || '',
        bear_reason: bear.bear_reason || '',
        risk_level: bear.risk_level || 'MEDIUM',
        recommended_hours_per_week: 0 // to be computed
      };
    });
    
    // 4. Compute time allocation
    let total_weight = 0;
    const weights = { 'STRONG BUY': 5, 'BUY': 4, 'HOLD': 2, 'REDUCE': 1, 'DROP': 0 };
    
    skill_verdicts.forEach(sv => {
      total_weight += weights[sv.verdict] || 0;
    });
    
    skill_verdicts.forEach(sv => {
      const w = weights[sv.verdict] || 0;
      if (total_weight > 0) {
        sv.recommended_hours_per_week = Math.round(((w / total_weight) * profile.hours_per_week) * 2) / 2;
      }
    });
    
    // 5. Compute portfolio health
    const avg_reward = skillScores.reduce((sum, s) => sum + s.reward_score, 0) / (skillScores.length || 1);
    const drop_count = skill_verdicts.filter(sv => sv.verdict === 'DROP').length;
    const risk_penalty = drop_count * 5;
    
    // Assuming simple diversification bonus and no concentration penalty for now
    let portfolio_health = Math.round(avg_reward + 10 - risk_penalty);
    portfolio_health = Math.max(0, Math.min(100, portfolio_health));
    
    let portfolio_label = 'Weak';
    if (portfolio_health >= 80) portfolio_label = 'Strong';
    else if (portfolio_health >= 60) portfolio_label = 'Stable';
    else if (portfolio_health >= 40) portfolio_label = 'Needs Work';
    
    const top_skill = skill_verdicts.sort((a, b) => (weights[b.verdict] || 0) - (weights[a.verdict] || 0))[0]?.name || 'N/A';
    const biggest_risk = skill_verdicts.sort((a, b) => b.risk_score - a.risk_score)[0]?.name || 'N/A';

    const analysisData = {
      user_id: user_id || 'anonymous',
      profile_id: profile_id || null, // Might be null if user doesn't use Supabase profiles table directly
      skill_verdicts,
      bull_analysis: bullResult,
      bear_analysis: bearResult,
      time_allocation: skill_verdicts.map(sv => ({ name: sv.name, hours: sv.recommended_hours_per_week, verdict: sv.verdict })),
      portfolio_health,
      portfolio_label,
      top_skill,
      biggest_risk
    };

    // 6. Save to Supabase
    const { data: savedAnalysis, error } = await supabase
      .from('analyses')
      .insert(analysisData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
    }

    return Response.json({ success: true, analysis: savedAnalysis || analysisData });
  } catch (error) {
    console.error("Analysis generation error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
