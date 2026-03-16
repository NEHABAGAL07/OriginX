import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  SearchCheck,
  Link2,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Lock,
  Radar,
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { CredibilityGauge } from '../components/CredibilityGauge';
import { useDarkMode } from '../components/DarkModeContext';
import {
  analyzeDomainSecurity,
  analyzeRedditPropagation,
  type DomainSecurityResult,
} from '../services/api';

interface ProgressStep {
  id: string;
  label: string;
}

interface TrustedArticle {
  title: string;
  source: string;
  url: string;
  similarity: number;
}

function Counter({ value, suffix = '', duration = 1100 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const start = performance.now();

    const update = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplay(value * progress);
      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [duration, value]);

  return <>{Math.round(display)}{suffix}</>;
}

export function UrlInvestigation() {
  const { isDarkMode } = useDarkMode();
  const [url, setUrl] = useState('https://example-news.net/world/breaking-government-bans-all-petrol-cars');
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [showResults, setShowResults] = useState(true);
  const [domainResult, setDomainResult] = useState<DomainSecurityResult | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!isInvestigating) return;

    setShowResults(false);

    const timeout = window.setTimeout(() => {
      setIsInvestigating(false);
      setShowResults(true);
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [isInvestigating]);

  const runInvestigation = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setInvestigationError('Please enter a valid URL before starting investigation.');
      return;
    }

    setInvestigationError(null);

    try {
      const domainResponse = await analyzeDomainSecurity({ url: trimmedUrl });

      setDomainResult(domainResponse.results[0] || null);
      setLastUpdated(new Date());
    } catch (error) {
      setInvestigationError(error instanceof Error ? error.message : 'Failed to connect to backend services.');
    }
  };

  useEffect(() => {
    if (!showResults || isInvestigating) return;

    void runInvestigation();

    const interval = window.setInterval(() => {
      void runInvestigation();
    }, 30000);

    return () => window.clearInterval(interval);
  }, [showResults, isInvestigating, url]);

  const domainRisk = domainResult?.domain_risk || 'unknown';
  const investigationScore = domainRisk === 'high' ? 22 : domainRisk === 'medium' ? 45 : domainRisk === 'low' ? 78 : 60;

  const metricCards = [
    {
      icon: ShieldCheck,
      label: 'Verification Result',
      value: domainRisk === 'high' ? 'High Risk' : domainRisk === 'medium' ? 'Mixed' : domainRisk === 'low' ? 'Safer' : 'Unknown',
      accent: domainRisk === 'high' ? '#EF4444' : domainRisk === 'medium' ? '#F59E0B' : '#22C55E',
      note: domainResult?.reason || 'Awaiting backend domain analysis',
    },
    {
      icon: Globe,
      label: 'Domain',
      value: domainResult?.domain || 'Unknown',
      accent: '#22D3EE',
      note: 'Resolved from backend URL analysis',
    },
    {
      icon: Lock,
      label: 'Security Status',
      value: url.startsWith('https://') ? 'HTTPS' : 'HTTP',
      accent: url.startsWith('https://') ? '#22C55E' : '#F97316',
      note: url.startsWith('https://') ? 'Encrypted transport detected' : 'Unencrypted transport',
    },
    {
      icon: ShieldAlert,
      label: 'Narrative Spread Nodes',
      value: '--',
      accent: '#F97316',
      note: 'Temporarily hidden',
    },
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#22D3EE]/20 bg-[#22D3EE]/10 px-4 py-1.5 mb-4">
                <Radar className="w-4 h-4 text-[#22D3EE]" />
                <span className="text-sm text-[#22D3EE]">URL Investigation Mode</span>
              </div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                URL Investigation Mode
              </h1>
              <p className={isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}>
                Analyze the credibility of online news articles.
              </p>
            </div>
          </div>

          <div className={`rounded-[28px] border p-8 relative overflow-hidden ${
            isDarkMode
              ? 'bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92))] border-white/8 shadow-[0_30px_80px_rgba(2,6,23,0.46)]'
              : 'bg-white border-[#E2E8F0]'
          }`}>
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#3B82F6]/10 blur-3xl" />
            <div className="relative grid grid-cols-1 xl:grid-cols-[1.1fr,0.9fr] gap-8 items-center">
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] mb-3 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>URL Input Panel</p>
                <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#0F172A]/90 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <div className="relative">
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                    <input
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="Paste a news article URL to investigate"
                      className={`w-full rounded-2xl border pl-12 pr-4 py-4 outline-none transition-all ${
                        isDarkMode
                          ? 'bg-[#0B1120] border-[#334155] text-white placeholder:text-[#64748B] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                          : 'bg-white border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#22D3EE] focus:ring-2 focus:ring-[#22D3EE]/20'
                      }`}
                    />
                  </div>
                  <p className={`text-sm mt-3 ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                    Example: `https://example-news.net/world/breaking-government-bans-all-petrol-cars`
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 xl:items-end">
                <motion.button
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsInvestigating(true);
                    void runInvestigation();
                  }}
                  className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] px-8 py-4 text-white shadow-[0_18px_40px_rgba(34,211,238,0.24)]"
                >
                  <SearchCheck className="w-5 h-5" />
                  <span>Start Investigation</span>
                </motion.button>
                <div className={`rounded-2xl border px-4 py-3 ${isDarkMode ? 'bg-white/5 border-white/8' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                  <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Investigation State</p>
                  <p className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>{isInvestigating ? 'Running AI pipeline' : 'Ready for analysis'}</p>
                  {lastUpdated && <p className="text-xs text-[#22D3EE] mt-1">Live refresh: {lastUpdated.toLocaleTimeString()}</p>}
                </div>
              </div>
            </div>

            {investigationError && (
              <div className="mt-6 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
                {investigationError}
              </div>
            )}
          </div>

          {showResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-[0.95fr,1.05fr] gap-6">
                <div className={`rounded-2xl border p-6 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>Credibility Score</p>
                      <h2 className={isDarkMode ? 'text-white' : 'text-[#0F172A]'}>Shield Verification Meter</h2>
                    </div>
                    <div className="rounded-full border border-[#FBBF24]/30 bg-[#FBBF24]/10 px-3 py-1 text-sm text-[#FBBF24]">Unverified</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <CredibilityGauge score={investigationScore} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {metricCards.map((card) => {
                    const Icon = card.icon;

                    return (
                      <motion.div
                        key={card.label}
                        whileHover={{ y: -4 }}
                        className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#111827] border-white/8' : 'bg-white border-[#E2E8F0]'}`}
                        style={{ boxShadow: `0 0 24px ${card.accent}18` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className={`text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>{card.label}</p>
                            <p className={`text-3xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{card.value}</p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: `${card.accent}18` }}>
                            <Icon className="w-5 h-5" style={{ color: card.accent }} />
                          </div>
                        </div>
                        <p className={isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}>{card.note}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}