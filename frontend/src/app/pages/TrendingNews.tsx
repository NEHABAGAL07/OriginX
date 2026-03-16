import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, Globe, ArrowUpRight, Clock3, RefreshCw } from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';
import { getTrendingNews, type TrendingNewsResponse } from '../services/api';

interface TrendingNewsItem {
  id: number;
  headline: string;
  source: string;
  region: string;
  category: string;
  published: string;
  momentum: string;
}

const COUNTRY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'global', label: 'Global (default)' },
  { value: 'us', label: 'United States' },
  { value: 'in', label: 'India' },
  { value: 'gb', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'ca', label: 'Canada' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'jp', label: 'Japan' },
  { value: 'sg', label: 'Singapore' },
];

const CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All Categories' },
  { value: 'business', label: 'Business' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'general', label: 'General' },
  { value: 'health', label: 'Health' },
  { value: 'science', label: 'Science' },
  { value: 'sports', label: 'Sports' },
  { value: 'technology', label: 'Technology' },
];

const TRENDING_COUNTRY_STORAGE_KEY = 'originx.trending.country';
const TRENDING_CATEGORY_STORAGE_KEY = 'originx.trending.category';
const GEOLOCATION_TIMEOUT_MS = 7000;
const REVERSE_GEOCODE_TIMEOUT_MS = 5000;

function detectCountryFromLocale(): string {
  const locales = [navigator.language, ...(navigator.languages || [])].filter(Boolean);
  for (const locale of locales) {
    const parts = locale.split('-');
    if (parts.length >= 2) {
      const country = parts[1].toLowerCase();
      if (country.length === 2 && /^[a-z]+$/.test(country)) {
        return country;
      }
    }
  }
  return 'us';
}

function formatCountryName(countryCode: string): string {
  const normalized = (countryCode || '').toLowerCase();
  const fromOptions = COUNTRY_OPTIONS.find((option) => option.value === normalized);
  if (fromOptions) {
    return fromOptions.label;
  }

  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
      const fullName = displayNames.of(normalized.toUpperCase());
      if (fullName) {
        return fullName;
      }
    }
  } catch {
    // Ignore formatting failures and fall through to code.
  }

  return normalized.toUpperCase() || 'US';
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is unavailable in this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: GEOLOCATION_TIMEOUT_MS,
      maximumAge: 30 * 60 * 1000,
    });
  });
}

async function detectCountryFromBrowserLocation(): Promise<string> {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);

    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
        { signal: controller.signal }
      );

      if (response.ok) {
        const payload = (await response.json()) as { countryCode?: string };
        const countryCode = (payload.countryCode || '').toLowerCase();
        if (countryCode.length === 2 && /^[a-z]+$/.test(countryCode)) {
          return countryCode;
        }
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  } catch {
    // Fall back gracefully if permission is denied or lookup fails.
  }

  return detectCountryFromLocale();
}

