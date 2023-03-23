const multer =require('multer');

const storage=multer.memoryStorage();

const multipleUpload=multer({storage}).array('files',8);

module.exports=multipleUpload;