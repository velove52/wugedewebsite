CREATE DATABASE IF NOT EXISTS web_songs
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE web_songs;

CREATE TABLE IF NOT EXISTS songs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  artist VARCHAR(200) NOT NULL,
  album VARCHAR(200) NOT NULL,
  audio_url VARCHAR(255) NOT NULL,
  cover_url VARCHAR(255) NULL,
  duration_seconds INT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  author_name VARCHAR(100) NOT NULL DEFAULT '匿名',
  content VARCHAR(500) NOT NULL DEFAULT '',
  image_url VARCHAR(255) NULL,
  image_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS replies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_id BIGINT UNSIGNED NOT NULL,
  author_name VARCHAR(100) NOT NULL DEFAULT '匿名',
  content VARCHAR(500) NOT NULL DEFAULT '',
  image_url VARCHAR(255) NULL,
  image_name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_replies_message
    FOREIGN KEY (message_id) REFERENCES messages(id)
    ON DELETE CASCADE
);

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration_seconds, sort_order)
SELECT '晴天', '周杰伦', '叶惠美', 'songs/周杰伦 - 晴天.flac', 'cover.jpg', NULL, 1
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = '晴天' AND artist = '周杰伦');

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration_seconds, sort_order)
SELECT '搁浅', '周杰伦', '七里香', 'songs/周杰伦 - 搁浅.flac', 'cover.jpg', NULL, 2
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = '搁浅' AND artist = '周杰伦');

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration_seconds, sort_order)
SELECT '给我一首歌的时间', '周杰伦', '魔杰座', 'songs/周杰伦 - 给我一首歌的时间.flac', 'cover.jpg', NULL, 3
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = '给我一首歌的时间' AND artist = '周杰伦');

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration_seconds, sort_order)
SELECT '花海', '周杰伦', '魔杰座', 'songs/周杰伦 - 花海.flac', 'cover.jpg', NULL, 4
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = '花海' AND artist = '周杰伦');

INSERT INTO songs (title, artist, album, audio_url, cover_url, duration_seconds, sort_order)
SELECT '一路向北', '周杰伦', '十一月的萧邦', 'songs/周杰伦 - 一路向北.mp3', 'cover.jpg', NULL, 5
WHERE NOT EXISTS (SELECT 1 FROM songs WHERE title = '一路向北' AND artist = '周杰伦');
