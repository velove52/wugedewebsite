import {
  createMessage,
  createReply,
  listMessagesWithReplies
} from "../services/messageService.js";

function normalizeAuthorName(authorName) {
  const trimmed = String(authorName || "").trim();
  return trimmed || "匿名";
}

function validateContent(content) {
  const normalized = String(content || "").trim();

  if (normalized.length > 500) {
    const error = new Error("文字留言不能超过 500 字");
    error.statusCode = 400;
    throw error;
  }

  return normalized;
}

function extractImagePayload(body) {
  const imageUrl = body.imageUrl ? String(body.imageUrl).trim() : "";
  const imageName = body.imageName ? String(body.imageName).trim() : "";

  if (!imageUrl) {
    return {
      imageUrl: null,
      imageName: null
    };
  }

  return {
    imageUrl,
    imageName: imageName || null
  };
}

export async function getMessages(_request, response) {
  const messages = await listMessagesWithReplies();
  response.json({
    data: messages
  });
}

export async function postMessage(request, response) {
  const content = validateContent(request.body.content);
  const imagePayload = extractImagePayload(request.body);

  if (!content && !imagePayload.imageUrl) {
    const error = new Error("留言内容和图片不能同时为空");
    error.statusCode = 400;
    throw error;
  }

  const message = await createMessage({
    authorName: normalizeAuthorName(request.body.authorName),
    content,
    ...imagePayload
  });

  response.status(201).json({
    data: message
  });
}

export async function postReply(request, response) {
  const content = validateContent(request.body.content);
  const imagePayload = extractImagePayload(request.body);

  if (!content && !imagePayload.imageUrl) {
    const error = new Error("回复内容和图片不能同时为空");
    error.statusCode = 400;
    throw error;
  }

  const reply = await createReply(Number(request.params.messageId), {
    authorName: normalizeAuthorName(request.body.authorName),
    content,
    ...imagePayload
  });

  response.status(201).json({
    data: reply
  });
}
