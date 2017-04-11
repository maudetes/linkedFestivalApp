var sparql = function(sparql) {
//var sparqlEndpoint = 'http://localhost:8889/sparql/dataset';
var sparqlEndpoint = 'http://localhost:3330/dataset';
$.ajax({
  type: 'GET',
  url: sparqlEndpoint,
  data: {query: sparql},
  success: function(data){
    console.log(data);
  },
  error: function(xhr, type){
    alert('error ajax');
  }
});

}



var preparedSparql = function(variable1, variable2) { 
var sp = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> " +
          "SELECT ?s ?p { ?s rdf:type ?p}";


}



Vue.component('polygraph', {
  props: ['triples'],
  template: '#polygraph-template',
  computed: {
    // a computed property for the polygon's points
    points: function () {
      var total = this.stats.length
      return this.stats.map(function (stat, i) {
        var point = valueToPoint(stat.value, i, total)
        return point.x + ',' + point.y
      }).join(' ')
    }
  },
  components: {
    // a sub component for the labels
    'axis-label': {
      props: {
        stat: Object,
        index: Number,
        total: Number
      },
      template: '#axis-label-template',
      computed: {
        point: function () {
          return valueToPoint(
            +this.stat.value + 10,
            this.index,
            this.total
          )
        }
      }
    }
  }
})





new Vue({
  el: '#app',
  data: {
    foo: {}
  },
  methods: {
    bar: function (e) {
      e.preventDefault()
      this.foo = {};
    }
  }
})

