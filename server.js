const express = require('express')
const bodyParser = require('body-parser')
const router = require('express').Router(); 
var web3Helper = require('./js/lottery')

let app = express()

app.set('view engine', 'ejs')

app.use('/', router)
app.use(bodyParser)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

router.get('/', function(req, res) {
    web3Helper = new web3Helper
    web3Helper.newWeb3().then(function (web3Inst) {
        web3Helper.newContract()
    })
    res.render('index')
})

router.get('/test', function(req, res, next) {
    console.log(web3Helper.contractInst)
    res.render('index')
})

let port = process.env.port || 8080;
app.listen(port, console.log('application is running on ' + port));