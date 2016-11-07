var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Pool = require('pg').Pool;

var config = {
    user : 'niranjan00',
    database : 'niranjan00',
    host : 'db.imad.hasura-app.io',
    port : '5432',
    password : process.env.DB_PASSWORD
    
    };


var app = express();
app.use(morgan('combined'));

var articles = {
     'article-one' : {
            title : 'Article One | Niranjan Kumar',
            heading : 'Article one',
            date : '6-November-2016',
            content:
                `<p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book
                </p>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book
                </p>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book
                </p>
                <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book
                </p>`
},
     'article-two' : {
            title: 'Article Two | Niranjan Kumar',
            heading: 'Article Two',
            date: '6-November-2016',
            content:
                `<p>
                It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).
            </p>`
    },
     'article-three' : {
        title: 'Article Three | Niranjan Kumar',
            heading: 'Article Three',
            date: '6-November-2016',
            content:
                `<p>
                 Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.
                 </p>`
    }

};

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
            ${date}
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


app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'ui', 'index.html'));
});

var pool = new Pool(config);
app.get('/test-db',function(req,res){
   //make a query
   pool.query("SELECT * FROM categories",function(err,result){
       if(err){
           res.status(500).send(err).toString();
       }else{
           res.send(JSON.stringify(result.rows));
       }
   });
});

var counter = 0 ;
app.get('/counter',function(req,res){
   counter = counter + 1;
   res.send(counter.toString());
});


app.get('/articles/:articleName',function(req,res){
    
    
    pool.query("SELECT * FROM article"+req.params.articleName ,function(err , result){
        if(err){
            res.status(500).send(err).toString();
        }else if(result.rows.length === 0){
            res.status(404).send('Article not found');
        }else{
            var articleData = result.rows[0];
            res.send(createTemplate(articles[articleName]));
        }
    } );
   
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
