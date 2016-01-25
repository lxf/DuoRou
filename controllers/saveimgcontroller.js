var http = require("http");
var path = require("path");
var fs = require("fs");
var config = require('../config/config');

exports.saveImgToLocal = function (partialpath, savepath, filename) {
    var url = config.grab_config.host + partialpath;
console.log(url);
    http.get(url, function (res) {
        var imgData = "";
        res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
        res.on("data", function (chunk) {
            imgData += chunk;
        });

        res.on("end", function () {
            fs.writeFile(savepath + filename, imgData, "binary", function (err) {
                if (err) {
                    console.log("下载失败!");
                } else {
                    //替换内容中的图片地址
                    
                    // fs.writeFile(path.join(__dirname, 'log.txt'), content, 'utf8', function (err) {
                    //     if (err) throw err;
                    //     console.log("写入成功!");
                    // });
                    console.log("下载成功!" + filename);
                }
            });
        });
    });
}
