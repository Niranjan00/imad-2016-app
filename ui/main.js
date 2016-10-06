// Conter updated code

var button = document.getElementById('counted');
var counter = 0 ;

button.onclick = function(){
    
    counter = counter + 1;
    var span = document.getElementById('count');
    span.innerHTML = counter.toString();
};
