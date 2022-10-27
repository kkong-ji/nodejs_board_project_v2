// models/File.js

var mongoose = require('mongoose');
var fs = require('fs');
var path = require('path');

// Box client setting
var BoxSDK = require('box-node-sdk');
var client;
var boxClientId = process.env.BOX_CLIENT_ID;
var boxAppToken = process.env.BOX_APP_TOKEN;
var isBoxEnabled = boxClientId && boxAppToken;

if(isBoxEnabled) {
  var sdk = new BoxSDK({
    clientID: boxClientId,
    clientSecret: ''
  });
  client = sdk.getBasicClient(boxAppToken);
}

// schema
var fileSchema = mongoose.Schema({ // 1
  originalFileName:{type:String},
  serverFileId:{type:String},
  serverFileName:{type:String},
  size:{type:Number},
  uploadedBy:{type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
  postId:{type:mongoose.Schema.Types.ObjectId, ref:'post'},
  isDeleted:{type:Boolean, default:false},
});

// instance methods // 3
fileSchema.methods.processDelete = function(){ // 4
  this.isDeleted = true;
  this.save();
};

fileSchema.methods.getFileStream = async function(){
  if(isBoxEnabled) {
    try { // using box.com
      var stream = await client.files.getReadStream(this.serverFileId);
    }
    catch(err) {
      if(err.statusCode == 404) {
        this.processDelete();
      }
      throw(err.statusCode);
    }
    return stream;
  }
  else {
    var stream;
    var filePath = path.join(__dirname,'..','uploadedFiles',this.serverFileName); // 5-1
    var fileExists = fs.existsSync(filePath); // 5-2
    if(fileExists){ // 5-3
      stream = fs.createReadStream(filePath);
    }
    else { // 5-4
      this.processDelete();
    }
    return stream; // 5-5
  }
};


// model & export
var File = mongoose.model('file', fileSchema);

// model methods
File.createNewInstance = async function(file, uploadedBy, postId) { // 2
  if(isBoxEnabled) { // using box.com 
    var filePath = path.join(__dirname,'..','uploadedFiles',file.filename);
    var stream = fs.createReadStream(filePath);
    var boxResponse = await client.files.uploadFile('0', `${file.filename}_${file.originalname}`, stream);
    var uploadedFile = boxResponse.entries[0];

    return await File.create({
      originalFileName:file.originalname,
      serverFileName:file.filename,
      serverFileId:uploadedFile.id,
      size:file.size,
      uploadedBy:uploadedBy,
      postId:postId,
      });
    }
    else { // using server file system
      return await File.create({
          originalFileName:file.originalname,
          serverFileName:file.filename,
          size:file.size,
          uploadedBy:uploadedBy,
          postId:postId,
        });
    }
};


module.exports = File;