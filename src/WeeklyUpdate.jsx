import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { COMMANDS, extensionRequest, isExtensionContextInvalidated } from './lib/extensionBridge';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';
const labels = { pending: '未処理', candidate_ready: '候補確認済み', adding: '追加中', verified: '検証済み', held: '保留', mismatch: '不一致' };
const CONTEXT_RECOVERY_KEY = 'billboard-extension-context-recovery-attempted';
// Preflight results that mean the rank needs registering before it is reached.
const PREFLIGHT_FLAGS = ['needs_alias', 'ambiguous', 'not_found', 'error'];
// Extension errors raised before a destination playlist is clicked: Apple Music is unchanged.
const NO_ADD_ERROR_CODES = ['work_tab_missing', 'search_scope_unavailable', 'stale_candidate', 'add_menu_missing'];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error || `HTTP ${response.status}`), { data });
  return data;
}

function todayInTokyo() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export default function WeeklyUpdate() {
  const [environment, setEnvironment] = useState({ api: '確認中', extension: '確認中', appleMusic: '未確認' });
  const [run, setRun] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [searchTerm, setSearchTerm] = useState(null);
  const [targetCount, setTargetCount] = useState(60);
  const [targetInput, setTargetInput] = useState('60');
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const current = useMemo(() => run?.items?.find(item => item.rank === run.next_rank), [run]);

  useEffect(() => { checkEnvironment(); loadHistory(); loadSettings(); }, []);

  async function loadSettings() {
    try {
      const settings = await api('/settings');
      setTargetCount(settings.target_count);
      setTargetInput(String(settings.target_count));
    } catch { /* environment card reports API errors */ }
  }

  // The length is one app-wide setting, so saving it also resizes the run in
  // progress. The API refuses a length below what is already verified and
  // changes nothing in that case, so the input is put back as it was.
  async function saveTargetCount() {
    const count = Number(targetInput);
    if (!Number.isInteger(count) || count < 1 || count > 100) { setNotice('曲数は1〜100の整数で指定してください'); return; }
    setBusy(true); setNotice(null);
    try {
      const result = await api('/settings', { method: 'PATCH', body: JSON.stringify({ target_count: count }) });
      setTargetCount(result.target_count);
      if (run) setRun(await api(`/update_runs/${run.id}`));
      await loadHistory();
      setNotice(`完了とみなす曲数を${result.target_count}曲にしました`);
    } catch (error) {
      setTargetInput(String(targetCount));
      setNotice(error.data?.message || error.message);
    } finally { setBusy(false); }
  }

  async function loadHistory() {
    try { setHistory(await api('/update_runs')); } catch { /* environment card reports API errors */ }
  }

  async function deleteRun(entry) {
    if (busy) return;
    const summary = `${entry.playlist_name}（${entry.verified_prefix}/${entry.target_count} ・ ${entry.status}）`;
    if (!window.confirm(`実行履歴から削除します：\n${summary}\n\nApple Music のプレイリスト自体は削除されません。`)) return;
    setBusy(true); setNotice(null);
    try {
      await api(`/update_runs/${entry.id}`, { method: 'DELETE' });
      if (run?.id === entry.id) { setRun(null); setCandidate(null); }
      await loadHistory();
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  async function checkEnvironment() {
    setNotice(null);
    const next = { api: 'エラー', database: '未確認', chart: '未確認', extension: '未導入', appleMusic: '未確認' };
    try {
      const result = await api('/environment');
      next.api = result.api;
      next.database = result.database;
      next.chart = result.latest_chart?.song_count === 100 ? '100曲 OK' : `${result.latest_chart?.song_count || 0}曲`;
      next.runtime = result.runtime === 'docker' ? 'Docker起動中' : 'ローカル起動中';
    } catch (error) { setNotice(error.message); }
    try {
      const result = await extensionRequest(COMMANDS.CHECK_ENVIRONMENT, {}, 3000);
      next.extension = '接続済み';
      next.appleMusic = result.appleMusic?.loggedIn ? 'ログイン済み' : result.appleMusic?.available ? 'ログイン要確認' : '未接続';
    } catch (error) {
      // This happens when Chrome reloads the unpacked extension while this
      // updater tab is still open. It is safe to reload only here: no add has
      // been initiated, and sessionStorage prevents a recovery loop.
      if (isExtensionContextInvalidated(error) && !window.sessionStorage.getItem(CONTEXT_RECOVERY_KEY)) {
        window.sessionStorage.setItem(CONTEXT_RECOVERY_KEY, '1');
        window.location.reload();
        return;
      }
      if (isExtensionContextInvalidated(error)) setNotice('拡張機能の再接続に失敗しました。Chromeの拡張機能を再読み込み後、この画面も再読み込みしてください。');
      // Other extension failures remain fail-closed.
    }
    setEnvironment(next);
    if (next.api === 'ok') setNotice(null);
  }

  async function startOrResume() {
    setBusy(true); setNotice(null); setCandidate(null);
    try {
      const scraped = await api('/scrapes', { method: 'POST', body: JSON.stringify({ async: false }) });
      if (scraped.count !== 0 && scraped.count !== 100) throw Object.assign(new Error(`最新取得が${scraped.count}曲で停止しました`), { data: { count: scraped.count } });
      const created = await api('/update_runs', { method: 'POST', body: JSON.stringify({ target_date: todayInTokyo() }) });
      setRun(created);
      await loadHistory();
      setNotice('実プレイリストを検証してから開始してください');
    } catch (error) { setNotice(error.data?.count != null ? `最新チャートは${error.data.count}曲です。100曲必要です` : error.message); }
    finally { setBusy(false); }
  }

  async function persistItem(item, attributes) {
    await api(`/update_runs/${run.id}/items/${item.id}`, { method: 'PATCH', body: JSON.stringify(attributes) });
    const fresh = await api(`/update_runs/${run.id}`);
    setRun(fresh);
  }

  async function searchCurrent() {
    if (!current) return;
    setBusy(true); setNotice(null); setCandidate(null);
    try {
      const context = { runId: run.id, rank: current.rank, title: current.title, artist: current.artist, playlistName: run.playlist_name, pinnedUrl: current.pinned_apple_url || null };
      await extensionRequest(COMMANDS.OPEN_SEARCH, context);
      const result = await extensionRequest(COMMANDS.READ_CANDIDATES, context, 20000);
      if (result.matches.length !== 1) {
        await persistItem(current, { status: 'held', error_code: result.matches.length ? 'ambiguous_candidate' : 'candidate_missing', error_message: result.reason });
        setNotice(result.reason || '一意の通常版候補を確定できません');
        return;
      }
      setCandidate(result.matches[0]);
      setSearchTerm(result.searchTerm || null);
      await persistItem(current, { status: 'candidate_ready', apple_title: result.matches[0].title, apple_artist: result.matches[0].artist, apple_kind: result.matches[0].kind, apple_url: result.matches[0].url, match_result: 'exact' });
    } catch (error) {
      await persistItem(current, { status: 'held', error_code: error.code || 'ui_unavailable', error_message: error.message });
      setNotice(error.message);
    } finally { setBusy(false); }
  }

  async function addAndVerify() {
    if (!current || !candidate || busy) return;
    setBusy(true); setNotice(null);
    try {
      await persistItem(current, { status: 'adding', error_code: null, error_message: null });
      await extensionRequest(COMMANDS.ADD_CONFIRMED_TRACK, {
        runId: run.id, rank: current.rank, title: current.title, artist: current.artist, candidateId: candidate.id, candidateUrl: candidate.url, candidateTitle: candidate.title, candidateArtist: candidate.artist, searchTerm, playlistName: run.playlist_name, allowCreate: current.rank === 1,
      }, 45000);
      const verification = await extensionRequest(COMMANDS.VERIFY_PLAYLIST, {
        runId: run.id, rank: current.rank, playlistName: run.playlist_name, playlistUrl: run.playlist_url,
      }, 25000);
      const response = await api(`/update_runs/${run.id}/verify`, { method: 'POST', body: JSON.stringify(verification) });
      setRun(response.run); setCandidate(null);
      setNotice(response.verification.error_code ? response.verification.error_message : `${response.verification.verified_prefix}位まで検証済み`);
    } catch (error) {
      if (NO_ADD_ERROR_CODES.includes(error.code)) {
        // The extension raises these before any destination playlist is
        // clicked, so Apple Music is unchanged and the rank can be retried
        // from candidate lookup without blocking the run.
        await persistItem(current, { status: 'pending', error_code: error.code, error_message: `${error.message}。追加は行われていません。「候補を開いて自動照合」からやり直してください` });
        setCandidate(null);
        setNotice(`${error.message}。追加は行われていません。「候補を開いて自動照合」からやり直せます`);
        return;
      }
      await persistItem(current, { status: 'held', error_code: error.code || 'add_result_unknown', error_message: `${error.message}。再追加せずプレイリストを検証してください` });
      setNotice(`${error.message}。追加ボタンは再実行していません`);
    } finally { setBusy(false); }
  }

  // Read-only: the API reads Apple Music's public search for every pending
  // rank and lists the ones that will need registering before they are reached.
  async function runPreflight() {
    if (!run) return;
    setBusy(true); setNotice(null);
    try {
      const response = await api(`/update_runs/${run.id}/preflight`, { method: 'POST' });
      setRun(response);
      const flagged = response.preflight.flagged;
      setNotice(flagged.length ? `事前チェック: 要対応 ${flagged.length}曲（${flagged.map(item => `${item.rank}位`).join('・')}）` : '事前チェック: 要対応の曲はありません');
    } catch (error) { setNotice(`事前チェックに失敗しました: ${error.message}`); }
    finally { setBusy(false); }
  }

  async function verifyPlaylist() {
    if (!run) return;
    setBusy(true); setNotice(null);
    try {
      const verification = await extensionRequest(COMMANDS.VERIFY_PLAYLIST, { runId: run.id, rank: run.next_rank, playlistName: run.playlist_name, playlistUrl: run.playlist_url }, 25000);
      const response = await api(`/update_runs/${run.id}/verify`, { method: 'POST', body: JSON.stringify(verification) });
      setRun(response.run); setCandidate(null);
      setNotice(response.verification.error_code ? response.verification.error_message : `${response.verification.verified_prefix}位まで連続一致`);
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }

  const ok = value => ['ok', '接続済み', 'ログイン済み', '100曲 OK', 'Docker起動中', 'ローカル起動中'].includes(value);
  return <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-white p-6">
    <div className="max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">週間Apple Music更新</h1><p className="text-slate-500">APIなし・1曲ずつ確認・実プレイリスト検証</p></div><Link className="text-blue-600" to="/">ランキングへ</Link></header>
      <section className="grid grid-cols-2 md:grid-cols-5 gap-3">{Object.entries(environment).map(([key, value]) => <div key={key} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow"><div className="text-xs uppercase text-slate-500">{key}</div><div className={ok(value) ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{value}</div></div>)}</section>
      <div className="flex gap-3"><button disabled={busy} onClick={startOrResume} className="px-5 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50">今日の更新を開始／再開</button><button onClick={checkEnvironment} className="px-5 py-3 bg-white rounded-lg shadow dark:bg-slate-800">環境を再確認</button>{environment.appleMusic !== 'ログイン済み' && <button onClick={() => { window.open('https://music.apple.com/jp/', '_blank', 'noopener'); setTimeout(checkEnvironment, 4000); }} className="px-5 py-3 bg-white rounded-lg shadow dark:bg-slate-800" title="ログイン済みの Apple Music (/jp/) を開いて接続状態を更新">Apple Musicを開く</button>}{run && <button disabled={busy} onClick={verifyPlaylist} className="px-5 py-3 bg-white rounded-lg shadow dark:bg-slate-800">実プレイリストを検証</button>}{run && <button disabled={busy} onClick={runPreflight} className="px-5 py-3 bg-white rounded-lg shadow dark:bg-slate-800" title="Apple Musicの公開検索で未処理の順位を先に照合（読み取りのみ）">事前チェック</button>}</div>
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-4 flex items-center gap-3 flex-wrap">
        <label className="font-bold" htmlFor="target-count">完了とみなす曲数</label>
        <input id="target-count" type="number" min="1" max="100" value={targetInput} onChange={event => setTargetInput(event.target.value)} className="w-24 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-800" />
        <button disabled={busy || targetInput === String(targetCount)} onClick={saveTargetCount} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-40">保存</button>
        <span className="text-sm text-slate-500">現在 {targetCount}曲。変更すると進行中の実行にも反映されます（検証済みの順位より少なくはできません）</span>
      </section>
      {notice && <div className="p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900">{notice}</div>}
      {run && <>
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-6"><div className="flex justify-between gap-4 flex-wrap"><div><div className="text-sm text-slate-500">対象</div><div className="text-xl font-bold">{run.playlist_name}</div></div><div><div className="text-sm text-slate-500">検証済み</div><div className="text-2xl font-bold">{run.verified_prefix} / {run.target_count}</div></div><div><div className="text-sm text-slate-500">実曲数</div><div className="text-2xl font-bold">{run.playlist_count}</div></div><div><div className="text-sm text-slate-500">状態</div><div className="text-xl font-bold">{run.status}</div></div></div><div className="mt-4 h-3 rounded bg-slate-200 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${run.verified_prefix / run.target_count * 100}%` }} /></div></section>
        {current ? <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-8 border-2 border-blue-500"><div className="text-sm text-blue-600 font-bold">次に処理する曲</div><div className="text-5xl font-black mt-2">#{current.rank}</div><h2 className="text-3xl font-bold mt-3">{current.title}</h2><p className="text-xl text-slate-500">{current.artist}</p><p className="mt-2">状態: {labels[current.status] || current.status}</p>{PREFLIGHT_FLAGS.includes(current.preflight_status) && <p className="mt-2 text-amber-700">事前チェック: {current.preflight_note}</p>}<div className="mt-6 flex gap-3 flex-wrap"><button disabled={busy} onClick={searchCurrent} className="px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50">候補を開いて自動照合</button>{candidate && <button disabled={busy} onClick={addAndVerify} className="px-6 py-3 bg-emerald-600 text-white rounded-lg disabled:opacity-50">この曲を追加して検証</button>}</div>{candidate && <div className="mt-5 p-4 bg-emerald-50 text-emerald-950 rounded-lg"><div className="font-bold">一意に一致したApple Music候補</div><div>{candidate.title} — {candidate.artist}</div><div>種別: {candidate.kind} / 追加先: {run.playlist_name} / 現在: {run.playlist_count}曲</div></div>}</section> : <section className="p-8 bg-emerald-100 text-emerald-900 rounded-xl text-2xl font-bold">{run.target_count}曲の処理が完了しました</section>}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow overflow-auto max-h-80"><table className="w-full text-sm"><thead><tr><th className="p-3 text-left">順位</th><th className="p-3 text-left">曲</th><th className="p-3 text-left">状態</th><th className="p-3 text-left">理由</th></tr></thead><tbody>{run.items.map(item => <tr key={item.id} className="border-t border-slate-200"><td className="p-3">{item.rank}</td><td className="p-3">{item.title}<div className="text-slate-500">{item.artist}</div></td><td className="p-3">{labels[item.status] || item.status}</td><td className="p-3 text-amber-700">{item.error_message}{!item.error_message && item.status !== 'verified' && PREFLIGHT_FLAGS.includes(item.preflight_status) && <span>事前チェック: {item.preflight_note}</span>}{!item.error_message && item.status !== 'verified' && ['explicit_pinned', 'copy_pinned'].includes(item.preflight_status) && <span className="text-slate-500">{item.preflight_status === 'explicit_pinned' ? 'Explicit版に固定' : '同じ録音の1つに固定'}</span>}</td></tr>)}</tbody></table></section>
      </>}
      {history.length > 0 && <section className="bg-white dark:bg-slate-900 rounded-xl shadow p-6"><h2 className="text-xl font-bold mb-3">実行履歴</h2><div className="space-y-2">{history.map(entry => <div key={entry.id} className="w-full flex items-center gap-2 p-3 rounded bg-slate-50 dark:bg-slate-800"><button onClick={async () => setRun(await api(`/update_runs/${entry.id}`))} className="flex-1 flex justify-between text-left min-w-0"><span className="truncate">{entry.playlist_name}</span><span className="ml-3 shrink-0">{entry.verified_prefix}/{entry.target_count} ・ {entry.status}{entry.error_message ? ` ・ ${entry.error_message}` : ''}</span></button><button disabled={busy} onClick={() => deleteRun(entry)} title="実行履歴から削除" aria-label={`${entry.playlist_name}を実行履歴から削除`} className="shrink-0 px-2 py-1 text-slate-400 hover:text-red-600 disabled:opacity-40">✕</button></div>)}</div></section>}
    </div>
  </div>;
}
