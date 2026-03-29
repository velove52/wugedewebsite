import { listSongs } from "../services/songService.js";

export async function getSongs(request, response) {
  const keyword = typeof request.query.q === "string" ? request.query.q : "";
  const songs = await listSongs(keyword);
  response.json({
    data: songs
  });
}
