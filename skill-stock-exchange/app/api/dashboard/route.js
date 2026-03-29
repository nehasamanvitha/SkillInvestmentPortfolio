import { supabase } from '@/lib/supabase';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id') || 'anonymous';
  
  try {
    // 1. Fetch latest analysis
    const { data: analyses, error: analysisError } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1);
      
    const analysis = analyses?.[0] || null;

    if (!analysis) {
      return Response.json({ success: false, error: 'No analysis found for this user.' });
    }

    const skills = analysis.skill_verdicts.map(sv => sv.name);

    // 2. Fetch market data for these skills
    const { data: marketData, error: marketError } = await supabase
      .from('market_data')
      .select('*')
      .in('skill_name', skills);

    // 3. Fetch skill history for trend charts
    const { data: historyData, error: historyError } = await supabase
      .from('skill_history')
      .select('*')
      .in('skill_name', skills)
      .order('recorded_at', { ascending: true });

    return Response.json({
      success: true,
      data: {
        analysis,
        marketData: marketData || [],
        skillHistory: historyData || []
      }
    });
  } catch (error) {
    console.error("Dashboard data error:", error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
