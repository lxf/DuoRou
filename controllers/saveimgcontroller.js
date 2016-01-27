var http = require("http");
var path = require("path");
var fs = require("fs");
var config = require('../config/config');
var async = require('async');

exports.saveImgToLocal = function (partialpath, savepath, filename, callback) {
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
                    callback("图片下载失败!" + url);
                } else {
                    //替换内容中的图片地址
                    // fs.writeFile(path.join(__dirname, 'log.txt'), content, 'utf8', function (err) {
                    //     if (err) throw err;
                    //     console.log("写入成功!");
                    // });
                    console.log(filename + "下载成功!");
                    callback(null);
                }
            });
        });
    });
}


exports.saveImgsToLocal = function (imgarr, savepath, callback1) {
    if (imgarr.length = 0) {
        callback1('没有可下载的数据!')
    }
    async.each(imgarr, function (item, callback) {
        var url = config.grab_config.host + item;
        var filenamematch = config.grab_config.imgname_reg.exec(item);
        console.log(url);
        console.log(filenamematch[0]);
        http.get(url, function (res) {
            var imgData = "";
            res.setEncoding("binary");

            res.on("data", function (chunk) {
                imgData += chunk;
            });

            res.on("end", function () {
                fs.writeFile(savepath + filenamematch[0], imgData, "binary", function (err) {
                    if (err) {
                        callback("图片下载失败!" + url);
                    } else {
                        //替换内容中的图片地址
                        // fs.writeFile(path.join(__dirname, 'log.txt'), content, 'utf8', function (err) {
                        //     if (err) throw err;
                        //     console.log("写入成功!");
                        // });
                        console.log(filenamematch[0] + "下载成功!");
                        callback('图片下载成功!');
                    }
                });
            });
        });
    },function(err){
        console.log(err);
    });
}
