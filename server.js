var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;
var crypto = require('crypto');
var bodyParser = require('body-parser');
var session = require('express-session');

var config = {
    user : 'niranjan00',
    database : 'niranjan00',
    host : 'db.imad.hasura-app.io',
    port : '5432',
    password : process.env.DB_PASSWORD
    
    };

var app = express();
app.use(morgan('combined'));
var path = require('path');

app.use(express.static(__dirname + '/ui'));

app.use(bodyParser.json());

app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30}
}));

function hash (input, salt) {
    // How do we create a hash?
    var hashed = crypto.pbkdf2Sync(input, salt, 10000, 512, 'sha512');
    return ["pbkdf2", "10000", salt, hashed.toString('hex')].join('$');
}


app.get('/hash/:input', function(req, res) {
   var hashedString = hash(req.params.input, 'this-is-some-random-string');
   res.send(hashedString);
});

app.post('/create-user', function (req, res) {
   // username, password
   // {"username": "tanmai", "password": "password"}
   // JSON
   var username = req.body.username;
   var password = req.body.password;
   var salt = crypto.randomBytes(128).toString('hex');
   var dbString = hash(password, salt);
   pool.query('INSERT INTO "user" (username, password) VALUES ($1, $2)', [username, dbString], function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send('User successfully created: ' + username);
      }
   });
});

app.post('/login', function (req, res) {
   var username = req.body.username;
   var password = req.body.password;
   
   pool.query('SELECT * FROM "user" WHERE username = $1', [username], function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          if (result.rows.length === 0) {
              res.status(403).send('username/password is invalid');
          } else {
              // Match the password
              var dbString = result.rows[0].password;
              var salt = dbString.split('$')[2];
              var hashedPassword = hash(password, salt); // Creating a hash based on the password submitted and the original salt
              if (hashedPassword === dbString) {
                
                // Set the session
                req.session.auth = {userId: result.rows[0].id};
                // set cookie with a session id
                // internally, on the server side, it maps the session id to an object
                // { auth: {userId }}
                
                res.send('credentials correct!');
                
              } else {
                res.status(403).send('username/password is invalid');
              }
          }
      }
   });
});

app.get('/check-login', function (req, res) {
   if (req.session && req.session.auth && req.session.auth.userId) {
       // Load the user object
       pool.query('SELECT * FROM "user" WHERE id = $1', [req.session.auth.userId], function (err, result) {
           if (err) {
              res.status(500).send(err.toString());
           } else {
              res.send(result.rows[0].username);    
           }
       });
   } else {
       res.status(400).send('You are not logged in');
   }
});

app.get('/logout', function (req, res) {
   delete req.session.auth;
   res.status(200).send('<html><body>Logged out!<br/><br/><a href="/">Back to home</a></body></html>');
});


var pool = new Pool(config);
app.get('/get-articles', function (req, res) {
   // make a select request
   // return a response with the results
   pool.query('SELECT * FROM article ', function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send(JSON.stringify(result.rows));
      }
   }); 
});

app.get('/category', function (req, res) {
   // make a select request
   // return a response with the results
   pool.query('SELECT * FROM category', function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send(JSON.stringify(result.rows));
      }
   }); 
});


// profile page start

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

app.get('/css/bootstrap.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'bootstrap.min.css'));
});

app.get('/css/bootstrap-theme.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'bootstrap-theme.min.css'));
});
app.get('/css/font-awesome.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'font-awesome.min.css'));
});

app.get('/css/bootstrap-social.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'bootstrap-social.css'));
});
app.get('/js/bootstrap.min.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/js', 'bootstrap.min.js'));
});

app.get('/css/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'style.css'));
});

app.get('/fonts/glyphicons-halflings-regular.ttf ', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'glyphicons-halflings-regular.ttf '));
});

app.get('/fonts/glyphicons-halflings-regular.eot  ', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'glyphicons-halflings-regular.eot'));
});

app.get('/fonts/glyphicons-halflings-regular.svg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'glyphicons-halflings-regular.svg'));
});

app.get('/fonts/glyphicons-halflings-regular.woff', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'glyphicons-halflings-regular.woff'));
});
app.get('/fonts/glyphicons-halflings-regular.woff', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'glyphicons-halflings-regular.woff'));
});
app.get('/fonts/fontawesome-webfont.svg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'fontawesome-webfont.svg'));
});
app.get('/fonts/fontawesome-webfont.woff', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/fonts', 'fontawesome-webfont.woff'));
});

// profile page ends 


// images registration start 
app.get('/images/niru.jpg', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'niru.jpg'));
});

app.get('/images/server.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'server.png'));
});
app.get('/images/phone.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'phone.png'));
});
app.get('/images/mail.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'mail.png'));
});

app.get('/images/web.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'web.png'));
});
app.get('/images/java.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'java.png'));
});
app.get('/images/setting.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'setting.png'));
});
app.get('/images/school.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'school.png'));
});
app.get('/images/college.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'college.png'));
});
app.get('/images/fb.PNG', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'fb.PNG'));
});
app.get('/images/gp.PNG', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'gp.PNG'));
});

app.get('/images/twitter.PNG', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'twitter.PNG'));
});

app.get('/images/lkn.PNG', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/images', 'lkn.PNG'));
});

// images registration ends

function createTemplate(data){
    var title = data.title;
    var heading = data.heading;
    var date = data.date;
    var content = data.content;

var htmlTemplate = `
   <html>
    <head>
        <title>${title} </title>
        <meta name="viewport" content="width=device-width , initial-scale=1"> 
         <link href="/ui/style.css" rel="stylesheet" />
       
    </head>
    <body>
    <div class="container">   
        <div>
            <a href="/">Home</a>
        </div>
        <hr/>
        <h3>
            ${heading} 
        </h3>
        <div>
            ${date.toDateString()}
        </div>
        <div>
            ${content}
        </div>
    </div>     
    </body>
</html>

`;

return htmlTemplate;
}


// blog registration

app.get('/blog', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'blog.html'));
});
app.get('/css/blog-home.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'blog-home.css'));
});

//
app.get('/ui/main.js', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'main.js'));
});


app.get('/ui/style.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'style.css'));
});

app.get('/ui/madi.png', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'madi.png'));
});


var port = 8080; // Use 8080 for local development because you might already have apache running on 80
app.listen(8080, function () {
  console.log(`IMAD course app listening on port ${port}!`);
});
