const express = require('express')
const bodyParser = require('body-parser')

let app = express()

app.set('view engine', 'ejs')
app.use(bodyParser)
