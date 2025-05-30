const fs = require('fs');
const path = require('path');

// Hàm xóa file từ public folder
module.exports.deleteFile = (filePath) => {
  try {
    // Kiểm tra filePath có hợp lệ không
    if (!filePath || typeof filePath !== 'string') {
      return false;
    }

    // Chỉ xử lý các đường dẫn từ admin/images
    if (!filePath.includes('/admin/images/')) {
      return false;
    }

    // Chuyển từ đường dẫn web sang đường dẫn thực tế của file
    const fullPath = path.join(__dirname, '../public', filePath);

    // Kiểm tra file tồn tại
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath); // Xóa file
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};