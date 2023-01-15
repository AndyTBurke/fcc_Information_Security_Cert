'use strict';
const fetch = require("node-fetch")
const mongoose = require("mongoose")
mongoose.connect(process.env.DB)

const stockSchema = new mongoose.Schema({
  stock: String,
  likes: Number,
  alreadyLiked: []
})

const StockModel = mongoose.model("stock", stockSchema)



function basicIpEncryprion(ipString) {
  const ipStringStripped = ipString.replace(/[^0-9]/g, '')
  const ipInt = Number(ipStringStripped)
  return ipInt * process.env.KEYONE - process.env.KEYTWO
}

module.exports = function (app) {
  
  function addStock(ticker) {
    const newStock = StockModel({
      stock: ticker,
      likes: 0,
      alreadyLiked: []
    })
    newStock.save((err, data) => {
      if (err) return console.log(err)
      return
    })
  }
  
  function incrementLikeCount(ticker, userIp) {
    StockModel.find({stock: ticker}, (err, data) => {
      if (err) return console.log(err)
      data[0].alreadyLiked = [...data[0].alreadyLiked, userIp]
      data[0].likes += 1
      console.log("adding...", userIp)
      data[0].save((err, data) => {
        console.log("like saved!")
      })
    })
  }

  app.route('/api/stock-prices')
    .get(function (req, res){
      console.log(req.query)
      const reqStock = req.query.stock
      const reqIp = basicIpEncryprion(req.ip)
      if (Array.isArray(req.query.stock)) {
        const stockOne = reqStock[0].toUpperCase()
        const stockTwo = reqStock[1].toUpperCase()
        Promise.all([
          fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockOne}/quote`)
            .then(res => res.json()), 
          fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${stockTwo}/quote`)
            .then(res => res.json())
        ])
            .then(data => {
              StockModel.find({$or:[{stock: stockOne}, {stock: stockTwo}]}, (err, dbData) => {
                let relLikesA;
                let relLikesB;
                if (dbData.length === 0) {
                  relLikesA = 0
                  relLikesB = 0
                  addStock(stockOne)
                  addStock(stockTwo)
                  if (req.query.like === "true") {
                    setTimeout(() => incrementLikeCount(stockOne, reqIp), 1000)
                    setTimeout(() => incrementLikeCount(stockTwo, reqIp), 1000)
                  }
                } else if (dbData.length === 2) {
                  relLikesA = dbData[0].likes - dbData[1].likes
                  relLikesB = dbData[1].likes - dbData[0].likes
                  if (req.query.like === "true" && !dbData[0].alreadyLiked.includes(reqIp)) {
                    incrementLikeCount(stockOne, reqIp)
                  }
                  if (req.query.like === "true" && !dbData[1].alreadyLiked.includes(reqIp)) {
                    incrementLikeCount(stockTwo, reqIp)
                  }
                } else if (dbData.length === 1) {
                  relLikesA = dbData[0].stock === stockOne ? dbData[0].likes : dbData[0].likes * -1
                  relLikesB = dbData[0].stock === stockTwo ? dbData[0].likes : dbData[0].likes * -1
                  const stockToAdd = dbData[0].stock === stockOne ? stockTwo : stockOne
                  addStock(stockToAdd)
                  if (req.query.like === "true") {
                    setTimeout(() => incrementLikeCount(stockToAdd, reqIp), 1000)
                    if (!dbData[0].alreadyLiked.includes(reqIp)) {
                      incrementLikeCount(dbData[0].stock, reqIp)
                    }
                  }
                }
                return res.json({stockData: [{stock: stockOne,
                                            price: data[0].delayedPrice,
                                            rel_likes: relLikesA},
                                            {stock: stockTwo,
                                             price: data[1].delayedPrice,
                                             rel_likes: relLikesB}]})
              })
              })
      } else {
        fetch(`https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${reqStock}/quote`)
          .then(res => res.json())
          .then(data => {
            StockModel.find({stock: req.query.stock.toUpperCase()}, (err, dbdata) => {
              let stockLikes = 0;
              if (err) return console.log(err)
              if (dbdata.length === 0) {
                addStock(req.query.stock.toUpperCase())
                if (req.query.like === "true") {
                  stockLikes += 1
                  setTimeout(() => incrementLikeCount(req.query.stock.toUpperCase(), reqIp), 1000)
                }  
              } else {
                if (req.query.like === "true" && !dbdata[0].alreadyLiked.includes(reqIp)) {
                  stockLikes += 1
                  incrementLikeCount(req.query.stock.toUpperCase(), reqIp)
                }
                stockLikes += dbdata[0].likes
              }
              return res.json({stockData: {stock: req.query.stock.toUpperCase(), 
                                          price: data.delayedPrice, 
                                          likes: stockLikes}})
            })

            })
      }
    });
    
};
