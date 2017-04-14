var add;
var results = {};

window.onload = function () {
var sparqlArtists = function() {
  var q = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                      "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                                      "PREFIX ns: <http://www.own.org#>\n" +
                                      "SELECT ?object ?property { ?object rdf:type ns:MusicGroup. ?object ns:name ?property }";
  sparql(q).then(function(data){
    as.items =data.results.bindings.map(function(r) {
        return {
            label: r.property.value,
            value: r.object.value
        };
        }
    );
  });
}

var as = new Vue({
  el: '#Selector',
  data: {
    items: [
        /*{label: 'Franz Ferdinand', value:'http://www.own.org#FranzFerdinand'}*/
    ],
    checked: [],
    preparedSparql: preparedSparql
  },
  beforeCreate: sparqlArtists
});

};


var sparql = function(sparql) {
  var sparqlEndpoint = 'http://localhost:3330/dataset';
  return new Promise(function(resolve, reject){
      $.ajax({
        type: 'GET',
        url: sparqlEndpoint,
        data: {query: sparql},
        async: false,
        success: resolve,
        error: reject
      });
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

var preparedSparql = function(id) {

  results = {};

  console.log(id);

  var sp3 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
            "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                            "PREFIX ns: <http://www.own.org#>\n" +
                            "SELECT ?p ?o { ns:Pression ?p ?o }";


  var typeOnt = ["genre", "activeYearsStartYear", "birthDate", "birthPlace" ];
  var typePro = ["label"];

  var allAdd = "(";

  typeOnt.forEach(function(elem){
    allAdd += "http:\/\/dbpedia\.org\/ontology\/" + elem + "|";
  });

  typePro.forEach(function(elem){
    allAdd += "http:\/\/dbpedia\.org\/property\/" + elem + "|";
  });

  allAdd = allAdd.substring(0,allAdd.length-1);
  allAdd += ")";

  var sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX own: <http://www.own.org#> " +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
            "SELECT ?remote ?relation ?remote_value  " +
            "WHERE " +
            "{ " +
            "  ?remote own:name '" + id + "' .  " +
            "  SERVICE <http://live.dbpedia.org/sparql> " +
            "  { " +
            "    ?remote ?relation ?remote_value " +
            "  } " +
            "  FILTER regex(str(?relation), '"+ allAdd +"')" +
            "}";

  sparql(sp).then(function(res) {
     // var res = JSON.parse(json);
      var graph = res.results.bindings.reduce(function(acc, cur) {
          var pos = acc.nodes.length + 1;
          var value = cur.remote_value.value.split("/")[cur.remote_value.value.split("/").length -1];
          var role = cur.relation.value.split("/")[cur.relation.value.split("/").length -1];

          var node = {
            caption: value,
            id: pos,
            role: role
          }
          edge = {
            source: 0,
            target: pos
          }
          acc.nodes.push(node);
          acc.edges.push(edge);

          return acc;
      }, {nodes:[{caption: id, id:0, role:"artist"}], edges:[]});

      console.log(graph);

      alchemy.begin({dataSource: graph, nodeTypes:{role: ["artist", "genre"]}, nodeStyle:{artist:{color: "#14F787", borderColor: "#14F787"}}});
  });

};


//alchemy = new Alchemy({});


