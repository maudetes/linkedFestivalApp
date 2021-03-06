var add;
var conf;

var as;
var details;
var detailsUri;
 
window.onload = function () {
var sparqlArtists = function() {
  var q = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                      "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                                      "PREFIX mo: <http://purl.org/ontology/mo/>\n" +
                                      "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
                                      "SELECT ?object ?property { ?object rdf:type mo:MusicGroup. ?object foaf:name ?property FILTER regex(str(?object), 'dbpedia')}";
  console.log(q);
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


details = new Vue({
  el: '#Details'
})

as = new Vue({
  el: '#Selector',
  data: {
    items: [
        /*{label: 'Franz Ferdinand', value:'http://www.own.org#FranzFerdinand'}*/
    ],
    checked: [],
    types:[{label:'genre', value:'http:\/\/dbpedia\.org\/ontology\/genre'},
           {label:'activeYearsStartYear', value:'http:\/\/dbpedia\.org\/ontology\/activeYearsStartYear'},
           {label:'label', value:'http:\/\/dbpedia\.org\/property\/label'},
           {label:'origin', value:'http:\/\/dbpedia\.org\/property\/origin'}],
    checkedType: ['http:\/\/dbpedia\.org\/ontology\/genre', 'http:\/\/dbpedia\.org\/ontology\/activeYearsStartYear',
                  'http:\/\/dbpedia\.org\/property\/label', 'http:\/\/dbpedia\.org\/property\/origin' ],
    preparedSparql: preparedSparql
  },
  watch: {
    checked: function(curVal){preparedSparql(curVal, as.checkedType)},
    checkedType: function(curVal){preparedSparql(as.checked, curVal)}
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
        artist:{color: "#14F787", borderColor: "#14F787"},
        artistSelected:{color: "#14F787", borderColor: "#12a55c", radius:15}
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

var preparedSparql = function(MusicGroupList, typeList) {

  // clearing everything
  var nodeId = 0;
  conf.dataSource= {nodes:[], edges:[]};

  if(!MusicGroupList.length || !typeList.length){
    $('#alchemy>svg').remove();
    alchemy = new Alchemy(conf);
    return;
  }


  console.log(MusicGroupList);

  var allAdd = "(";
  typeList.forEach(function(elem){
    allAdd += elem + "|";
  });
  allAdd = allAdd.substring(0,allAdd.length-1);
  allAdd += ")";

  var sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
            "PREFIX owl: <http://www.w3.org/2002/07/owl#> \n" +
            "PREFIX mo: <http://purl.org/ontology/mo/>\n" +
            "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
            "SELECT ?name ?remote ?relation ?remote_value ?similar_artist ?similar_name  \n" +
            "WHERE \n" +
            "{ \n";

  MusicGroupList.forEach(function(MusicGroup){
    sp += "{ " +
          "  <" + MusicGroup + "> foaf:name ?name. \n" +
          "  SERVICE <http://dbpedia.org/sparql> \n" +
          "  { \n" +
          "    <" + MusicGroup + "> ?relation ?remote_value. \n" +
          "  } \n" +
          "   FILTER regex(str(?relation), '"+ allAdd +"'). \n" +
          "   FILTER regex(str(?remote_value), '(?!.*[*]).+'). \n" +
          "   BIND ('"+ MusicGroup +"' as ?remote) \n" +
          "} UNION \n" +
          "{ \n" +
          "  ?similar_artist foaf:name ?similar_name. \n" +
          "  SERVICE <http://dbpedia.org/sparql> \n" +
          "  { \n" +
          "    <" + MusicGroup + "> ?relation ?remote_value. \n" +
          "    ?similar_artist ?relation ?remote_value. \n" +
          "  } \n" +
          "   FILTER regex(str(?relation), '"+ allAdd +"'). \n" +
          "   FILTER (?similar_artist != '" + MusicGroup + "') \n" +
          "   FILTER regex(str(?remote_value), '(?!.*[*]).+'). \n" +
          "} UNION \n";
  })

  sp = sp.substring(0, sp.length-7)
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
              if (MusicGroupList.indexOf(cur.remote.value)!==-1)
                node.role+="Selected"
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
              if (MusicGroupList.indexOf(cur.similar_artist.value)!==-1)
                node.role+="Selected"
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
      $('#alchemy>svg').remove();
      conf.dataSource=graph;
      alchemy = new Alchemy(conf);
      //alchemy.startGraph(graph);

      alchemy.get.allNodes().forEach(function(n){ console.log(n.id); $("g>#node-"+n.id).on("click", function(){
        console.log("clicked "+n._properties.uri);
        details.$children[0].uri = n._properties.uri;
      } 
        );    })
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