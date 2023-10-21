const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const pagesRouter = require('./routes/pages');
const authLocalRouter = require('./routes/authLocal');
const authGoogleRouter = require('./routes/authGoogle');

const app = express();

app.use(pagesRouter);
app.use(authLocalRouter);
app.use(authGoogleRouter);

// app.use(cookieParser());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  console.log('app listening port 3000');
});
