
Vue.component('entity-detail', {
    template: '<div @click="sparql">{{uri}} <img v-for="image in images" v-bind:src="image"/></div>',
    props: ['uri'],
    data: function() {
        var data = {
            images: []
        }
            

        return data;
    },

    methods: {
        sparql: function() {
                var that = this;
            var visualize = function(object) {

                var discogsObjects = object.results.bindings.map(function(b) {
                    that.discogs(b.discogsMaster.value).then(function(o){
                        console.log(o);
                        that.images = that.images.concat(o.images.map(function(i){return i.uri150}));
                    });
                });

            }
            this.uri;
var queryString = 
"PREFIX owl: <http://www.w3.org/2002/07/owl#>  \n" +
"PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>  \n" +
"PREFIX wdp: <http://www.wikidata.org/prop/direct/>  \n" +
"SELECT *  \n" +
"WHERE {  \n" +
"     SERVICE <http://dbpedia.org/sparql>  \n" +
"     {   \n" +
"       ?b <http://dbpedia.org/ontology/artist> <http://dbpedia.org/resource/Two_Door_Cinema_Club> .  \n" +
"       ?b rdf:type <http://dbpedia.org/ontology/Album> .  \n" +
"       ?b owl:sameAs ?o .  \n" +
"       FILTER regex(str(?o), 'wikidata.org') .  \n" +
"     }  \n" +
"     SERVICE <https://query.wikidata.org/bigdata/namespace/wdq/sparql>  \n" +
"     {  \n" +
"	?o wdp:P1954 ?discogsMaster  \n" +
"     }  \n" +
"}";
     
            sparql(queryString).then(visualize);
        },
        discogs: function(mastersId) {
             return new Promise(function(resolve, reject){
                $.ajax({
                    type: 'GET',
                    url: "https://api.discogs.com/masters/"+mastersId,
                    data: {
                        token: "mJWkFSgCdaggtQYomeTwILcXKjHwnlbBPiBkKDQq"
                    },
                    success: resolve,
                    error: reject
                });
        });
        }
    }

});