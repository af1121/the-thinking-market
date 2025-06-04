// Research Service - Mock data for demo, easily replaceable with real API calls

export interface HypothesisResult {
  id: string;
  title: string;
  hypothesis: string;
  status: 'SUPPORTED' | 'REJECTED' | 'PENDING' | 'INCONCLUSIVE';
  confidence?: number;
  keyFindings: string[];
  implications: string;
  data: {
    [key: string]: number | string | boolean | null | undefined;
  };
  lastUpdated: string;
}

export interface AgentProfile {
  name: string;
  strategy: string;
  bestReward: number;
  characteristics: string;
  color: string;
  trainingIterations: number;
  convergenceRate: number;
}

export interface ResearchMetrics {
  totalEpisodes: number;
  totalAgentsTrained: number;
  hypothesesTested: number;
  significantFindings: number;
  lastTestRun: string;
}

// Mock data based on actual test results
const MOCK_HYPOTHESIS_RESULTS: HypothesisResult[] = [
  {
    id: 'h1',
    title: 'H1: Volatility Amplification',
    hypothesis: 'RL agents increase market volatility during stress periods',
    status: 'REJECTED',
    confidence: 95,
    keyFindings: [
      'RL agents REDUCE volatility by 95.5% vs random baseline',
      'Amplification factor: 0.04 (vs 0.03 random, 2.51 simulated)',
      'Agent correlation during stress: 0.391 (significant)',
      'Evidence rate: 0/8 episodes (0% support)'
    ],
    implications: 'Trained RL agents act as market stabilizers, not destabilizers',
    data: {
      amplificationFactor: 0.04,
      baselineAmplification: 0.03,
      simulatedAmplification: 2.51,
      stressCorrelation: 0.391,
      evidenceRate: 0,
      volatilityReduction: -95.5,
      episodesTested: 8
    },
    lastUpdated: '2024-05-30T20:30:00Z'
  },
  {
    id: 'h2',
    title: 'H2: Liquidity Provision',
    hypothesis: 'RL agents reduce market liquidity during crises',
    status: 'REJECTED',
    confidence: 95,
    keyFindings: [
      'RL agents IMPROVE liquidity by 40% during crises',
      'Liquidity reduction: -40% (negative = improvement)',
      'Evidence rate: 0/3 episodes (0% support)',
      'Agents provide MORE liquidity when markets need it most'
    ],
    implications: 'RL agents enhance market resilience by providing counter-cyclical liquidity',
    data: {
      liquidityChange: -40,
      evidenceRate: 0,
      episodesTested: 3,
      improvementMagnitude: 40,
      crisisResponseTime: 2.3
    },
    lastUpdated: '2024-05-30T19:45:00Z'
  },
  {
    id: 'h3',
    title: 'H3: Herding Behavior',
    hypothesis: 'Multiple RL agents exhibit herding behavior',
    status: 'PENDING',
    keyFindings: [
      'Test in progress...',
      'Measuring action correlation patterns',
      'Analyzing Shannon entropy of decisions',
      'Tracking coordination during stress events'
    ],
    implications: 'Results will show if agents coordinate or act independently',
    data: {
      herdingIndex: null,
      agentCorrelation: null,
      evidenceRate: null,
      expectedCompletion: '2024-05-31T10:00:00Z'
    },
    lastUpdated: '2024-05-30T21:00:00Z'
  },
  {
    id: 'h4',
    title: 'H4: Adaptation Speed',
    hypothesis: 'RL agents adapt faster than traditional algorithms',
    status: 'PENDING',
    keyFindings: [
      'Test not yet conducted',
      'Will measure regime change detection speed',
      'Compare RL vs traditional agent adaptation',
      'Analyze performance recovery times'
    ],
    implications: 'Results will quantify RL agent learning advantages',
    data: {
      adaptationSpeed: null,
      speedAdvantage: null,
      recoveryTime: null,
      plannedStart: '2024-06-01T09:00:00Z'
    },
    lastUpdated: '2024-05-30T21:00:00Z'
  }
];

