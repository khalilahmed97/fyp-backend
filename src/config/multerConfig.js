const multer = require("multer")
const path = require("path")
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
      return cb(null, path.join(__dirname, '../../uploads/voters/'))
    },
    filename: function(req, file, cb) {
     console.log(file)
      cb(null, path.extname(file.originalname));
    }
  })
  
  const upload = multer({
    storage: storage,
   
  }).single('file')
  

module.exports = {upload}