const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/posts/");
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});


const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;

  const extension = path
    .extname(file.originalname)
    .toLowerCase();

  const isValidExtension = allowedTypes.test(extension);
  const isValidMimeType = allowedTypes.test(file.mimetype);

  if (isValidExtension && isValidMimeType) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      )
    );
  }
};

const postFileFilter = (req, file, cb) => { 
  const allowedExtensions = /jpeg|jpg|png|webp|pdf|doc|docx|xls|xlsx|txt|mp4|mov|avi|mkv|webm/; 
  
  const allowedMimeTypes = /image\/jpeg|image\/png|image\/webp|application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/plain|video\/mp4|video\/quicktime|video\/x-msvideo|video\/x-matroska|video\/webm/; 
  const extension = path 
    .extname(file.originalname) 
    .toLowerCase() 
    .replace(".", ""); 
    
  const isValidExtension = allowedExtensions.test(extension); 
  const isValidMimeType = allowedMimeTypes.test(file.mimetype); 

  if (isValidExtension && isValidMimeType) { 
    cb(null, true); 
  } else { 
    cb( 
      new Error( 
        "This file type is not allowed for posts" 
      ) 
    ); 
  } 
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const postUpload = multer({ 
  storage: postStorage, 
  fileFilter: postFileFilter, 
  limits: { 
    fileSize: 5 * 1024 * 1024, 
  }, 
});

module.exports = {
  upload,
  postUpload,
};