const MOCK_AGENT_PROFILES: AgentProfile[] = [
  {
    name: 'momentum_agent',
    strategy: 'Aggressive',
    bestReward: 3.84,
    characteristics: 'High learning rate, trend-following behavior',
    color: '#ef4444',
    trainingIterations: 75,
    convergenceRate: 0.85
  },
  {
    name: 'mean_reversion_agent',
    strategy: 'Risk-Averse',
    bestReward: 3.89,
    characteristics: 'Conservative approach, value-based trading',
    color: '#3b82f6',
    trainingIterations: 82,
    convergenceRate: 0.92
  },
  {
    name: 'adaptive_agent',
    strategy: 'Balanced',
    bestReward: 4.30,
    characteristics: 'Standard parameters, adaptive learning',
    color: '#10b981',
    trainingIterations: 68,
    convergenceRate: 0.88
  }
];

const MOCK_RESEARCH_METRICS: ResearchMetrics = {
  totalEpisodes: 14,
  totalAgentsTrained: 3,
  hypothesesTested: 2,
  significantFindings: 2,
  lastTestRun: '2024-05-30T20:30:00Z'
};

// API-like functions (easily replaceable with real API calls)
export class ResearchService {
  private static baseUrl = 'http://localhost:8000/api/research'; // Future API endpoint

  static async getHypothesisResults(): Promise<HypothesisResult[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // In production, this would be:
    // const response = await fetch(`${this.baseUrl}/hypotheses`);
    // return response.json();
    
    return MOCK_HYPOTHESIS_RESULTS;
  }

  static async getHypothesisResult(id: string): Promise<HypothesisResult | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // In production:
    // const response = await fetch(`${this.baseUrl}/hypotheses/${id}`);
    // return response.json();
    
    return MOCK_HYPOTHESIS_RESULTS.find(h => h.id === id) || null;
  }

  static async getAgentProfiles(): Promise<AgentProfile[]> {
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // In production:
    // const response = await fetch(`${this.baseUrl}/agents`);
    // return response.json();
    
    return MOCK_AGENT_PROFILES;
  }

  static async getResearchMetrics(): Promise<ResearchMetrics> {
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // In production:
    // const response = await fetch(`${this.baseUrl}/metrics`);
    // return response.json();
    
    return MOCK_RESEARCH_METRICS;
  }

  static async runHypothesisTest(hypothesisId: string): Promise<{ success: boolean; message: string }> {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate test duration
    
    // In production:
    // const response = await fetch(`${this.baseUrl}/test/${hypothesisId}`, { method: 'POST' });
    // return response.json();
    
    return {
      success: true,
      message: `Hypothesis ${hypothesisId} test completed successfully`
    };
  }

  static async exportResults(format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In production:
    // const response = await fetch(`${this.baseUrl}/export?format=${format}`);
    // return response.blob();
    
    const data = {
      hypotheses: MOCK_HYPOTHESIS_RESULTS,
      agents: MOCK_AGENT_PROFILES,
      metrics: MOCK_RESEARCH_METRICS,
      exportedAt: new Date().toISOString()
    };
    
    return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  }
}

// Utility functions for data analysis
export const ResearchUtils = {
  calculateSignificanceLevel: (pValue: number): 'high' | 'medium' | 'low' | 'none' => {
    if (pValue < 0.01) return 'high';
    if (pValue < 0.05) return 'medium';
    if (pValue < 0.1) return 'low';
    return 'none';
  },

  formatConfidenceInterval: (confidence: number): string => {
    return `${confidence}% CI`;
  },

  getStatusColor: (status: string): string => {
    switch (status) {
      case 'SUPPORTED': return 'text-green-600 bg-green-50 border-green-200';
      case 'REJECTED': return 'text-red-600 bg-red-50 border-red-200';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'INCONCLUSIVE': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  },

  generateChartData: (hypothesis: HypothesisResult) => {
    // Generate appropriate chart data based on hypothesis type
    switch (hypothesis.id) {
      case 'h1':
        return {
          amplificationComparison: [
            { name: 'Random Baseline', value: hypothesis.data.baselineAmplification },
            { name: 'Trained RL Agents', value: hypothesis.data.amplificationFactor },
            { name: 'Simulated Agents', value: hypothesis.data.simulatedAmplification }
          ],
          volatilityTimeSeries: Array.from({ length: 20 }, (_, i) => ({
            step: i,
            rl: 0.02 + Math.random() * 0.005,
            traditional: 0.025 + Math.random() * 0.02
          }))
        };
      case 'h2':
        return {
          liquidityResponse: [
            { period: 'Pre-Crisis', liquidity: 100 },
            { period: 'Crisis Onset', liquidity: 85 },
            { period: 'RL Response', liquidity: 140 },
            { period: 'Recovery', liquidity: 120 }
          ]
        };
      default:
        return {};
    }
  }
}; 