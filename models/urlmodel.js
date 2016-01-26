var mongodb = require('./mongodb');
var Schema = mongodb.mongoose.Schema;

var GrabURLSchema = new Schema({
    graburl: String,//待抓取的url
    isgrabed: Boolean,//是否已经抓取过
    lastgrabdate: Date,//抓取的时间
    issinglepage: Boolean,//是否是具体页面的url
    level: Number,//几级页面
});

var URLModel = mongodb.mongoose.model('graburl', GrabURLSchema);

var URLDAO = function () { };

URLDAO.prototype.save = function (obj, cb) {
    var instance = new URLModel(obj);
    instance.save(cb);
};

URLDAO.prototype.getData = function (query, opts, callback) {
    URLModel.find(query, '', opts, callback);
};

URLDAO.prototype.partialUpdate = function (url, callback) {
    URLModel.findOne({ 'graburl': url, 'level': 2 }, function (err,res) {
        if (res != undefined) {
            URLModel.findByIdAndUpdate(res._id,
                {
                    $set: {
                        isgrabed: true
                    }   
                }, function (err, doc) {
                    if (err) {
                        return next(err);
                    }
                    else {
                        return callback(doc);
                    }
                });
        }
    });
}


module.exports = new URLDAO();
