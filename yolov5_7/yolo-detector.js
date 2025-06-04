const axios = require('axios');
const path = require('path');

/**
 * Gọi API YOLOv5 để phát hiện đối tượng trong thư mục ảnh
 * @param {string} sourceDir - Thư mục chứa ảnh
 * @param {string} weightsPath - Đường dẫn đến file weights
 * @param {number} confThreshold - Ngưỡng tin cậy 
 * @returns {Promise<Object>} Kết quả phát hiện đối tượng
 */
async function detectObjectsInFolder(sourceDir, weightsPath, confThreshold = 0.25) {
  try {
    console.log('Đang gọi API phát hiện đối tượng...');
    
    // Gọi API
    const response = await axios.post('http://localhost:5000/detect', {
      folder: sourceDir,
      weights: weightsPath,
      conf_thres: confThreshold
    });
    
    return response.data;
  } catch (error) {
    console.error('Lỗi khi gọi API:', error.message);
    throw error;
  }
}

/**
 * Lấy danh sách nhãn duy nhất từ kết quả
 * @param {Object} result - Kết quả phát hiện đối tượng
 * @returns {string[]} Mảng chứa các nhãn không trùng lặp
 */
function getUniqueLabels(result) {
  if (result.labels && result.labels.length > 0) {
    return [...new Set(result.labels)];
  }
  return [];
}

/**
 * Lấy chuỗi nhãn duy nhất từ kết quả (để tìm kiếm)
 * @param {Object} result - Kết quả phát hiện đối tượng
 * @returns {string} Chuỗi các nhãn cách nhau bởi dấu cách
 */
function getLabelsString(result) {
  const uniqueLabels = getUniqueLabels(result);
  return uniqueLabels.join(' ');
}

// Export các hàm để sử dụng trong các file khác
module.exports = {
  detectObjectsInFolder,
  getUniqueLabels,
  getLabelsString
};