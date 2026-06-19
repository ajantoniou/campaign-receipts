export interface IntelAlert {
  id: string;
  marketId: string;
  timestamp: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  source: 'FEC_FILING' | 'NEWS_API' | 'KNOWLEDGE_GRAPH';
}

export const mockIntelAlerts: IntelAlert[] = [
  {
    id: 'intel_1',
    marketId: 'mkt_2',
    timestamp: new Date().toISOString(),
    severity: 'HIGH',
    message: 'Fable AI Detection: "Liberty First" PAC just filed an independent expenditure report for $1.2M. Model predicts 92% chance of exceeding $5M target by Q3.',
    source: 'FEC_FILING',
  },
  {
    id: 'intel_2',
    marketId: 'mkt_1',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    severity: 'MEDIUM',
    message: 'Knowledge Graph update: Senator X\'s top 5 donors from 2020 have shifted contributions to Challenger Z.',
    source: 'KNOWLEDGE_GRAPH',
  },
  {
    id: 'intel_3',
    marketId: 'mkt_4',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    severity: 'LOW',
    message: 'Sentiment analysis on recent press releases indicates low probability of campaign announcement today.',
    source: 'NEWS_API',
  }
];

/**
 * Simulates a stream of incoming intel alerts from the AI engine.
 */
export function subscribeToIntel(callback: (alert: IntelAlert) => void) {
  // Simulate an alert arriving after 5 seconds
  const timerId = setTimeout(() => {
    const newAlert: IntelAlert = {
      id: `intel_live_${Date.now()}`,
      marketId: 'mkt_1',
      timestamp: new Date().toISOString(),
      severity: 'HIGH',
      message: '🚨 LIVE FEC WIRE: An unreported $500k dark-money transfer just hit Senator X\'s allied super PAC. Market odds adjusting rapidly.',
      source: 'FEC_FILING',
    };
    callback(newAlert);
  }, 5000);

  return () => clearTimeout(timerId); // Cleanup
}
