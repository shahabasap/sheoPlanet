const mongoose = require("mongoose")
const { v4: uuidv4 } = require('uuid')
const session = require('express-session')
const express = require('express')
const app = express()
const nocache = require('nocache')
const path = require('path')
const flash = require('express-flash');
const Port = process.env.PORT || 3001

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))


require('dotenv').config();
const dbname = process.env.dbname
mongoose.connect(dbname);


app.use(nocache())

// session jis created----------------------
app.use(session({

  secret: uuidv4(),
  resave: 'false',
  saveUninitialized: true
}))

// Set up flash middleware
app.use(flash());

// for user routes------------------------------
const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)

// for user routes------------------------------
const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

app.listen(Port, () => {
  console.log(`server is runnig in the  port 3001`)
  console.log(`http://127.0.0.1:3003/`);
})