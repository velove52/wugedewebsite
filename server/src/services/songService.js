import { dbPool } from "../config/db.js";

function mapSong(row) {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album,
    audioSrc: row.audio_url,
    coverSrc: row.cover_url,
    duration: row.duration_seconds === null ? null : Number(row.duration_seconds)
  };
}

export async function listSongs() {
  const [rows] = await dbPool.query(
    `
      SELECT id, title, artist, album, audio_url, cover_url, duration_seconds
      FROM songs
      ORDER BY sort_order ASC, id ASC
    `
  );

  return rows.map(mapSong);
}
