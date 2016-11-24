function loadArticles () {
        // Check if the user is already logged in
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState === XMLHttpRequest.DONE) {
            var articles = document.getElementById('articles');
            if (request.status === 200) {
                var articleData = JSON.parse(this.responseText);
                var content = '';
                for (var i=0; i< articleData.length; i++) {
                     content += `
                                <a href="/${articleData[i].title}">
                                <h2 class="post-title">
                                     ${articleData[i].heading}
                                </h2>
                                </a>
                    <p>Posted by ${articleData[i].author}</a> on (${articleData[i].date.split('T')[0]})</p>`;
                }
               articles.innerHTML = content;
            } else {
                articles.innerHTML('Oops! Could not load all articles!')
            }
        }
    };
    
    request.open('GET', '/get-articles', true);
    request.send(null);
}
// Now this is something that we could have directly done on the server-side using templating too!
loadArticles();