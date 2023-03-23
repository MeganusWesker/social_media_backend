const DatauriParser = require('datauri/parser');
const path=require('path');

exports.getDataUri=(file)=>{
  const parser= new DatauriParser();
  const fileExtensionName=path.extname(file.originalname).toString();
  return parser.format(fileExtensionName,file.buffer);
}