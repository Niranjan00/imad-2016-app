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
app.use(bodyParser.json());
app.use(session({
    secret: 'someRandomSecretValue',
    cookie: { maxAge: 1000 * 60 * 60 * 24 * 30}
}));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

// blog registration
app.get('/blog', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'blog.html'));
});


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
   // username, password JSON
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
   res.status(200).sendFile(path.join(__dirname, 'ui', 'blog.html'));
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

app.get('/get-comments/:articleName', function (req, res) {
   // make a select request
   // return a response with the results
   pool.query('SELECT comment.*, "user".username FROM article, comment, "user" WHERE article.title = $1 AND article.id = comment.article_id AND comment.user_id = "user".id ORDER BY comment.timestamp DESC', [req.params.articleName], function (err, result) {
      if (err) {
          res.status(500).send(err.toString());
      } else {
          res.send(JSON.stringify(result.rows));
      }
   });
});

app.post('/submit-comment/:articleName', function (req, res) {
   // Check if the user is logged in
    if (req.session && req.session.auth && req.session.auth.userId) {
        // First check if the article exists and get the article-id
        pool.query('SELECT * from article where title = $1', [req.params.articleName], function (err, result) {
            if (err) {
                res.status(500).send(err.toString());
            } else {
                if (result.rows.length === 0) {
                    res.status(400).send('Article not found');
                } else {
                    var articleId = result.rows[0].id;
                    // Now insert the right comment for this article
                    pool.query(
                        "INSERT INTO comment (comment, article_id, user_id) VALUES ($1, $2, $3)",
                        [req.body.comment, articleId, req.session.auth.userId],
                        function (err, result) {
                            if (err) {
                                res.status(500).send(err.toString());
                            } else {
                                res.status(200).send('Comment inserted!')
                            }
                        });
                }
            }
       });     
    } else {
        res.status(403).send('Only logged in users can comment');
    }
});

var counter = 0;
app.get('/counter',function(req,res){
    counter = counter+1;
   res.send(counter.toString()); 
});

app.get('/:articleName',function (req,res) {
    pool.query("SELECT * FROM article WHERE title = $1", [req.params.articleName], function(err,result) {
        if(err){
            res.status(500).send(err.toString());
    } else {
        if(result.rows.length === 0)
        {
            res.status(404).send('Article not found');
            } 
            else {
            var articleData = result.rows[0];
            res.send(createTemplate(articleData));
            }
        }
    });
});

// profile page start

app.get('/css/bootstrap.min.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'bootstrap.min.css'));
});

app.get('/css/bootstrap-theme.css', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui/css', 'bootstrap-theme.css'));
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
<html lang="en">

<head>

    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Niranjan Blog</title>

    <!-- Bootstrap Core CSS -->
    <link href="css/bootstrap.min.css" rel="stylesheet">
	<link href="css/bootstrap-theme.css" rel="stylesheet">
    <link href="css/font-awesome.min.css" rel="stylesheet">
    <link href="css/bootstrap-social.css" rel="stylesheet">

    <!-- Custom CSS -->
    <link href="css/blog-home.css" rel="stylesheet">
   
</head>

<body>

    <!-- Navigation -->
     <nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
        <div class="container">
            <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" 
                    aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand" href="#"><P >NIRANJAN'S BLOG</P></a>
        </div>
            <div id="navbar" class="navbar-collapse collapse navbar-right">
               <ul class="nav navbar-nav">
                <li class="active pull-left"><a href="/blog"><span class="glyphicon glyphicon-home"
                         aria-hidden="true"></span> Blog HOME</a></li>
                       
                </ul>
               
                </div> 
        </div>
    </nav>


    <!-- Page Content -->
    <div class="container">

        <div class="row">
            <div class="col-sm-9">
                <h1>${title}</h1>
                <h2>${heading}</h2>
                <h4>${date.toString()}</h4>
                <p>${content}</p>
            </div>
        </div>
    </div><br><br>
    <!-- /.container -->
	 <!-- Footer -->
         <footer class="row-footer">
                    <p class="text-center"> Copyright &copy Niranjan's Blog 2016 </p>        
    
          </footer>
     <script type="text/javascript" src="/ui/main.js"></script>
    <!-- jQuery (necessary for Bootstrap's JavaScript plugins) -->
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js"></script>
    <!-- Include all compiled plugins (below), or include individual files as needed -->
    <script src="js/bootstrap.min.js"></script>
    
    <script>
        $(document).ready(function(){
        $('[data-toggle="tooltip"]').tooltip();
         });
    </script>

</body>

</html>

`;

return htmlTemplate;
}


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
