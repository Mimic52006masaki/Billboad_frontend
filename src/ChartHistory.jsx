import { useEffect } from "react";
import { useState } from "react";
import { Link, useParams } from 'react-router-dom';
import { generateAppleMusicSearchUrl } from './lib/appleMusic';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

function ChartHistory() {
  const { chartDate } = useParams();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedSongs, setSelectedSongs] = useState(() => {
    const saved = localStorage.getItem('selectedSongs');
    return saved ? JSON.parse(saved) : [];
  });
  const [allSelected, setAllSelected] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, [chartDate]);

  useEffect(() => {
    localStorage.setItem('selectedSongs', JSON.stringify(selectedSongs));
  }, [selectedSongs]);

  async function fetchSongs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/songs?chart_date=${chartDate}`);
      if (!res.ok) throw new Error(`HTTP${res.status}`);
      const data = await res.json();
      setSongs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelected(rank) {
    setSelectedSongs(prev =>
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  }

  function searchSelected() {
    selectedSongs.forEach(rank => {
      const song = songs.find(s => s.rank === rank);
      if (song) window.open(generateAppleMusicSearchUrl(song), '_blank');
    });
  }

  function copyTable() {
    if (songs.length === 0) return;

    const header = ["Rank", "Title", "Artist", "Last Week"].join("\t") + "\n";
    const rows = songs.map(song =>
      [song.rank, song.title, song.artist, song.last_week ?? ""].join("\t") + "\n").join("");
    const text = rows;

    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("コピーに失敗:", err);
        setError("コピーに失敗しました");
      });
  };

  const toggleAllSelected = () => {
    if (allSelected) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(songs.map(s => s.rank));
    }
    setAllSelected(!allSelected);
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    if (rank === 2) return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';
    if (rank === 3) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
    return 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400';
  };

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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-icons-round text-primary">leaderboard</span>
                  Billboard Hot 100 - {chartDate}
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Weekly music chart rankings and insights</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                  onClick={fetchSongs}
                  disabled={loading}
                >
                  <span className="material-icons-round text-lg mr-2">replay</span>
                  {loading ? '読み込み中' : '再読み込み'}
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg shadow-sm transition-all"
                  onClick={copyTable}
                >
                  <span className="material-icons-round text-lg mr-2">content_copy</span>
                  表をコピー
                </button>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="px-6 py-4 w-16 text-center">
                      <label className="inline-flex items-center">
                        <input
                          className="form-checkbox h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary dark:border-slate-600 dark:bg-slate-700"
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleAllSelected}
                        />
                        <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">選択</span>
                      </label>
                    </th>
                    <th className="px-6 py-4 w-20 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Rank</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Title</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Artist</th>
                    <th className="px-6 py-4 w-24 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Last Week</th>
                    <th className="px-6 py-4 w-24 text-center text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {songs.length === 0 ? (
                    <tr><td className="px-6 py-4 text-center" colSpan="6">データがありません</td></tr>
                  ) : (
                    songs.map((song) => (
                      <tr key={`${song.rank}-${song.chart_date}`} className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <td className="px-6 py-4 text-center">
                          <input
                            checked={selectedSongs.includes(song.rank)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSelected(song.rank);
                            }}
                            className="form-checkbox h-5 w-5 text-primary border-slate-300 rounded focus:ring-primary dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-primary"
                            type="checkbox"
                            readOnly
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`flex items-center justify-center h-8 w-8 rounded-full ${getRankColor(song.rank)} font-bold mx-auto`}>
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
                          {song.last_week === 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                              NEW
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{song.last_week}</span>
                          )}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing <span className="font-medium text-slate-900 dark:text-white">1</span> to <span className="font-medium text-slate-900 dark:text-white">{songs.length}</span> of <span className="font-medium text-slate-900 dark:text-white">{songs.length}</span> entries
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ChartHistory