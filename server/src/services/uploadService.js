import path from "node:path";

/**
 * 处理上传的图片文件
 * @param {Object} file - multer 上传的文件对象，包含 filename 和 originalname
 * @returns {Object} 返回标准化的图片信息
 */
function mapUploadedImage(file) {
  return {
    url: `/uploads/${file.filename}`,
    fileName: path.basename(file.originalname)
  };
}

/**
 * 上传图片服务
 * @param {Object} file - multer 传递的文件对象
 * @returns {Object} 上传成功的图片信息
 * @throws {Error} 如果文件不存在会抛出错误
 */
export async function uploadImage(file) {
  if (!file) {
    const error = new Error("请选择要上传的图片");
    error.statusCode = 400;
    throw error;
  }

  return mapUploadedImage(file);
}