import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Play,
  BookOpen,
  Zap,
  Shield,
  Users,
  Award,
  Sparkles,
  Target,
  Activity,
  BarChart3,
  Presentation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ResearchJourneyProps {
  onComplete: () => void;
}

interface JourneyStep {
  id: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  color: string;
  duration?: number;
}

// Updated data to match actual thesis findings
const AGENT_PROFILES = [
  {
    name: 'momentum_agent',
    strategy: 'Aggressive',
    bestReward: 3.84,
    characteristics: 'High learning rate, trend-following behavior',
    color: '#ef4444',
    trainingEpisodes: 150,
    extendedReward: 0.15,
    optimalTraining: true
  },
  {
    name: 'mean_reversion_agent', 
    strategy: 'Risk-Averse',
    bestReward: 3.89,
    characteristics: 'Conservative approach, value-based trading',
    color: '#3b82f6',
    trainingEpisodes: 150,
    extendedReward: 0.07,
    optimalTraining: true
  },
  {
    name: 'adaptive_agent',
    strategy: 'Balanced', 
    bestReward: 4.30,
    characteristics: 'Standard parameters, adaptive learning',
    color: '#10b981',
    trainingEpisodes: 150,
    extendedReward: 0.10,
    optimalTraining: true
  }
];

const ResearchJourney: React.FC<ResearchJourneyProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Updated chart data to match thesis findings
  const amplificationData = [
    { name: 'Baseline Market', value: 1.0, color: '#94a3b8' },
    { name: 'RL Agents Present', value: 2.47, color: '#ef4444' },
    { name: 'Traditional Only', value: 1.2, color: '#3b82f6' }
  ];

  const volatilityData = [
    { scenario: 'Normal Market', rl: 0.025, traditional: 0.020 },
    { scenario: 'Stress Period', rl: 0.062, traditional: 0.035 },
    { scenario: 'Crisis Event', rl: 0.089, traditional: 0.045 }
  ];

  const liquidityData = [
    { period: 'Pre-Stress', liquidity: 100 },
    { period: 'Stress Onset', liquidity: 85 },
    { period: 'RL Impact', liquidity: 56 },
    { period: 'Recovery', liquidity: 78 }
  ];

  const herdingData = [
    { metric: 'Agent Correlation', value: 0.404, threshold: 0.3, status: 'Above Threshold' },
    { metric: 'Synchronization Index', value: 0.67, threshold: 0.5, status: 'Above Threshold' },
    { metric: 'Action Dispersion', value: 0.42, threshold: 0.6, status: 'Below Threshold' }
  ];

  const adaptationData = [
    { metric: 'Detection Speed', rl: 2.5, traditional: 1.0 },
    { metric: 'Response Time', rl: 1.8, traditional: 1.0 },
    { metric: 'Learning Rate', rl: 3.2, traditional: 1.0 }
  ];

  const trainingComparisonData = [
    { agent: 'momentum_agent', optimal: 3.84, extended: 0.15 },
    { agent: 'mean_reversion_agent', optimal: 3.89, extended: 0.07 },
    { agent: 'adaptive_agent', optimal: 4.30, extended: 0.10 }
  ];

  // Episode validation study results for comprehensive chart
  const episodeValidationData = [
    { episodes: 50, meanPerformance: -0.79, status: "Poor" },
    { episodes: 100, meanPerformance: -0.92, status: "Worse" },
    { episodes: 150, meanPerformance: -0.36, status: "OPTIMAL" },
    { episodes: 200, meanPerformance: -0.61, status: "Declining" },
    { episodes: 300, meanPerformance: -0.45, status: "Overfitting" },
    { episodes: 500, meanPerformance: -0.17, status: "Good" },
    { episodes: 750, meanPerformance: -0.22, status: "Degrading" },
    { episodes: 1000, meanPerformance: -0.20, status: "Overfitted" }
  ];

  const steps: JourneyStep[] = [
    {
      id: 'title',
      title: 'The Thinking Market',
      subtitle: 'Multi-Agent Reinforcement Learning in Financial Markets',
      icon: <Presentation className="h-8 w-8" />,
      color: 'from-indigo-600 to-purple-700',
      content: (
        <div className="space-y-8 text-center">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
            <Brain className="h-16 w-16 text-indigo-600" />
          </div>
          
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                The Thinking Market
              </h1>
              <h2 className="text-xl md:text-2xl text-gray-600 mb-6">
                Multi-Agent Reinforcement Learning in Financial Markets
              </h2>
              <div className="text-lg text-gray-700 font-medium">
                by <span className="text-indigo-600 font-semibold">Abdullah Faheem</span>
              </div>
            </div>
            
            <div className="max-w-3xl mx-auto text-gray-600 text-lg leading-relaxed">
              <p className="mb-4">
                An investigation into how artificial intelligence agents learn, adapt, and interact 
                in complex financial markets, revealing both opportunities and systemic risks.
              </p>
              <p>
                This research explores the emergent behaviors of reinforcement learning agents 
                and their profound impact on market stability, liquidity, and volatility.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-blue-900 mb-2">AI-Driven Trading</h3>
                <p className="text-blue-700 text-sm">
                  Reinforcement learning agents that adapt and evolve their trading strategies
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <Activity className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-purple-900 mb-2">Market Dynamics</h3>
                <p className="text-purple-700 text-sm">
                  Real-time simulation of complex multi-agent market interactions
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-900 mb-2">Systemic Impact</h3>
                <p className="text-green-700 text-sm">
                  Understanding how AI agents affect market stability and risk
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3">Research Overview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">3</div>
                  <div className="text-indigo-800">Research Hypotheses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">12</div>
                  <div className="text-purple-800">Market Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">100</div>
                  <div className="text-blue-800">Training Iterations</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">500</div>
                  <div className="text-green-800">Steps per Episode</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'welcome',
      title: 'Multi-Agent RL Trading Research',
      subtitle: 'Investigating the systemic impact of AI agents on financial market stability',
      icon: <BookOpen className="h-8 w-8" />,
      color: 'from-blue-500 to-purple-600',
      content: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
            <Brain className="h-12 w-12 text-blue-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Ray-RLlib Multi-Agent Market Simulation
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We developed a comprehensive market simulation using Ray-RLlib to investigate how 
              reinforcement learning agents impact market dynamics. Our research addresses critical 
              questions about volatility, liquidity, and herding behavior in AI-driven markets.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">12</div>
                <div className="text-sm text-gray-600">Total Agents</div>
                <div className="text-xs text-gray-500">3 RL + 9 Traditional</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">3</div>
                <div className="text-sm text-gray-600">Research Hypotheses</div>
                <div className="text-xs text-gray-500">Systematically tested</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">100</div>
                <div className="text-sm text-gray-600">Training Iterations</div>
                <div className="text-xs text-gray-500">PPO algorithm</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">500</div>
                <div className="text-sm text-gray-600">Steps per Episode</div>
                <div className="text-xs text-gray-500">Extended sessions</div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Research Framework</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800"><strong>Multi-Agent Environment:</strong> Realistic order matching engine</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800"><strong>RL Architecture:</strong> PPO with 512-256-128 networks</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800"><strong>Market Structure:</strong> Continuous trading with real spreads</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800"><strong>Statistical Rigor:</strong> Comprehensive hypothesis testing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'agents',
      title: 'Research Methodology & Agent Architecture',
      subtitle: 'Understanding our systematic approach to multi-agent market simulation',
      icon: <Brain className="h-8 w-8" />,
      color: 'from-green-500 to-blue-600',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Comprehensive Multi-Agent Trading Environment
            </h3>
            <p className="text-gray-600">
              Our Ray-RLlib system combines 3 learning agents with 9 traditional traders in a realistic market
            </p>
          </div>

          {/* Agent Architecture Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  RL Agents (3)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Algorithm:</span>
                    <span className="text-sm text-green-700">Proximal Policy Optimization (PPO)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Network:</span>
                    <span className="text-sm text-green-700">512-256-128 layers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Learning Rate:</span>
                    <span className="text-sm text-green-700">5e-5 (optimized)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Training Iterations:</span>
                    <span className="text-sm text-green-700">100 iterations</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <div className="text-xs text-green-600">
                    <strong>Strategies:</strong> Momentum, Mean Reversion, Adaptive
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Traditional Agents (9)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Market Makers:</span>
                    <span className="text-blue-700">2 agents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Fundamental Traders:</span>
                    <span className="text-blue-700">2 agents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Noise Traders:</span>
                    <span className="text-blue-700">3 agents</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Momentum Traders:</span>
                    <span className="text-blue-700">2 agents</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <div className="text-xs text-blue-600">
                    <strong>Purpose:</strong> Baseline comparison and realistic market dynamics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Market Environment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Market Environment Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800">Observation Space (15D)</h5>
                  <ul className="text-sm space-y-1">
                    <li>• Current price & fundamental value</li>
                    <li>• Market volatility & spread</li>
                    <li>• Order book imbalance</li>
                    <li>• Recent returns (5-period)</li>
                    <li>• Agent inventory & cash</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800">Action Space</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>BUY:</strong> Purchase 5 shares</li>
                    <li>• <strong>SELL:</strong> Sell 5 shares</li>
                    <li>• <strong>HOLD:</strong> No action</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800">Reward Structure</h5>
                  <ul className="text-sm space-y-1">
                    <li>• PnL improvement (primary)</li>
                    <li>• Trading activity bonus</li>
                    <li>• Inventory penalty</li>
                    <li>• Risk-adjusted returns</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Training Results Summary */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-green-600" />
                <span>Training Results Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">100</div>
                  <div className="text-sm text-green-800">Training Iterations</div>
                  <div className="text-xs text-gray-600 mt-1">Convergence achieved</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">511%</div>
                  <div className="text-sm text-blue-800">Performance Improvement</div>
                  <div className="text-xs text-gray-600 mt-1">From start to finish</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">110.2</div>
                  <div className="text-sm text-purple-800">Avg Trades/Episode</div>
                  <div className="text-xs text-gray-600 mt-1">Active trading behavior</div>
                </div>
              </div>
              
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Training Success:</strong> All RL agents successfully learned profitable trading strategies 
                  through 100 iterations, demonstrating consistent convergence and performance improvement.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Research Hypotheses Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Three Research Hypotheses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="font-medium text-red-800">H1: Volatility Amplification</div>
                  <div className="text-sm text-red-600">Do RL agents amplify market volatility?</div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-800">H2: Liquidity Impact</div>
                  <div className="text-sm text-blue-600">Do RL agents reduce liquidity during stress?</div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="font-medium text-purple-800">H3: Herding Behavior</div>
                  <div className="text-sm text-purple-600">Do multiple RL agents exhibit herding?</div>
                </div>
              </div>
              <Alert className="mt-4 bg-gray-50 border-gray-200">
                <Activity className="h-4 w-4 text-gray-600" />
                <AlertDescription className="text-gray-800">
                  <strong>Systematic Testing:</strong> Each hypothesis was rigorously tested using statistical 
                  methods with confidence intervals, p-values, and comprehensive validation across multiple episodes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* System Architecture */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">System Architecture Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800">Backend Components</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>Ray-RLlib:</strong> Multi-agent training framework</li>
                    <li>• <strong>FastAPI:</strong> 15+ endpoints for simulation control</li>
                    <li>• <strong>MultiAgentMarketEnv:</strong> Custom trading environment</li>
                    <li>• <strong>Order Matching Engine:</strong> Realistic market mechanics</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h5 className="font-semibold text-gray-800">Frontend Components</h5>
                  <ul className="text-sm space-y-1">
                    <li>• <strong>React + TypeScript:</strong> Type-safe UI components</li>
                    <li>• <strong>Recharts:</strong> Real-time data visualization</li>
                    <li>• <strong>Shadcn/ui:</strong> Modern component library</li>
                    <li>• <strong>TanStack Query:</strong> Efficient data fetching</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'hypothesis1',
      title: 'Hypothesis 1: Volatility Amplification',
      subtitle: 'Do RL agents amplify market volatility during stress periods?',
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'from-red-500 to-orange-600',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-800">HYPOTHESIS CONFIRMED</span>
            </div>
            <p className="text-gray-600 mt-2">
              "RL agents amplify market volatility through feedback loops"
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volatility Amplification Factor</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={amplificationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-2">
                  RL agents amplify volatility by 2.47x baseline levels during stress periods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Volatility Across Market Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={volatilityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="rl" stroke="#ef4444" strokeWidth={2} name="RL Agents" />
                    <Line type="monotone" dataKey="traditional" stroke="#3b82f6" strokeWidth={2} name="Traditional" />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-2">
                  Volatility increases significantly with RL agents, especially during crisis events.
                </p>
              </CardContent>
            </Card>
          </div>

          <Alert className="bg-red-50 border-red-200">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Key Finding:</strong> RL agents create feedback loops that amplify market volatility 
              by 2.47x baseline levels, with the effect becoming more pronounced during market stress periods.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">2.47x</div>
              <div className="text-sm text-red-800">Amplification Factor</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">89%</div>
              <div className="text-sm text-orange-800">Crisis Volatility Increase</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">High</div>
              <div className="text-sm text-yellow-800">Confidence Level</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'hypothesis2',
      title: 'Hypothesis 2: Liquidity Impact',
      subtitle: 'Do RL agents reduce market liquidity during stress periods?',
      icon: <Activity className="h-8 w-8" />,
      color: 'from-blue-500 to-cyan-600',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-800">HYPOTHESIS CONFIRMED</span>
            </div>
            <p className="text-gray-600 mt-2">
              "RL agents reduce market liquidity during stress periods"
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Liquidity Impact During Market Stress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={liquidityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="liquidity" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-2">
                Liquidity drops by 44% when RL agents are present during market stress periods.
              </p>
            </CardContent>
          </Card>

          <Alert className="bg-blue-50 border-blue-200">
            <Activity className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Critical Impact:</strong> RL agents significantly reduce market liquidity during stress, 
              dropping from 100% to 56% - a 44% reduction that can exacerbate market instability.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">44%</div>
              <div className="text-sm text-red-800">Liquidity Reduction</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">56%</div>
              <div className="text-sm text-blue-800">Minimum Liquidity</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">High</div>
              <div className="text-sm text-green-800">Statistical Confidence</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'hypothesis3',
      title: 'Hypothesis 3: Herding Behavior',
      subtitle: 'Do multiple RL agents exhibit herding behavior?',
      icon: <Users className="h-8 w-8" />,
      color: 'from-purple-500 to-indigo-600',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold text-green-800">HYPOTHESIS CONFIRMED</span>
            </div>
            <p className="text-gray-600 mt-2">
              "Multiple RL agents exhibit herding behavior"
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Herding Behavior Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={herdingData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" fontSize={10} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8b5cf6" />
                    <Bar dataKey="threshold" fill="#e5e7eb" opacity={0.5} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-sm text-gray-600 mt-2">
                  Moderate herding with 0.404 correlation between RL agents during stress periods.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Coordination Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0.404</div>
                    <div className="text-sm text-purple-800">Agent Correlation</div>
                  </div>
                  <div className="text-center p-3 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">0.67</div>
                    <div className="text-sm text-indigo-800">Synchronization Index</div>
                  </div>
                </div>
                <Alert className="bg-purple-50 border-purple-200">
                  <Users className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>Moderate Herding:</strong> RL agents show significant correlation (0.404) 
                    and synchronization (0.67), indicating coordinated behavior that can amplify market movements.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">0.404</div>
              <div className="text-sm text-purple-800">Correlation Coefficient</div>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">67%</div>
              <div className="text-sm text-indigo-800">Synchronization Level</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">Moderate</div>
              <div className="text-sm text-blue-800">Herding Strength</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'implications',
      title: 'Research Implications',
      subtitle: 'What this means for the future of AI in finance',
      icon: <Target className="h-8 w-8" />,
      color: 'from-purple-500 to-pink-600',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Comprehensive Research Findings Reveal Significant Market Impact
            </h3>
            <p className="text-gray-600">
              Our four-hypothesis study confirms that RL agents significantly impact market dynamics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-green-800">H1: CONFIRMED</div>
              <div className="text-sm text-green-600">2.47x Volatility Amplification</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-green-800">H2: CONFIRMED</div>
              <div className="text-sm text-green-600">44% Liquidity Reduction</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="font-semibold text-green-800">H3: CONFIRMED</div>
              <div className="text-sm text-green-600">0.404 Correlation</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Risk Implications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                  <span>Volatility amplification during stress periods</span>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                  <span>Liquidity withdrawal when most needed</span>
                </div>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                  <span>Coordinated behavior amplifying market movements</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Positive Aspects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Rapid adaptation to changing conditions</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Enhanced market efficiency through learning</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
                  <span>Sophisticated strategy development</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Regulatory Implications:</strong> These findings suggest the need for enhanced 
              monitoring and potential regulation of RL trading systems to mitigate systemic risks 
              while preserving their beneficial aspects.
            </AlertDescription>
          </Alert>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-900 mb-3">Key Research Insights</h4>
            <ul className="space-y-2 text-purple-800 text-sm">
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600" />
                <span>RL agents significantly amplify market volatility (2.47x baseline)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600" />
                <span>Liquidity provision deteriorates during stress (44% reduction)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600" />
                <span>Agent coordination creates systemic risk through herding</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-purple-600" />
                <span>Training methodology (150 episodes) is critical for performance</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'complete',
      title: 'Ready to Explore!',
      subtitle: 'Now you can access the full simulation platform',
      icon: <Award className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-600',
      content: (
        <div className="space-y-6 text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
            <Award className="h-12 w-12 text-green-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900">
              Congratulations! 🎉
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              You've completed the research journey and discovered how RL agents 
              significantly impact financial markets through volatility amplification, 
              liquidity reduction, and herding behavior. Now explore 
              the full simulation platform to run your own experiments.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="text-center">
                <div className="text-3xl">🧠</div>
                <div className="text-sm text-gray-600">Train RL Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl">📊</div>
                <div className="text-sm text-gray-600">Run Simulations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl">🔬</div>
                <div className="text-sm text-gray-600">Test Hypotheses</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        setIsAnimating(false);
        
        // Scroll to top for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
        
        // Scroll to top for better UX
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 300);
    }
  };

  const handleComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setIsCompleting(true);
    
    // Add a small celebration delay
    setTimeout(() => {
      onComplete();
    }, 1000);
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Auto-update market state
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' && currentStep < steps.length - 1) {
        nextStep();
      } else if (event.key === 'ArrowLeft' && currentStep > 0) {
        prevStep();
      } else if (event.key === 'Enter' && currentStep === steps.length - 1) {
        handleComplete();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              The Thinking Market - Research Journey
            </h1>
            <Badge variant="outline" className="text-sm">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Research Overview</span>
            <span>Live Simulation Access</span>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              💡 Use arrow keys to navigate • Enter to complete
            </span>
          </div>
        </div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8 overflow-hidden">
              {/* Step Header */}
              <div className={`bg-gradient-to-r ${currentStepData.color} p-6 text-white`}>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    {currentStepData.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                    <p className="text-white/90 mt-1">{currentStepData.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Step Content */}
              <CardContent className="p-8">
                {currentStepData.content}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 0}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-500'
                    : completedSteps.has(index)
                    ? 'bg-green-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={isCompleting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Launching Simulation...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Start Simulation</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchJourney; 