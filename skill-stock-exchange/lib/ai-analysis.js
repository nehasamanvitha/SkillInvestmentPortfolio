export async function run_bull_analysis(user_profile, skill_scores) {
  // Using pure heuristic logic based on Bright Data scores instead of external AI API calls
  return {
    skills: skill_scores.map(s => {
      let verdict = 'HOLD';
      let bull_reason = 'Stable market demand.';
      
      if (s.reward_score >= 75) {
        verdict = 'STRONG BUY';
        bull_reason = 'Exceptional salary and high job volume signals strong growth.';
      } else if (s.reward_score >= 55) {
        verdict = 'BUY';
        bull_reason = 'Solid upward trend in market demand.';
      } else if (s.reward_score < 35) {
        verdict = 'DROP';
        bull_reason = 'Severe lack of market interest and low pay.';
      } else if (s.reward_score < 45) {
        verdict = 'REDUCE';
        bull_reason = 'Declining trend in job postings.';
      }
      
      return {
        name: s.skill_name,
        verdict,
        recommended_hours_per_week: Math.max(1, Math.floor((s.reward_score / 100) * 10)),
        bull_reason,
        confidence: s.reward_score
      };
    }),
    new_skill_picks: [
      { name: "Rust", reason: "High demand systems language." },
      { name: "Go", reason: "Strong backend cloud demand." }
    ],
    portfolio_summary: "Portfolio opportunity analysis generated using Bright Data market metrics."
  };
}

export async function run_bear_analysis(user_profile, skill_scores) {
  // Using pure heuristic logic based on Bright Data/Market scores instead of external AI API calls
  return {
    skills: skill_scores.map(s => {
      let risk_level = 'MEDIUM';
      let bear_reason = 'Moderate competition and industry changes.';
      let main_threat = 'Market Shifts';

      if (s.risk_score >= 75) {
        risk_level = 'CRITICAL';
        bear_reason = 'Extremely high risk of AI replacement and rapid skill decay.';
        main_threat = 'AI Automation';
      } else if (s.risk_score >= 55) {
        risk_level = 'HIGH';
        bear_reason = 'High supply-to-demand ratio threatening job security.';
        main_threat = 'Oversupply';
      } else if (s.risk_score < 35) {
        risk_level = 'LOW';
        bear_reason = 'Very secure skill with low automation vulnerability.';
        main_threat = 'None';
      }
      
      return {
        name: s.skill_name,
        risk_level,
        bear_reason,
        avoid_score: s.risk_score,
        main_threat
      };
    }),
    over_invested_skills: [
      { name: "Legacy Frameworks", reason: "Declining market share." }
    ],
    portfolio_risk_summary: "Portfolio risk analysis generated using Bright Data market metrics."
  };
}
