const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const path = require('path')
const port = process.env.port || 8080

const indexRouter = require('./router')

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next(); // Proceed to the next middleware or route handler
});

app.use(indexRouter);

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})