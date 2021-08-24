const express = require('express')
const config = require('config')
const mongoose = require('mongoose')
var path = require('path');

const app = express()
const fetch = require("node-fetch")
const { body } = require('express-validator')



const jsonParser = express.json()

const PORT = config.get('port') || 5000
//app.use(express.json({extended:true}))
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/app', express.static(path.join(__dirname, 'www')))

app.use('/temp', express.static(path.join(__dirname, 'temp')))
app.use('/temp/*', express.static(path.join(__dirname, 'temp')))

app.use('/app/converter*', express.static(path.join(__dirname, 'www')));
app.use('/app/chat*', express.static(path.join(__dirname, 'www')));
app.use('/app/schedule*', express.static(path.join(__dirname, 'www')));
app.use('/app/task*', express.static(path.join(__dirname, 'www')));


app.use('/api/',require('./router/auth.router'))
app.use('/api/chat',require('./router/chat.router'))


async function start(){
    try {
        await mongoose.connect(config.get('mongoUri'),{
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        app.listen(PORT, ()=> console.log('Server has been started on port ', PORT))
    } catch (e) {
        console.log("Server Error: ", e)
        process.exit(1)
    }
}

start()