import { useEffect } from "react";
import { useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

function App() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSongs();
  }, []);

  async function fetchSongs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/songs`);
      if (!res.ok) throw new Error(`HTTP${res.status}`);
      const data = await res.json();
      setSongs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleScrape() {
    setScraping(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/scrapes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ async: false })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || res.statusText);
      }
      await fetchSongs();
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
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



  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Billboard Hot 100</h1>

      <div className="flex items-center gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleScrape}
          disabled={scraping}
        >
          {scraping ? 'スクレイピング中...' : '最新を取得'}
        </button>
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={fetchSongs}
          disabled={loading}
        >
          {loading ? '読み込み中' : '再読み込み'}
        </button>
        <button
        className="px-4 py-2 bg-green-500 text-white rounded"
        onClick={copyTable}
        disabled={songs.length === 0}
        >
          {copied ? 'コピーしました！' : '表をコピー'}
        </button>
        {error && <div className="text-red-600 ml-4">{error}</div>}
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Rank</th>
            <th className="p-2 border">Title</th>
            <th className="p-2 border">Artist</th>
            <th className="p-2 border">Last Week</th>
          </tr>
        </thead>
        <tbody>
          {songs.length === 0 ? (
            <tr><td className="p-2 border text-center" colSpan="4">データがありません</td></tr>
          ) : (
            songs.map((song) => (
              <tr key={`${song.rank}-${song.chart_date}`}>
                <td className="p-2 border text-center">{song.rank}</td>
                <td className="p-2 border">{song.title}</td>
                <td className="p-2 border">{song.artist}</td>
                <td className="p-2 border text-center">{song.last_week}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default App
