var add;
var conf;

var as;
window.onload = function () {
var sparqlArtists = function() {
  var q = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                      "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                                      "PREFIX ns: <http://www.own.org#>\n" +
                                      "SELECT ?object ?property { ?object rdf:type ns:MusicGroup. ?object ns:name ?property FILTER regex(str(?object), 'dbpedia')}";
  sparql(q).then(function(data){
    as.items =data.results.bindings.map(function(r) {
        return {
            label: r.property.value,
            value: r.object.value
        };
      }
    );
    as.items.sort(function(a, b){
     var nameA=a.label.toLowerCase(), nameB=b.label.toLowerCase();
     if (nameA < nameB) //sort string ascending
      return -1;
     if (nameA > nameB)
      return 1;
     return 0; //default return value (no sorting)
    });
  });
}


var details = new Vue({
  el: '#Details'
})

as = new Vue({
  el: '#Selector',
  data: {
    items: [
        /*{label: 'Franz Ferdinand', value:'http://www.own.org#FranzFerdinand'}*/
    ],
    checked: [],
    typeOnt:["genre", "activeYearsStartYear"],
    typePro:["label", "origin"],
    preparedSparql: preparedSparql
  },
  watch: {
    checked: preparedSparql
  },
  beforeCreate: sparqlArtists
});

      conf = {
        dataSource: {nodes:[], edges:[]},
//        directedEdges: true,
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
        success: resolve,
        error: reject
      });
  });
};

var preparedSparql = function(MusicGroupList) {

  // clearing everything
  var nodeId = 0;

  if(!MusicGroupList.length){
    alchemy = new Alchemy(conf);
    return;
  }


  console.log(MusicGroupList);

  var allAdd = "(";
  as.typeOnt.forEach(function(elem){
    allAdd += "http:\/\/dbpedia\.org\/ontology\/" + elem + "|";
  });
  as.typePro.forEach(function(elem){
    allAdd += "http:\/\/dbpedia\.org\/property\/" + elem + "|";
  });
  allAdd = allAdd.substring(0,allAdd.length-1);
  allAdd += ")";

  var sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
            "PREFIX own: <http://www.own.org#> " +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#> " +
            "SELECT ?name ?remote ?relation ?remote_value ?similar_artist ?similar_name  " +
            "WHERE " +
            "{ ";

  MusicGroupList.forEach(function(MusicGroup){
    sp += "{ " +
          "  <" + MusicGroup + "> own:name ?name. " +
          "  SERVICE <http://dbpedia.org/sparql> " +
          "  { " +
          "    <" + MusicGroup + "> ?relation ?remote_value. " +
          "  } " +
          "   FILTER regex(str(?relation), '"+ allAdd +"'). " +
          "   BIND ('"+ MusicGroup +"' as ?remote) " +
          "} UNION " +
          "{ " +
          "  ?similar_artist own:name ?similar_name. " +
          "  SERVICE <http://dbpedia.org/sparql> " +
          "  { " +
          "    <" + MusicGroup + "> ?relation ?remote_value. " +
          "    ?similar_artist ?relation ?remote_value. " +
          "  } " +
          "   FILTER regex(str(?relation), '"+ allAdd +"'). " +
          "   FILTER (?similar_artist != '" + MusicGroup + "') " +
          "} UNION "
  })

  sp = sp.substring(0, sp.length-6)
  sp += "} ";

  console.log(sp);

  sparql(sp).then(function(res) {
      console.log(res);

      var graph = res.results.bindings.reduce(function(acc, cur) {
          var relation = cur.relation.value.split("/")[cur.relation.value.split("/").length -1];
          var node, edge, artistId;

          if(cur.name){
            artistId = existingNode(cur.remote.value, acc);
            if (artistId == -1){
              artistId = nodeId;
              nodeId++;
              node = {
                caption: cur.name.value,
                id: artistId,
                role: 'artist',
                uri: cur.remote.value
              }
              acc.nodes.push(node);
            }
          } else { //similarArtist case
            artistId = existingNode(cur.similar_artist.value, acc);
            if (artistId == -1){
              artistId = nodeId;
              nodeId++;
              node = {
                caption: cur.similar_name.value,
                id: artistId,
                role: 'artist',
                uri: cur.similar_artist.value
              }
              acc.nodes.push(node);
            }
          }

          var propId = existingNode(cur.remote_value.value, acc);
          if (propId == -1){
            propId = nodeId;
            nodeId++;
            node = {
              caption: cur.remote_value.value.split("/")[cur.remote_value.value.split("/").length -1],
              id: propId,
              role: relation,
              uri: cur.remote_value.value
            }
            acc.nodes.push(node);
          }

          var doIT = true;
          acc.edges.forEach(function(elem){
            if(elem.source == artistId && elem.target == propId)
                doIT = false;
          })
          if (doIT){
              edge = {
                source: artistId,
                target: propId,
                caption: relation
              }
              acc.edges.push(edge);
          }

          return acc;
      }, {nodes:[], edges:[]});

      console.log(graph);
      alchemy = new Alchemy(conf);
      alchemy.startGraph(graph);
  });

};

var existingNode = function(nodeURI, acc){
    var id = -1;
    acc.nodes.forEach(function(elem){
        if (elem.uri === nodeURI)
            id = elem.id;
    });
    return id;
}