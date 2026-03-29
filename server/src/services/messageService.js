import { dbPool } from "../config/db.js";
import { formatRelativeDate } from "../utils/time.js";

function mapReply(row) {
  return {
    id: row.id,
    messageId: row.message_id,
    author: row.author_name,
    text: row.content,
    image: row.image_url
      ? {
          url: row.image_url,
          fileName: row.image_name || ""
        }
      : null,
    createdAt: row.created_at,
    createdLabel: formatRelativeDate(row.created_at)
  };
}

function mapMessage(row) {
  return {
    id: row.id,
    author: row.author_name,
    text: row.content,
    image: row.image_url
      ? {
          url: row.image_url,
          fileName: row.image_name || ""
        }
      : null,
    createdAt: row.created_at,
    createdLabel: formatRelativeDate(row.created_at),
    replies: []
  };
}

export async function listMessagesWithReplies() {
  const [messageRows] = await dbPool.query(
    `
      SELECT id, author_name, content, image_url, image_name, created_at
      FROM messages
      ORDER BY created_at DESC, id DESC
    `
  );

  const [replyRows] = await dbPool.query(
    `
      SELECT id, message_id, author_name, content, image_url, image_name, created_at
      FROM replies
      ORDER BY created_at ASC, id ASC
    `
  );

  const messageMap = new Map();
  const messages = messageRows.map((row) => {
    const message = mapMessage(row);
    messageMap.set(message.id, message);
    return message;
  });

  replyRows.forEach((row) => {
    const parent = messageMap.get(row.message_id);
    if (!parent) {
      return;
    }

    parent.replies.push(mapReply(row));
  });

  return messages;
}

export async function createMessage({ authorName, content, imageUrl, imageName }) {
  const [result] = await dbPool.execute(
    `
      INSERT INTO messages (author_name, content, image_url, image_name)
      VALUES (?, ?, ?, ?)
    `,
    [authorName, content, imageUrl || null, imageName || null]
  );

  const [rows] = await dbPool.execute(
    `
      SELECT id, author_name, content, image_url, image_name, created_at
      FROM messages
      WHERE id = ?
    `,
    [result.insertId]
  );

  return mapMessage(rows[0]);
}

export async function createReply(messageId, { authorName, content, imageUrl, imageName }) {
  const [messageRows] = await dbPool.execute(
    `
      SELECT id
      FROM messages
      WHERE id = ?
    `,
    [messageId]
  );

  if (messageRows.length === 0) {
    const error = new Error("留言不存在");
    error.statusCode = 404;
    throw error;
  }

  const [result] = await dbPool.execute(
    `
      INSERT INTO replies (message_id, author_name, content, image_url, image_name)
      VALUES (?, ?, ?, ?, ?)
    `,
    [messageId, authorName, content, imageUrl || null, imageName || null]
  );

  const [rows] = await dbPool.execute(
    `
      SELECT id, message_id, author_name, content, image_url, image_name, created_at
      FROM replies
      WHERE id = ?
    `,
    [result.insertId]
  );

  return mapReply(rows[0]);
}
