export function generateAppleMusicSearchUrl(song) {
  const query = `${song.title} ${song.artist}`;
  return `https://music.apple.com/jp/search?term=${encodeURIComponent(query)}`;
}