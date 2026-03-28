import multer from 'multer'

const storage = multer.memoryStorage(); // store file in memory

// Add file filter to handle missing files gracefully
const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (!file) {
      return cb(null, false);
    }
    cb(null, true);
  }
});

export default upload;