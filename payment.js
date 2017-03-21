'use strict'

const keyPublishable = 'pk_test_1zX2sGaxbQYs7Ke0IpcCan3V';
const keySecret = 'sk_test_Q4JWUjA2m8GfpIUZy4nHncmt';

var express = require('express');
var stripe = require('stripe')(keySecret);
var path    = require('path');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var jwt = require('jsonwebtoken');
var cookie = require('cookie')
var cookieParser = require('cookie-parser')

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('public'))

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname+'/templates/login.html'));
});

app.post('/', function(req, res){
  var email = req.body.email;
  var password = req.body.password;
  var connection = mysql.createConnection({
    host     : 'modernservice.c4mnz6jezil1.us-east-1.rds.amazonaws.com',
    user     : 'ModernService',
    password : 'ModernService',
    port     : '3306',
    database : 'ModernService'
  });

  connection.connect();

  var checkIn = 0;
  connection.query('SELECT * FROM customer WHERE email = ? AND password = ?', [email, password], function (error, results, fields){
    if(error) {
      console.log(error);
    }
    for (var i in results) {
      checkIn = checkIn + 1;
    }
    if(checkIn == 0){
      connection.end();
      checkIn = 0;
      console.log('Login Fail!')
      res.sendFile(path.join(__dirname+'/templates/loginFail.html'));
    }
    else {
      connection.end();
      var token = jwt.sign(email, 'shhhhh');
      res.cookie('userToken', token)
      console.log('Login Success!')
      res.redirect('/list');
    }
  });
});

app.get('/signup', function(req, res){
  res.sendFile(path.join(__dirname+'/templates/signup.html'));
});

app.post('/signup', function(req, res){
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var verify = req.body.verify;
  if(password == verify){
    //update new user record
    var connection = mysql.createConnection({
      host     : 'modernservice.c4mnz6jezil1.us-east-1.rds.amazonaws.com',
      user     : 'ModernService',
      password : 'ModernService',
      port     : '3306',
      database : 'ModernService'
    });

    connection.connect();

    var check = 0;
    connection.query('SELECT * FROM customer WHERE email = ? OR username = ?', [email, username], function (error, results, fields){
      if(error) {
        console.log(error);
      }
      for (var i in results) {
        check = check + 1;
      }
      if(check == 0){
      
      connection.query('INSERT INTO customer SET ?', {'username': username, 'email': email, 'password': password}, function (error, results, fields) {
        if (error){
          console.log(error);
        }
        else {
          console.log("Singup Success!");
        }
        connection.end();
      });
      res.redirect('/');
      }
      else {
        connection.end();
        check = 0;
        console.log('Singup Fail!!');
        res.sendFile(path.join(__dirname+'/templates/signUpFail.html'));
      }
    });

  }
  else {
    console.log('Singup Fail!');
    res.sendFile(path.join(__dirname+'/templates/signUpFail.html'));
  }
});

app.get('/charge', function(req, res){
  res.sendFile(path.join(__dirname+'/templates/charge.html'));
});

app.get('/list', function(req, res){
  res.sendFile(path.join(__dirname+'/templates/list.html'));
});

app.post('/charge',function(req, res){
  var token = req.body.stripeToken;
  var chargeAmount = req.body.chargeAmount;
  var description = req.body.description;
  var cookies = cookie.parse(req.headers.cookie || '');
  var user_id = jwt.verify(cookies.userToken, 'shhhhh');

  var charge = stripe.charges.create({
    amount: chargeAmount,
    currency: "usd",
    source: token
  }, function(err, charge){
    if(err){
      if(err.type == "StripeCardError"){
        console.log("Your card is rejected.");
      }
    }else{
      console.log("Success!")

      //update Payment records here
      var connection = mysql.createConnection({
        host     : 'modernservice.c4mnz6jezil1.us-east-1.rds.amazonaws.com',
        user     : 'ModernService',
        password : 'ModernService',
        port     : '3306',
        database : 'ModernService'
      });

      connection.connect();

      connection.query('INSERT INTO payments SET ?', {'user_id': user_id, 'description': description, 'created': new Date(), 'amount': chargeAmount, 'currency': 'USD'}, function (error, results, fields) {
        if (error){
          console.log(error);
        }
        console.log("Payment record has been pushed to database.");
      });

      connection.end();

      res.redirect('/paySuccess');
    }
  });
});

app.get('/paySuccess', function(req, res){
  res.sendFile(path.join(__dirname+'/templates/paySuccess.html'));
});

app.set('view engine', 'pug')

app.get('/payHistory', function(req, res){
  var cookies = cookie.parse(req.headers.cookie || '');
  var user_id = jwt.verify(cookies.userToken, 'shhhhh');

  var connection = mysql.createConnection({
        host     : 'modernservice.c4mnz6jezil1.us-east-1.rds.amazonaws.com',
        user     : 'ModernService',
        password : 'ModernService',
        port     : '3306',
        database : 'ModernService'
      });

    connection.connect();
    // var Items = [];
    connection.query('SELECT * FROM payments WHERE user_id = ?', [user_id], function (error, results, fields) {
      // Items = results;
      console.log(results);
      console.log(results[0]);
      res.render(path.join(__dirname+'/templates/payHistory.pug'), {Items: results});
      if (error){
        console.log(error);
      }
    });

  connection.end();
  // console.log(Items);
});

app.listen(4567);


