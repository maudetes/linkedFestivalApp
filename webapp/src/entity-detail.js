
Vue.component('entity-detail', {
    template: '<div style="padding:10px;"><div v-for="album in albums"><a style="color:black;" v-bind:href="album.artist.resource_url">{{album.artist.name}}</a><br><span style="font-weight: bold">{{album.title}} ({{album.year}})</span>'+
    '<div><img style="width: 150px; padding:0;margin:0;" v-bind:src="album.image" /></div></div></div>',
    data: function() {
        var data = {
            albums: [],
            uri: ""
        }
            

        return data;
    },
    watch: {
        'uri': function(){
            console.log("querying ..");
            this.albums=[];
            this.sparql();
        }
    },
    methods: {
        sparql: function() {
                var that = this;
            var visualize = function(object) {
                var discogsObjects = object.results.bindings.map(function(b) {
                    that.discogs(b.discogsMaster.value).then(function(o){
                        var album = {};
                        album.videos= o.videos;
                        album.title = o.title;
                        album.artist = o.artists[0];
                        album.year = o.year;
                        album.image = o.images[0].uri150 || null;
                        that.albums.push(album);
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
"       ?b <http://dbpedia.org/ontology/artist> <"+this.uri+"> .  \n" +
"       ?b rdf:type <http://dbpedia.org/ontology/Album> .  \n" +
"       ?b owl:sameAs ?o .  \n" +
"       FILTER regex(str(?o), 'wikidata.org') .  \n" +
"     }  \n" +
"     SERVICE <https://query.wikidata.org/bigdata/namespace/wdq/sparql>  \n" +
"     {  \n" +
"	    ?o wdp:P1954 ?discogsMaster  \n" +
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
                        token: "HxAqGJKHxYowersBmpatDXkaBoxtnMnfAdHSeynp"
                    },
                    success: resolve,
                    error: reject
                });
        });
        }
    }

});