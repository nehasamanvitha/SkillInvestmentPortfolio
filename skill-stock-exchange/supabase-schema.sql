-- Table: profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    name TEXT,
    skills JSONB,
    hours_per_week INT,
    goal TEXT,
    experience_level TEXT,
    risk_appetite TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: market_data
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name TEXT UNIQUE,
    reward_score INT,
    risk_score INT,
    job_count INT,
    avg_salary INT,
    trend_direction TEXT,
    demand_trend INT,
    supply_demand_ratio FLOAT,
    ai_replacement_risk INT,
    decay_rate INT,
    community_health INT,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: analyses
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    profile_id UUID REFERENCES profiles(id),
    skill_verdicts JSONB,
    bull_analysis JSONB,
    bear_analysis JSONB,
    time_allocation JSONB,
    portfolio_health INT,
    portfolio_label TEXT,
    top_skill TEXT,
    biggest_risk TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Table: skill_history
CREATE TABLE skill_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    skill_name TEXT,
    reward_score INT,
    risk_score INT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Realtime for market_data
ALTER PUBLICATION supabase_realtime ADD TABLE market_data;
