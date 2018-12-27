const express = require('express')
const bodyParser = require('body-parser')
const router = require('express').Router(); 

let app = express()

app.set('view engine', 'ejs')

app.use('/', router)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(express.static(__dirname + '/static'))

router.get('/', (req, res) => {
    res.redirect('/admin')
})

router.get('/admin', (req, res) => {
    res.render('index')
})

router.get('/user', (req, res) => {
    res.render('user')
})

let port = process.env.port || 8080;
app.listen(port, console.log('application is running on ' + port));