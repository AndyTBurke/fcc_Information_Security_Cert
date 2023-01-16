'use strict';
const mongoose = require("mongoose")
mongoose.connect(process.env.DB)

const postSchema = new mongoose.Schema({
  board: String,
  text: String,
  created_on: Date,
  bumped_on: Date,
  reported: Boolean,
  delete_password: String,
  replies: []
})

const PostModel = mongoose.model("post", postSchema)

module.exports = function (app) {
  
  app.route('/api/threads/:board')
    
    .get((req, res) => {
      const reqBoard = req.params.board
      PostModel.find({board: reqBoard}, (err, data) => {
        const remappedData = data.map(post => ({_id: post._id, 
                                                text: post.text, 
                                                created_on: post.created_on,
                                                bumped_on: post.bumped_on,
                                                replies: post.replies.filter((d, i) => i < 3).map(reply => ({
                                                  _id: reply._id,
                                                  text: reply.text,
                                                  created_on: reply.created_on
                                                }))}))
        const filteredData = remappedData.filter((item, index) => index < 10)
        return res.json(filteredData)
      })
    })

    .post((req, res) => {
      const reqBoard = req.params.board

      const newPost = new PostModel({
        board: reqBoard,
        text: req.body.text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: req.body.delete_password,
        replies: []        
      })

      newPost.save((err, data) => {
        return res.json({_id: data._id, 
                  text: data.text, 
                  created_on: data.created_on,
                  bumped_on: data.bumped_on,
                  replies: data.replies})
      })
    })
    
    .delete((req, res) => {
      PostModel.find({_id: req.body.thread_id}, (err, data) => {
        if (err) console.log(err)
        if (req.body.delete_password === data[0].delete_password) {
          PostModel.findByIdAndRemove({_id: req.body.thread_id}, (err, data) => {
            return res.send("success")
          })
        } else {
          return res.send("incorrect password")
        }
      })
    })

    .put((req, res) => {
      PostModel.find({_id: req.body.thread_id}, (err, data) => {
        if (err) return console.log(err)
        data[0].reported = true
        data[0].save((err, data) => {
          return res.send("reported")
        })
      })
    })
      


  app.route('/api/replies/:board')

    .get((req, res) => {
      const threadId = req.query.thread_id
      PostModel.find({_id: threadId}, (err, data) => {
        if (err) return console.log(err)
        const mappedReplies = data[0].replies.map(reply => ({
          _id: reply._id,
          text: reply.text,
          created_on: reply.created_on
        }))
        const filteredData = {
          _id: data[0]._id, 
          text: data[0].text, 
          created_on: data[0].created_on,
          bumped_on: data[0].bumped_on,
          replies: mappedReplies
        }
        return res.json(filteredData)
      })
    })
    
    .post((req, res) => {

      const replyDate = new Date()

      const newReply = {
        _id: Math.floor(Math.random() * 9999999999999999),
        text: req.body.text,
        created_on: replyDate,
        delete_password: req.body.delete_password,
        reported: false
      }
      
      PostModel.find({_id: req.body.thread_id}, (err, data) => {
        if (err) return console.log(err)
        data[0].bumped_on = replyDate
        data[0].replies = [...data[0].replies, newReply]
        data[0].save((err, data) => {
          if (err) return console.log(err)
          return res.json(newReply)
        })
      })
    })

    .delete((req, res) => {
      PostModel.find({_id: req.body.thread_id}, (err, data) => {
        if (err) return console.log(err)
        const replyToDelete = data[0].replies.filter(reply => reply._id === Number(req.body.reply_id))
        if (req.body.delete_password !== replyToDelete[0].delete_password) {
          return res.send('incorrect password')
        } else {
          replyToDelete[0].text = "[deleted]"
          const updatedReplies = data[0].replies.map(reply => reply._id === Number(req.body.reply_id) ? replyToDelete[0] : reply)
          data[0].replies = updatedReplies
          data[0].markModified("replies")
          data[0].save((err, data) => {
            if (err) return console.log(err)
            return res.send("success")
          })
        }
        
      })
    })

    .put((req, res) => {
      PostModel.find({_id: req.body.thread_id}, (err, data) => {
        if (err) return console.log(err)
        const replyToReport = data[0].replies.filter(reply => reply._id === Number(req.body.reply_id))
        replyToReport[0].reported = true
        const updatedReplies = data[0].replies.map(reply => reply._id === Number(req.body.reply_id) ? replyToReport[0] : reply)
        data[0].replies = updatedReplies
        data[0].markModified("replies")
        data[0].save((err, data) => {
          if (err) return console.log(err)
          return res.send("reported")
        })        
      })
    })
};
