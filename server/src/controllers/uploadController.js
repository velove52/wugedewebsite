import { uploadImage as uploadImageService } from "../services/uploadService.js";

export async function uploadImage(request, response) {
  const imageData = await uploadImageService(request.file);
  
  response.status(201).json({
    data: imageData
  });
}