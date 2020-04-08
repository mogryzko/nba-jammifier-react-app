var express = require("express");
var app = express();
var multer = require("multer");
var cors = require("cors");
const fs = require("fs-extra");
app.use(cors());

var timeStamp = null;

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir;
    if (file.originalname.includes(".png")) {
      dir = "public/" + file.originalname.substring(0, 13);
      cb(null, dir);
    } else {
      dir = "public/" + timeStamp;
      fs.ensureDir(dir, (err) => {
        console.log(err); // => null
        // dir has now been created, including the directory it is to be placed in
      });
      cb(null, dir);
    }
  },
  filename: function (req, file, cb) {
    if (file.originalname.includes(".png")) {
      cb(null, file.originalname);
    } else {
      cb(null, timeStamp + "-" + file.originalname);
    }
  },
});

var upload = multer({ storage: storage }).single("file");

app.post("/upload", function (req, res) {
  timeStamp = Date.now();
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      console.log(err);
      return res.status(500).json(err);
    } else if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    return res.status(200).send(req.file);
  });
});

app.listen(8000, function () {
  console.log("App running on port 8000");
});
