import { listSongs } from "../services/songService.js";

export async function getSongs(_request, response) {
  const songs = await listSongs();
  response.json({
    data: songs
  });
}
