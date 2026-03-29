import path from "node:path";

export async function uploadImage(request, response) {
  if (!request.file) {
    const error = new Error("请选择要上传的图片");
    error.statusCode = 400;
    throw error;
  }

  response.status(201).json({
    data: {
      url: `/uploads/${request.file.filename}`,
      fileName: path.basename(request.file.originalname)
    }
  });
}
