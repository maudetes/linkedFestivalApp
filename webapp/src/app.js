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

      var conf = {
        dataSource: {nodes:[], edges:[]},
//        forceLocked: false,
        graphHeight: function(){ return 800; },
        graphWidth: function(){ return 1000; },
//        linkDistance: function(){ return 60; },
        nodeTypes:{
            role: ["artist", "genre"]
            },
        nodeStyle:{
        artist:{color: "#14F787", borderColor: "#14F787"}
        }
      };

      alchemy = new Alchemy(conf);

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

      var artistNodeId = existingNode(id);
      if (artistNodeId == -1){
        artistNodeId = alchemy.get.nodes().all()._el.length;
        alchemy.create.nodes([{caption:id, id:artistNodeId, role:'artist'}])
      }

      alchemy.startGraph();

      var graph = res.results.bindings.reduce(function(acc, cur) {
          var value = cur.remote_value.value.split("/")[cur.remote_value.value.split("/").length -1];
          var role = cur.relation.value.split("/")[cur.relation.value.split("/").length -1];
          var pos = existingNode(value);
          if (pos == -1){
            pos = alchemy.get.nodes().all()._el.length + acc.nodes.length;
            var node = {
              caption: value,
              id: pos,
              role: role
            }
            acc.nodes.push(node);
          }

          edge = {
            source: artistNodeId,
            target: pos
          }
          acc.edges.push(edge);


          var similar_sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
                    "PREFIX own: <http://www.own.org#> " +
                    "PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
                    "SELECT ?similar_name  " +
                    "WHERE " +
                    "{ " +
                    "  ?remote rdf:type <http://www.own.org#MusicGroup> .  " +
                    "  ?remote own:name ?similar_name .  " +
                    "  SERVICE <http://dbpedia.org/sparql> " +
                    "  { " +
                    "    ?remote <" + cur.relation.value + "> <" + cur.remote_value.value + "> . " +
                    "  } " +
                    "  FILTER (?similar_name != '" + id + "') " +
                    "}";

//          if (cur.remote_value.value == "http://dbpedia.org/resource/Indie_pop")
            fetchSimilar(pos, similar_sp, 0);

          return acc;
      }, {nodes:[], edges:[]});


      alchemy.create.nodes(graph.nodes)
      alchemy.create.edges(graph.edges);

      alchemy.startGraph();

      console.log(graph);

  });

};

function fetchSimilar(pos, sp, attempts){

    if(attempts>=3){
        console.log("not working");
        console.log(sp);
        return;
    }

    var timeout = Math.floor(Math.random() * 10000);

    setTimeout(function(){sparql(sp).then(function(similar){
        if (similar.results.bindings.length>0){
            similar.results.bindings.forEach(function(elem){
                var id = existingNode(elem.similar_name.value);
                if (id == - 1){
                    id = alchemy.get.nodes().all()._el.length + similar.results.bindings.indexOf(elem);
                    var node = {
                      "caption": elem.similar_name.value,
                      "id": id,
                      "role": "artist"
                    }
                    alchemy.create.nodes([node])
                }
                var edge = {
                  "source": pos,
                  "target": id
                }

                alchemy.create.edges([edge]);

                alchemy.startGraph();

            });
        }
    }).catch(function(){
      fetchSimilar(pos, sp, attempts+1);
    });}, timeout);

}

var existingNode = function(nodeName){
    var id = -1;
    alchemy.get.nodes().all()._el.forEach(function(elem){
        if (elem.getProperties().caption == nodeName)
            id = elem.id;
    })
    return id;
}