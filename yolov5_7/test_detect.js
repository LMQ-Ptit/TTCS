const axios = require('axios');
const path = require('path');

// Đường dẫn đến thư mục chứa ảnh cần kiểm tra
const imageDir = path.join(__dirname, 'yolov5', 'data', 'images');
// Đường dẫn đến file weights
const weightsPath = path.join(__dirname, 'yolov5', 'best.pt');

/**
 * Hàm gọi API để phát hiện đối tượng
 * @param {string} sourceDir - Thư mục chứa ảnh
 * @param {string} weightsPath - Đường dẫn đến file weights
 * @param {number} confThreshold - Ngưỡng tin cậy 
 * @returns {Promise<Object>} Kết quả phát hiện đối tượng
 */
async function detectObjectsViaAPI(sourceDir, weightsPath, confThreshold = 0.25) {
  try {
    console.log('Đang gọi API phát hiện đối tượng...');
    
    // Gọi API thay vì chạy script Python trực tiếp
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

// Hàm main để thực hiện kiểm tra và sử dụng kết quả
async function main() {
  try {
    const result = await detectObjectsViaAPI(imageDir, weightsPath, 0.25);
    
    console.log('\nKẾT QUẢ PHÁT HIỆN:');
    console.log('-----------------');
    
    if (result.labels && result.labels.length > 0) {
      // Chuyển đổi mảng labels thành một set để loại bỏ trùng lặp
      const uniqueLabels = [...new Set(result.labels)];
      
      // Nối các nhãn thành một chuỗi duy nhất (cách nhau bằng dấu cách)
      const labelsString = uniqueLabels.join(' ');
      
      console.log(labelsString);
    } else {
      console.log('Không phát hiện đối tượng nào');
    }
    
    return result;
  } catch (error) {
    console.error(error);
  }
}

main();