export function TrendingNews() {
  const { isDarkMode } = useDarkMode();
  const [currentTime, setCurrentTime] = useState(() =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date())
  );
  const [newsData, setNewsData] = useState<TrendingNewsResponse | null>(null);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedCountry, setSelectedCountry] = useState('global');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [detectedLocalCountry, setDetectedLocalCountry] = useState('us');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const detectedLocalCountryName = formatCountryName(detectedLocalCountry);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });

    const intervalId = window.setInterval(() => {
      setCurrentTime(formatter.format(new Date()));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const detected = await detectCountryFromBrowserLocation();
      if (isMounted) {
        setDetectedLocalCountry(detected);
      }
    })();

    const savedCountry = localStorage.getItem(TRENDING_COUNTRY_STORAGE_KEY);
    if (savedCountry && COUNTRY_OPTIONS.some((option) => option.value === savedCountry)) {
      setSelectedCountry(savedCountry);
    }

    const savedCategory = localStorage.getItem(TRENDING_CATEGORY_STORAGE_KEY);
    if (savedCategory && CATEGORY_OPTIONS.some((option) => option.value === savedCategory)) {
      setSelectedCategory(savedCategory);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(TRENDING_COUNTRY_STORAGE_KEY, selectedCountry);
  }, [selectedCountry]);

  useEffect(() => {
    localStorage.setItem(TRENDING_CATEGORY_STORAGE_KEY, selectedCategory);
  }, [selectedCategory]);

  const formatPublishedAgo = (publishedAt: string) => {
    const parsed = new Date(publishedAt);
    if (Number.isNaN(parsed.getTime())) return 'Recently published';

    const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const fetchLatestNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);

    try {
      const response = await getTrendingNews({
        limit: 30,
        country: selectedCountry,
        category: selectedCategory,
        local_country: selectedCountry === 'global' ? detectedLocalCountry : undefined,
      });
      setNewsData(response);
      setLastRefresh(new Date());
    } catch (error) {
      setNewsError(error instanceof Error ? error.message : 'Failed to load trending news.');
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (!detectedLocalCountry) return;

    setNewsData(null);

    void fetchLatestNews();

    const refreshEvery30Minutes = window.setInterval(() => {
      void fetchLatestNews();
    }, 30 * 60 * 1000);

    return () => window.clearInterval(refreshEvery30Minutes);
  }, [selectedCountry, selectedCategory, detectedLocalCountry]);

  const trendingNews: TrendingNewsItem[] = (newsData?.articles || []).map((article, index) => ({
    id: index + 1,
    headline: article.title,
    source: article.source,
    region: article.region,
    category: article.category,
    published: formatPublishedAgo(article.published_at),
    momentum: `+${Math.max(8, 28 - index * 2)}%`,
  }));

  const totalPages = Math.max(1, Math.ceil(trendingNews.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrendingNews = trendingNews.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCountry, selectedCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const metrics = [
    {
      label: 'News Tracked',
      value: String(newsData?.articles_found || trendingNews.length || 0),
      icon: Flame,
      color: '#F97316'
    },
    {
      label: 'Regions Active',
      value: String(new Set(trendingNews.map((item) => item.region)).size || 1),
      icon: Globe,
      color: '#22D3EE'
    },
    {
      label: 'Avg Update Time',
      value: '30m',
      icon: Clock3,
      color: '#3B82F6'
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                Trending News
              </h1>
              <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>
                Fast-moving stories tracked across trusted global sources.
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Global mode prioritizes headlines from your detected local country: {detectedLocalCountryName}.
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                Feed includes trusted publishers only for the selected region and category.
              </p>
            </div>

            <div className={`inline-flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              isDarkMode
                ? 'bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(30,41,59,0.85))] border-[#3B82F6]/20 shadow-[0_0_24px_rgba(34,211,238,0.12)]'
                : 'bg-white border-[#BFDBFE] shadow-sm'
            }`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] shadow-lg shadow-[#22D3EE]/20">
                <Clock3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.18em] ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}>
                  Real Time Feed
                </p>
                <p className={`text-2xl ${isDarkMode ? 'text-white' : 'text-[#0F172A]'}`}>{currentTime}</p>
                {lastRefresh && <p className="text-xs text-[#22D3EE] mt-1">Last refresh: {lastRefresh.toLocaleTimeString()}</p>}
              </div>
            </div>
          </div>

          <div className={`mb-6 rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E2E8F0]'}`}>
            <div className="mb-4 flex items-center justify-end">
              <button
                onClick={() => {
                  void fetchLatestNews();
                }}
                disabled={isLoadingNews}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  isLoadingNews
                    ? isDarkMode
                      ? 'border-[#334155] bg-[#0F172A] text-[#64748B] cursor-not-allowed'
                      : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] cursor-not-allowed'
                    : isDarkMode
                      ? 'border-[#3B82F6]/35 bg-[#0F172A] text-[#93C5FD] hover:border-[#22D3EE] hover:text-[#22D3EE]'
                      : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8] hover:border-[#22D3EE] hover:text-[#0891B2]'
                }`}
                title="Refresh trending feed"
                aria-label="Refresh trending feed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingNews ? 'animate-spin' : ''}`} />
                <span>{isLoadingNews ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="trending-country"
                  className={`block text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}
                >
                  Country Scope
                </label>
                <select
                  id="trending-country"
                  title="Select country scope"
                  value={selectedCountry}
                  onChange={(event) => setSelectedCountry(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:border-[#22D3EE]'
                      : 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#22D3EE]'
                  }`}
                >
                  {COUNTRY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="trending-category"
                  className={`block text-xs uppercase tracking-[0.18em] mb-2 ${isDarkMode ? 'text-[#64748B]' : 'text-[#94A3B8]'}`}
                >
                  Category Filter
                </label>
                <select
                  id="trending-category"
                  title="Select news category"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition-all ${
                    isDarkMode
                      ? 'bg-[#0F172A] border-[#334155] text-white focus:border-[#22D3EE]'
                      : 'bg-white border-[#CBD5E1] text-[#0F172A] focus:border-[#22D3EE]'
                  }`}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {newsError && (
            <div className="mb-6 rounded-2xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {newsError}
            </div>
          )}

          {!!newsData && (
            <div className={`mb-6 rounded-2xl border p-4 text-sm ${isDarkMode ? 'bg-[#1F2937] border-[#374151] text-[#9CA3AF]' : 'bg-white border-[#E2E8F0] text-[#64748B]'}`}>
              Trusted-source filtering active: {newsData.articles_found} stories loaded, {newsData.skipped_untrusted_count} non-trusted stories skipped.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {isLoadingNews && !newsData
              ? Array.from({ length: 3 }, (_, skIndex) => (
                  <div
                    key={skIndex}
                    className={`rounded-2xl border p-6 animate-pulse ${
                      isDarkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`h-4 w-28 rounded-lg ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                      <div className={`w-12 h-12 rounded-xl ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                    </div>
                    <div className={`h-9 w-14 rounded-lg ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                  </div>
                ))
              : metrics.map((metric, index) => {
                  const Icon = metric.icon;

                  return (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.08 }}
                      className={`rounded-2xl border p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 relative overflow-hidden group cursor-pointer ${
                        isDarkMode
                          ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5 hover:shadow-[#3B82F6]/20'
                          : 'bg-white border-[#E2E8F0] shadow-sm hover:shadow-md'
                      }`}
                    >
                      {isDarkMode && (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      )}

                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <p className={isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}>{metric.label}</p>
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isDarkMode ? 'shadow-lg' : ''}`}
                            style={{
                              backgroundColor: `${metric.color}15`,
                              boxShadow: isDarkMode ? `0 0 20px ${metric.color}40` : 'none'
                            }}
                          >
                            <Icon className="w-6 h-6" style={{ color: metric.color }} />
                          </div>
                        </div>

                        <p className={`text-3xl font-bold ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>{metric.value}</p>
                      </div>
                    </motion.div>
                  );
                })
            }
          </div>

          <div className="space-y-4">
            {isLoadingNews && !trendingNews.length && (
              <>
                {Array.from({ length: 8 }, (_, skIndex) => (
                  <div
                    key={skIndex}
                    className={`rounded-2xl border p-5 animate-pulse ${
                      isDarkMode ? 'bg-[#1F2937] border-[#374151]' : 'bg-white border-[#E2E8F0]'
                    }`}
                  >
                    {/* headline line */}
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div className="flex-1 space-y-2">
                        <div className={`h-5 w-full rounded-lg ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                        <div className={`h-5 w-3/4 rounded-lg ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                      </div>
                      <div className={`h-5 w-14 rounded-lg ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`} />
                    </div>
                    {/* tag pills */}
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 4 }, (__, tIndex) => (
                        <div
                          key={tIndex}
                          className={`h-7 rounded-full ${
                            tIndex === 0 ? 'w-16' : tIndex === 1 ? 'w-10' : tIndex === 2 ? 'w-20' : 'w-24'
                          } ${isDarkMode ? 'bg-[#374151]' : 'bg-[#E2E8F0]'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}

            {!isLoadingNews && !trendingNews.length && !newsError && (
              <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-[#1F2937] border-[#374151] text-[#9CA3AF]' : 'bg-white border-[#E2E8F0] text-[#64748B]'}`}>
                No trending stories were returned for the selected region.
              </div>
            )}

            {paginatedTrendingNews.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`rounded-2xl border p-5 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 ${
                  isDarkMode
                    ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]/40 hover:shadow-lg hover:shadow-[#3B82F6]/10'
                    : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6]/40 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                  <h2 className={`text-lg font-semibold flex-1 ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>
                    {item.headline}
                  </h2>
                  <div className="flex items-center gap-2 text-[#22C55E] font-semibold">
                    <span>{item.momentum}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.source}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.region}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.category}
                  </span>
                  <span className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? 'bg-[#0F172A] text-[#94A3B8]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                    {item.published}
                  </span>
                </div>
              </motion.div>
            ))}

            {trendingNews.length > 0 && (
              <div className="mt-6 flex items-center justify-between">
                <p className={`text-sm ${isDarkMode ? 'text-[#94A3B8]' : 'text-[#64748B]'}`}>
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, trendingNews.length)} of {trendingNews.length} stories
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      currentPage === 1
                        ? isDarkMode
                          ? 'border-[#374151] text-[#6B7280] bg-[#111827] cursor-not-allowed'
                          : 'border-[#E2E8F0] text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed'
                        : isDarkMode
                          ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                          : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === currentPage;

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? 'bg-[#3B82F6] text-white hover:bg-[#2563EB]'
                            : isDarkMode
                              ? 'border border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                              : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 border rounded-lg text-sm transition-colors ${
                      currentPage === totalPages
                        ? isDarkMode
                          ? 'border-[#374151] text-[#6B7280] bg-[#111827] cursor-not-allowed'
                          : 'border-[#E2E8F0] text-[#94A3B8] bg-[#F8FAFC] cursor-not-allowed'
                        : isDarkMode
                          ? 'border-[#334155] text-[#94A3B8] hover:bg-[#1E293B]'
                          : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}