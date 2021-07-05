const express = require('express');
const fs = require('fs');
const path = require('path')
const app = express();
require('dotenv').config();
const morgan = require('morgan');
const cors = require('cors')
const helmet = require('helmet');
const mongoose = require('mongoose');
const productsRouter = require('./routes/products.router')
const ordersRouter = require('./routes/orders.router')
const usersRouter = require('./routes/users.router')
const categoriesRouter = require('./routes/categories.router')
const authJwt = require('./utils/jwt')
const errorHandler = require('./utils/errorHandler')

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';
const URI = process.env.MONGO_URI;
const api = process.env.API_URL;

const accessLogStream = fs.createWriteStream(path.join(__dirname, './logs/api.log'), { flags: 'a' })

app.use(express.json());
app.use(cors());
app.options('*', cors())
app.use('/uploads/image/', express.static(__dirname + '/uploads/image/'))
app.use(morgan('combined'))
app.use(morgan('combined', { 
    stream: accessLogStream 
}));
app.use(morgan('combined'))
app.use(express.urlencoded({
    extended: true
}))
app.use(helmet());
app.use(authJwt());
app.use(errorHandler);

app.use(`${api}/products`, productsRouter);
app.use(`${api}/orders`, ordersRouter);
app.use(`${api}/users`, usersRouter);
app.use(`${api}/categories`, categoriesRouter);

mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false })
    .then(() => {
        console.log('Sucessfully connected to Database!')
    })
    .catch(err => {
        console.log(err)
    })

app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is started at port: ${PORT}`)
})