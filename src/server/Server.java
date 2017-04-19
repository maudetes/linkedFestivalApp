package server;


import org.apache.jena.rdf.model.*;
import org.apache.jena.reasoner.Reasoner;
import org.apache.jena.reasoner.ReasonerRegistry;
import org.apache.jena.fuseki.embedded.FusekiEmbeddedServer;
import org.apache.jena.query.*;
import org.apache.jena.reasoner.ValidityReport;
import org.apache.jena.riot.RDFDataMgr;
import org.apache.jena.sparql.core.DatasetGraph;
import org.apache.jena.sparql.core.DatasetGraphFactory;
import org.apache.jena.system.Txn;
import org.apache.jena.util.FileManager;
import org.apache.jena.util.PrintUtil;
import org.apache.jena.vocabulary.ReasonerVocabulary;
import org.eclipse.jetty.server.Handler;
import org.eclipse.jetty.server.HandlerContainer;
import org.eclipse.jetty.server.handler.DefaultHandler;
import org.eclipse.jetty.server.handler.HandlerList;
import org.eclipse.jetty.servlet.*;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import javax.servlet.DispatcherType;
import javax.servlet.FilterRegistration.Dynamic;
import javax.servlet.ServletContext;
import java.io.File;
import java.util.EnumSet;

/**
 * Created by maurice on 3/31/17.
 */
//curl https://musicbrainz.org/artist/d7613e57-4383-454a-8b26-b1e7c28cb740/tags -H "Accept: application/ld+json, application/json" -k > json-ld.txt^C

public class Server {
    private static final String BASE_URI = "http://example.com";

    public Server() {
        Model schema = FileManager.get().loadModel("file:onto.ttl");
        Model data = FileManager.get().loadModel( "file:seine.rdf");

        Reasoner reasoner = ReasonerRegistry.getOWLReasoner();
        reasoner = reasoner.bindSchema(schema);

        Dataset ds = DatasetFactory.create();
        InfModel infmodel = ModelFactory.createInfModel(reasoner, data);
        ds.setDefaultModel(infmodel);

        FusekiEmbeddedServer fuseki = FusekiEmbeddedServer.create()
                .add("/dataset", ds)
                .build() ;

        ServletContextHandler context = (ServletContextHandler) fuseki.getJettyServer().getHandler();
        context.setContextPath("/");

        ServletHolder staticResources = new ServletHolder("resources", DefaultServlet.class);
        staticResources.setInitParameter("resourceBase","./webapp/resources/");
        staticResources.setInitParameter("dirAllowed","false");
        staticResources.setInitParameter("pathInfoOnly","true"); //
        context.addServlet(staticResources,"/resources/*");


        ServletHolder def = new ServletHolder("default", DefaultServlet.class);
        def.setInitParameter("resourceBase","./webapp/src/");
        def.setInitParameter("dirAllowed","false");
        context.addServlet(def,"/");


        fuseki.start() ;


        String sq = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX ns: <http://www.own.org#>\n" +
                "SELECT ?s ?p { ?s ?p ns:ActiveStage }";

        try (QueryExecution qExec = QueryExecutionFactory.create(sq , infmodel) ) {
            ResultSet rs = qExec.execSelect();
            ResultSetFormatter.out(rs) ;
        }

        String sq1 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\n" +
                "PREFIX ns: <http://www.own.org#>\n" +
                "SELECT ?p ?o { ns:MusicEvent1 ?p ?o }";

        try (QueryExecution qExec = QueryExecutionFactory.create(sq1 , infmodel) ) {
            ResultSet rs = qExec.execSelect();
            ResultSetFormatter.out(rs) ;
        }

    }

    public static void main(String[] args) {
        Server server = new Server();

    }
}
