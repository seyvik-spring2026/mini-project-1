'use client';

import { useState } from 'react';

interface FormData {
  rawStory: string;
  customerCompany: string;
  customerIndustry: string;
  contactNameRole: string;
  coreProblem: string;
  keyResults: string;
  prospectName: string;
  prospectCompany: string;
  prospectRole: string;
  prospectPainPoint: string;
}

interface GeneratedContent {
  quotes: string;
  caseStudy: string;
  linkedIn: string;
  twitter: string;
  videoScript: string;
  outboundEmail: string;
}

const INITIAL_FORM: FormData = {
  rawStory: '',
  customerCompany: '',
  customerIndustry: '',
  contactNameRole: '',
  coreProblem: '',
  keyResults: '',
  prospectName: '',
  prospectCompany: '',
  prospectRole: '',
  prospectPainPoint: '',
};

const TABS = [
  { id: 'quotes' as keyof GeneratedContent, label: 'Key Quotes', icon: '✦' },
  { id: 'caseStudy' as keyof GeneratedContent, label: 'Case Study', icon: '📄' },
  { id: 'linkedIn' as keyof GeneratedContent, label: 'LinkedIn', icon: '💼' },
  { id: 'twitter' as keyof GeneratedContent, label: 'Twitter / X', icon: '𝕏' },
  { id: 'videoScript' as keyof GeneratedContent, label: 'Video Script', icon: '🎬' },
  { id: 'outboundEmail' as keyof GeneratedContent, label: 'Outbound Email', icon: '✉️' },
];

