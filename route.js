var express = require('express');
var config = require('./config/config');
var router = express.Router();

var robot = require('./controllers/graburlcontroller');

/*
 *测试
router.get('/test/test',function(req,res){
	res.set('Content-Type','text/plain');
	var s='';
	for(var name in req.headers)
	{
		s+=name+":"+req.headers[name]+"\n";
	}
    console.log(req.query["ss"]);
	console.log(req.route);
	res.send(s);
});

router.post('/test/post',function(req,res){
	var s='';
	s+="Your IP is :"+req.ip+"\n请求路径是:"+req.path+"\n host is :"+req.host;
	s+="\n url is:"+req.url;
	res.send(s);
});
*/

module.exports = router;