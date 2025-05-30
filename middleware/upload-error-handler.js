const multer = require('multer');

module.exports = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      req.flash('error', 'File quá lớn (tối đa 5MB)');
      return res.redirect('back');
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      req.flash('error', 'Số lượng file vượt quá giới hạn');
      return res.redirect('back');
    }
    
    req.flash('error', `Lỗi upload: ${err.message}`);
    return res.redirect('back');
  }
  
  if (err) {
    req.flash('error', err.message || 'Lỗi upload file');
    return res.redirect('back');
  }
  
  next();
};