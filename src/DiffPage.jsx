import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { generateAppleMusicSearchUrl } from './lib/appleMusic';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

function DiffPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDiffData();
  }, []);

  async function fetchDiffData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/charts/diff/latest`);
      if (!res.ok) throw new Error(`HTTP${res.status}`);
      const diff = await res.json();
      setData(diff);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto p-6">読み込み中...</div>;
  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">{error}</div>;
  if (!data) return <div className="max-w-4xl mx-auto p-6">データがありません</div>;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 flex-shrink-0 bg-surface-light dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">主要機能</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link to="/" className="group flex items-center px-3 py-3 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <span className="material-icons-round text-xl mr-3 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300">leaderboard</span>
            ホーム (最新ランキング)
          </Link>
          <Link to="/charts/diff" className="group flex items-center px-3 py-3 text-sm font-medium rounded-md bg-primary text-white shadow-sm">
            <span className="material-icons-round text-xl mr-3 opacity-90">compare_arrows</span>
            差分ページ (NEW/OUT)
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-surface-light dark:bg-surface-dark shadow-sm z-10">
          <div className="px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-icons-round text-primary">compare_arrows</span>
                  差分ページ (NEW/OUT)
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">比較対象：{data.latest_chart.chart_date} ←→ {data.previous_chart.chart_date}</p>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400 flex items-center gap-2">
                <span className="material-icons-round">trending_up</span>
                新規ランクイン曲 (NEW)
              </h2>
              {data.new_entries.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">該当する曲はありません</p>
              ) : (
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-green-50 dark:bg-green-900/20 border-b border-slate-200 dark:border-slate-700">
                          <th className="px-6 py-4 w-20 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rank</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Artist</th>
                          <th className="px-6 py-4 w-24 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {data.new_entries.map((song, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold mx-auto">
                                {song.rank}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{song.title}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 dark:text-slate-300">{song.artist}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                                title="検索"
                                onClick={() => window.open(generateAppleMusicSearchUrl(song), '_blank')}
                              >
                                <span className="material-icons-round text-lg">search</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400 flex items-center gap-2">
                <span className="material-icons-round">trending_down</span>
                ランク外れ曲 (OUT)
              </h2>
              {data.dropped_entries.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">該当する曲はありません</p>
              ) : (
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-red-50 dark:bg-red-900/20 border-b border-slate-200 dark:border-slate-700">
                          <th className="px-6 py-4 w-20 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rank</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</th>
                          <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Artist</th>
                          <th className="px-6 py-4 w-24 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {data.dropped_entries.map((song, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <td className="px-6 py-4 text-center">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold mx-auto">
                                {song.rank}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">{song.title}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-slate-600 dark:text-slate-300">{song.artist}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                className="p-2 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                                title="検索"
                                onClick={() => window.open(generateAppleMusicSearchUrl(song), '_blank')}
                              >
                                <span className="material-icons-round text-lg">search</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DiffPage;