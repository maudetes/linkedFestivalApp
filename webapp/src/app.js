var add;
var results = {};

var sparql = function(sparql, func) {
//var sparqlEndpoint = 'http://localhost:8889/sparql/dataset';
  var sparqlEndpoint = 'http://localhost:3330/dataset';
  $.ajax({
    type: 'GET',
    url: sparqlEndpoint,
    data: {query: sparql},
    async: false,
    success: function(data){
      console.log(data);
      func(data);
    },
    error: function(xhr, type){
      alert('error ajax ' + sparql);
    }
  });
};

var treatmentRes = function(jsonRes) {
  jsonRes = JSON.parse(jsonRes);
  console.log(typeof jsonRes);

  jsonRes.results.bindings.forEach(function(elem){
    var array = elem.remote_value.value.split("/"); 
    results[array[array.length-1]] = [];
  });
};
  
var treatmentSimilar = function(jsonRes) {
  jsonRes = JSON.parse(jsonRes);
  console.log(typeof jsonRes);

  jsonRes.results.bindings.forEach(function(elem){
    console.log(elem);
    var name = elem.similar_name.value.split("/");
    name = name[name.length-1];
    var music = elem.remote_value.value.split("/"); 
    music = music[music.length-1];
    if(results[music] == null){
      results[music] = [name];
    }
    else {
      results[music].push(name)
    }
  });

  console.log(results);

};

var printing = function(){
  var print = "";
  for (var music in results){
    print += "<b>" + music + "</b>" ;
    results[music].forEach(function(name){
      print += " " + name;
    });
    print += "<br>"
  }
  document.getElementById("res").innerHTML = print;
  console.log(print);
};

var preparedSparql = function(id, type) { 

  results = {};

  console.log(id + " " + type);

  var typeOnt = ["genre", "activeYearsStartYear", "birthDate", "birthPlace" ];
  var typePro = ["label"];


  if(typeOnt.indexOf(type) != -1)
      add = "http://dbpedia.org/ontology/";
  if(typePro.indexOf(type) != -1)
      add = "http://dbpedia.org/property/";

  add += type;

  var sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX own: <http://www.own.org#> " +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
            "SELECT ?local ?remote ?remote_value  " +
            "WHERE " +
            "{ " +
            "  ?local own:name '" + id + "' .  " +
            "  ?local owl:sameAs ?remote .  " +
            "  SERVICE <http://live.dbpedia.org/sparql> " +
            "  { " +
            "    ?remote <"+ add + "> ?remote_value " +
            "  } " +
            "}";

  var sp2 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX own: <http://www.own.org#> " +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
            "SELECT ?local ?remote ?remote_value ?similar_name " +
            "WHERE " +
            "{ " +
            "  ?local own:name '" + id + "' .  " +
            "  ?local owl:sameAs ?remote .  " +
            "  ?similar_local own:name ?similar_name .  " +
            "  ?similar_local owl:sameAs ?similar_remote .  " +
            "  FILTER ('" + id + "' != ?similar_name) . " +
            "  SERVICE <http://live.dbpedia.org/sparql> " +
            "  { " +
            "    ?remote <"+ add + "> ?remote_value ." +
            "    ?similar_remote <"+ add + "> ?remote_value  " +
            "  } " +
            "}";

  var sp3 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                            "PREFIX ns: <http://www.own.org#>\n" +
                            "SELECT ?p ?o { ns:Pression ?p ?o }";
  console.log(sp);
  sparql(sp3, function(res) {
   // var res = JSON.parse(json);
    var graph = res.results.bindings.reduce(function(acc, cur) {
        var node = {
          caption: cur.p.value,
          id: acc.nodes.length
        }
        edge = {
          source: 0,
          target: acc.nodes.length
        }
        acc.nodes.push(node);
        acc.edges.push(edge);

        return acc;
    }, {nodes:[], edges:[]});

    alchemy.begin({dataSource: graph});
  });
  //sparql(sp2, treatmentSimilar);

  printing();

};


//alchemy = new Alchemy({});


