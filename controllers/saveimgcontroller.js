var http = require("http");
var path = require("path");
var fs = require("fs");
var config = require('../config/config');

exports.saveImgToLocal = function (partialpath, savepath, filename) {
    var url = config.grab_config.host + partialpath;
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
                    fs.appendFile(path.join(__dirname, 'log1.txt'), err + "\n\r", 'utf8', function (err) {
                        if (err) throw err;
                    });
                } else {
                    console.log("下载成功!" + filename);
                }
            });
        });

        res.on('error', function (err) {
            console.log('下载图片出错:' + err);
        });
    });
}