function InputField({
  label,
  required,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
        {required && <span className="text-amber-500 ml-1">*</span>}
      </label>
      {hint && <p className="text-slate-500 text-xs mb-2">{hint}</p>}
      <input
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm"
      />
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Partial<GeneratedContent> | null>(null);
  const [activeTab, setActiveTab] = useState<keyof GeneratedContent>('quotes');
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setField = (field: keyof FormData) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed. Please try again.');
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as { type: string; content: string };

          if (chunk.type === 'error') {
            throw new Error(chunk.content);
          }

          const key = chunk.type as keyof GeneratedContent;
          setResults(prev => ({ ...(prev ?? {}), [key]: chunk.content }));

          if (chunk.type === 'quotes') {
            setActiveTab('quotes');
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAll = () => {
    if (!results) return;
    const allContent = TABS
      .filter(tab => results[tab.id])
      .map(tab => `${'='.repeat(60)}\n${tab.label.toUpperCase()}\n${'='.repeat(60)}\n\n${results[tab.id]}`)
      .join('\n\n\n');
    copyToClipboard(allContent, 'all');
  };

  const downloadAll = () => {
    if (!results) return;
    const allContent = [
      `STORYENGINE — ${form.customerCompany} Content Suite`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      ...TABS
        .filter(tab => results[tab.id])
        .map(tab => `${'='.repeat(60)}\n${tab.label.toUpperCase()}\n${'='.repeat(60)}\n\n${results[tab.id]}`),
    ].join('\n\n\n');

    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyengine-${form.customerCompany.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setResults(null);
    setForm(INITIAL_FORM);
  };

  const readyCount = results ? Object.keys(results).length : 0;
  const allDone = readyCount === TABS.length;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 no-print">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-slate-950 font-black text-xs tracking-tighter">SE</span>
            </div>
            <span className="font-bold text-xl tracking-tight">StoryEngine</span>
          </div>
          <p className="text-slate-500 text-sm hidden sm:block">One win → Full content suite</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 w-full flex-1">
        {!results ? (
          /* ─── FORM ─── */
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Turn every customer win into a{' '}
                <span className="text-amber-500">content engine</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Paste your raw success story. Get a full content suite — case study, LinkedIn posts, Twitter thread, video script, and outbound emails — in under 30 seconds.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Required Fields */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
                  <h2 className="text-lg font-semibold">Your Success Story</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Raw Success Story Material <span className="text-amber-500">*</span>
                  </label>
                  <p className="text-slate-500 text-xs mb-2">
                    Paste anything — call transcripts, Slack messages, bullet points, email threads. The messier the better.
                  </p>
                  <textarea
                    required
                    value={form.rawStory}
                    onChange={e => setField('rawStory')(e.target.value)}
                    rows={10}
                    placeholder="Paste your raw customer story material here..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors text-sm resize-y leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="Customer Company Name"
                    required
                    value={form.customerCompany}
                    onChange={setField('customerCompany')}
                    placeholder="Acme Corp"
                  />
                  <InputField
                    label="Customer Industry"
                    required
                    value={form.customerIndustry}
                    onChange={setField('customerIndustry')}
                    placeholder="B2B SaaS / Fintech / Healthcare..."
                  />
                  <InputField
                    label="Customer Contact Name & Role"
                    required
                    value={form.contactNameRole}
                    onChange={setField('contactNameRole')}
                    placeholder="Jane Doe, VP of Operations"
                  />
                  <InputField
                    label="Core Problem (Before)"
                    required
                    value={form.coreProblem}
                    onChange={setField('coreProblem')}
                    placeholder="Manual reporting taking 3 days per week"
                  />
                </div>

                <InputField
                  label="Key Results Achieved"
                  required
                  value={form.keyResults}
                  onChange={setField('keyResults')}
                  placeholder="43% increase in sales velocity; onboarding cut from 3 weeks to 2 days"
                />
              </div>

              {/* Optional Fields */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
                  <div>
                    <h2 className="text-lg font-semibold">
                      Outbound Email Targeting
                      <span className="text-xs font-normal text-slate-500 ml-2">(optional)</span>
                    </h2>
                    <p className="text-slate-500 text-sm">Add prospect details to generate a personalized email sequence.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <InputField
                    label="Prospect Name"
                    value={form.prospectName}
                    onChange={setField('prospectName')}
                    placeholder="John Smith"
                  />
                  <InputField
                    label="Prospect Company"
                    value={form.prospectCompany}
                    onChange={setField('prospectCompany')}
                    placeholder="TechStartup Inc"
                  />
                  <InputField
                    label="Prospect Role"
                    value={form.prospectRole}
                    onChange={setField('prospectRole')}
                    placeholder="Head of Sales"
                  />
                  <InputField
                    label="Prospect Pain Point"
                    value={form.prospectPainPoint}
                    onChange={setField('prospectPainPoint')}
                    placeholder="Slow sales cycles, manual reporting"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-4 px-8 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Content Suite →
              </button>
            </form>
          </>
        ) : (
          /* ─── RESULTS ─── */
          <div>
            {/* Results Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 no-print">
              <div>
                <h2 className="text-2xl font-bold">
                  {form.customerCompany} — Content Suite
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {allDone ? '6 formats ready to use' : `${readyCount} of 6 formats ready — generating remaining…`}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={copyAll}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl transition-colors font-medium"
                >
                  {copied === 'all' ? '✓ Copied!' : '📋 Copy All'}
                </button>
                <button
                  onClick={downloadAll}
                  className="flex items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 rounded-xl transition-colors font-medium"
                >
                  ⬇ Download .txt
                </button>
                <button
                  onClick={handleReset}
                  className="text-slate-400 hover:text-white text-sm transition-colors px-2 py-2"
                >
                  ← Start over
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 no-print">
              {TABS.map(tab => {
                const isReady = !!results[tab.id];
                const isPending = loading && !isReady;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-950'
                        : isPending
                        ? 'bg-slate-800/50 text-slate-500'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-xs">{tab.icon}</span>
                    {tab.label}
                    {isPending && (
                      <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Content */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 no-print">
              {results[activeTab] ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-lg">
                      {TABS.find(t => t.id === activeTab)?.label}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(results[activeTab]!, activeTab)}
                      className="text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {copied === activeTab ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap leading-relaxed text-sm font-mono">
                    {results[activeTab]}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-slate-400 text-sm">Generating {TABS.find(t => t.id === activeTab)?.label}…</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto no-print">
        <div className="max-w-5xl mx-auto px-6 py-4 text-center text-slate-600 text-xs">
          Built for Mudita Studios
        </div>
      </footer>

      {/* Loading Overlay — shown only before first section arrives */}
      {loading && !results && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-50 no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="font-bold text-lg mb-2">Building your content suite</h3>
            <p className="text-amber-400 text-sm font-medium mb-1">Extracting key quotes from your story…</p>
            <p className="text-slate-500 text-xs">This takes about 20–30 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
