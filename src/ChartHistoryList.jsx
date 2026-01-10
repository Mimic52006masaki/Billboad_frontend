import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

function ChartHistoryList() {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCharts();
  }, []);

  async function fetchCharts() {
    setLoading(true);
    setError(null);
    try {
      // Note: We need to add an endpoint to get all chart dates
      // For now, we'll use a placeholder or fetch from existing data
      // Since we don't have a charts index endpoint, let's create one
      const res = await fetch(`${API_BASE}/charts/history`);
      if (!res.ok) throw new Error(`HTTP${res.status}`);
      const data = await res.json();
      setCharts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
          <Link to="/charts/diff" className="group flex items-center px-3 py-3 text-sm font-medium rounded-md text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
            <span className="material-icons-round text-xl mr-3 text-slate-400 group-hover:text-slate-500 dark:text-slate-500 dark:group-hover:text-slate-300">compare_arrows</span>
            差分ページ (NEW/OUT)
          </Link>
          <Link to="/history" className="group flex items-center px-3 py-3 text-sm font-medium rounded-md bg-primary text-white shadow-sm">
            <span className="material-icons-round text-xl mr-3 opacity-90">history</span>
            ランキング履歴
          </Link>
        </nav>
      </aside>
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-surface-light dark:bg-surface-dark shadow-sm z-10">
          <div className="px-8 py-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-icons-round text-primary">history</span>
              ランキング履歴
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">過去のBillboard Hot 100ランキングを閲覧できます</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">※ ランキング内容に変化があった日のみ表示されます</p>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="text-center">読み込み中...</div>
          ) : error ? (
            <div className="text-center text-red-600">{error}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {charts.map((chart) => (
                <Link
                  key={chart.chart_date}
                  to={`/charts/${chart.chart_date}`}
                  className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    {chart.chart_date}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Billboard Hot 100
                  </p>
                  <div className="mt-4 flex items-center text-primary">
                    <span className="material-icons-round text-lg mr-2">visibility</span>
                    閲覧する
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default ChartHistoryList