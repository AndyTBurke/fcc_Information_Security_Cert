const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let currentLikes
  
  test('Viewing one stock', function(done) {
    chai.request(server)
    .get('/api/stock-prices/?stock=TAP&like=false')
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.stockData.stock, "TAP")
      assert.isAbove(res.body.stockData.price, 0)
      assert.isAtLeast(res.body.stockData.likes, 0)
      done()
      })
    })

  test('Viewing one stock and liking it', function(done) {
    chai.request(server)
    .get('/api/stock-prices/?stock=TAP&like=true')
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.stockData.stock, "TAP")
      assert.isAbove(res.body.stockData.price, 0)
      assert.isAtLeast(res.body.stockData.likes, 1)
      currentLikes = res.body.stockData.likes
      done()
      })
    })

  test('Viewing the same stock and liking it again', function(done) {
    chai.request(server)
    .get('/api/stock-prices/?stock=TAP&like=true')
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.stockData.stock, "TAP")
      assert.isAbove(res.body.stockData.price, 0)
      assert.equal(res.body.stockData.likes, currentLikes)
      done()
      })
    })

  test('Viewing two stocks', function(done) {
    chai.request(server)
    .get('/api/stock-prices/?stock[]=TAP&stock[]=GOOG&like=false')
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.stockData[0].stock, "TAP")
      assert.equal(res.body.stockData[1].stock, "GOOG")
      assert.isAbove(res.body.stockData[0].price, 0)
      assert.isAbove(res.body.stockData[1].price, 0)
      done()
      })
    })

  test('Viewing two stocks and liking them', function(done) {
    chai.request(server)
    .get('/api/stock-prices/?stock[]=TAP&stock[]=GOOG&like=true')
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.stockData[0].stock, "TAP")
      assert.equal(res.body.stockData[1].stock, "GOOG")
      assert.isAbove(res.body.stockData[0].price, 0)
      assert.isAbove(res.body.stockData[1].price, 0)
      assert.isNumber(res.body.stockData[0].rel_likes, "likes is some num")
      assert.isNumber(res.body.stockData[0].rel_likes, "likes is some num")
      done()
      })
    })
  
  
});
