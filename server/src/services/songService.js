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

export async function listSongs(keyword = "") {
  const trimmedKeyword = keyword.trim();
  const hasKeyword = Boolean(trimmedKeyword);
  const searchPattern = `%${trimmedKeyword}%`;

  const [rows] = await dbPool.query(
    `
      SELECT id, title, artist, album, audio_url, cover_url, duration_seconds
      FROM songs
      ${hasKeyword ? "WHERE title LIKE ? OR artist LIKE ? OR album LIKE ?" : ""}
      ORDER BY sort_order ASC, id ASC
    `,
    hasKeyword ? [searchPattern, searchPattern, searchPattern] : []
  );

  return rows.map(mapSong);
}
