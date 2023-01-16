const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let threadId
  let replyId
  const testThread = Math.floor(Math.random() * 10000)
  
  test('Creating a new thread', function(done) {
    chai.request(server)
    .post(`/api/threads/${testThread}`)
    .send({text: "test 1 text", delete_password: "deleteme"})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.text, "test 1 text")
      assert.isArray(res.body.replies, 'response is an array')
      threadId = res.body._id
      done()
      })
    })

  test('Viewing the 10 most recent threads with 3 replies each', function(done) {
    chai.request(server)
    .get(`/api/threads/${testThread}`)
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isArray(res.body, 'res is an array')
      assert.isAtMost(res.body.length, 10)
      assert.isAtMost(res.body[0].replies.length, 3)
      done()
      })
    })

  
  test('Deleting a thread with the incorrect password', function(done) {
    chai.request(server)
    .delete(`/api/threads/${testThread}`)
    .send({thread_id: threadId, delete_password: "wrongpassword"})
    .end(function(err, res){
      assert.equal(res.status, 200)
      console.log(threadId)
      assert.equal(res.text, 'incorrect password')
      done()
      })
    })

  test('Reporting a thread', function(done) {
    chai.request(server)
    .put(`/api/threads/${testThread}`)
    .send({thread_id: threadId})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.text, 'reported')
      done()
      })
    })

  test('Creating a new reply', function(done) {
    chai.request(server)
    .post(`/api/replies/${testThread}`)
    .send({text: "reply 1 text", delete_password: "deleteme", thread_id: threadId})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isObject(res.body, 'response is an obj')
      assert.equal(res.body.text, "reply 1 text")
      assert.equal(res.body.delete_password, 'deleteme')
      replyId = res.body._id
      done()
      })
    })

  test('Viewing a single thread with all replies', function(done) {
    chai.request(server)
    .get(`/api/threads/${testThread}?thread_id=${threadId}`)
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.isArray(res.body, 'res is an array')
      assert.isAtLeast(res.body.length, 1)
      assert.isArray(res.body[0].replies, 'replies is an array')
      assert.isAtLeast(res.body[0].replies.length, 1)
      done()
      })
    })

  test('Deleting a reply with the incorrect password', function(done) {
    chai.request(server)
    .delete(`/api/replies/${testThread}`)
    .send({thread_id: threadId, reply_id: replyId, delete_password: "wrongpassword"})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.text, 'incorrect password')
      done()
      })
    })

  test('Reporting a reply', function(done) {
    chai.request(server)
    .put(`/api/threads/${testThread}`)
    .send({thread_id: threadId, reply_id: replyId})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.text, 'reported')
      done()
      })
    })

  test('Deleting a reply with the correct password', function(done) {
    chai.request(server)
    .delete(`/api/replies/${testThread}`)
    .send({thread_id: threadId, reply_id: replyId, delete_password: "deleteme"})
    .end(function(err, res){
      assert.equal(res.status, 200)
      assert.equal(res.text, 'success')
      done()
      })
    })

  test('Deleting a thread with the correct password', function(done) {
    chai.request(server)
    .delete(`/api/threads/${testThread}`)
    .send({thread_id: threadId, delete_password: "deleteme"})
    .end(function(err, res){
      assert.equal(res.status, 200)
      console.log(threadId)
      assert.equal(res.text, 'success')
      done()
      })
    })
});
