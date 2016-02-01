var mongodb = require('./mongodb');
var Schema = mongodb.mongoose.Schema;

var ArticleSchema = new Schema({
	title:String,//标题
	content:String,//内容
	createdate: Date//生成的时间
});

var ArticleModel = mongodb.mongoose.model('article', ArticleSchema);

var ArticleDAO = function () { };

ArticleDAO.prototype.save = function (obj, cb) {
	var instance = new ArticleModel(obj);
	instance.save(cb);
};

ArticleDAO.prototype.getData = function (query, opts, callback) {
		ArticleModel.find(query, '', opts, callback);
};

module.exports = new ArticleDAO();
