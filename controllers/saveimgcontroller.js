var http = require("http");
var path = require("path");
var fs = require("fs");
var config = require('../config/config');
var async = require('async');
var reconnect_imgdown_time = 3;//当请求超时时，重试次数

exports.saveImgToLocal = function (partialpath, savepath, filename, callback) {
    var url = config.grab_config.host + 'data' + partialpath;
    http.get(url, function (res) {
        var imgData = "";
        res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
        
        res.on("data", function (chunk) {
            imgData += chunk;
        });

        res.on("end", function () {
            fs.writeFile(savepath + filename, imgData, "binary", function (err) {
                reconnect_imgdown_time = 0;
                if (err) {
                    callback("图片下载失败!" + url + err, null);
                } else {
                    callback(null, url + "下载成功!");
                }
            });
        });

        res.on('error', function (err) {
            callback(url + "-->下载出错", null);
        });

    }).on('error', function (err) {
        if (err.code == 'ETIMEDOUT') {
            callback('*******图片连接超时*******:' + err + ',链接:' + url, null);
        }
        else {
            callback('*******图片连接出错*******:' + err + ',链接:' + url, null);
        }
        // if (reconnect_imgdown_time < 3) {
        //     reconnect_imgdown_time++;
        //     console.log('*******[图片]正在进行第' + reconnect_imgdown_time + '次重连*******,链接:' + url);
        //     arguments.callee(url, callback);
        // }
        // else {
        //     console.log('*******[图片]尝试重新连接失败*******');
        // }
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
    }, function (err) {
        console.log(err);
    });
}
