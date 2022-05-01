// Importation des modules
let path = require('path');
const mqtt = require('mqtt')
const {MongoClient} = require('mongodb');
const express = require('express');
const bodyParser = require('body-parser');


//Déclaration des variables globales
const app = express();

//liste des esp qui publient sur le topic du broker
let wholist = [];

//Détermine si les échanges avec le broker est sécurisée
const TLS = 0;

let mqttTopic;
let mqttUrl;

// On recupere le nom basique du topic du message
let key;

// Définie les variables a affecter pour la connexion au serveur MQTT
// En fonction du type d'échange
// Echange sécurisé
if(TLS){
  //Permet de lire un fichier
  let fs = require('fs');

  //récupère la clef d'accès
  tls_options = {
    ca: fs.readFileSync('ca.pem'),
    rejectUnauthorized: false
  }

  // Topics MQTT
  mqttTopic = '/test'

  var mqttOptions = {
    host: 'cb9352df34b14539b54d146c17d94190.s2.eu.hivemq.cloud',
    port: '8883',
    clientId: 'toto',
    username: 'NicoPolo',
    password: 'Toto1994.',
    protocol: "mqtts",
    protocolId: "MQTT",
    protocolVersion: 4,
    ca: fs.readFileSync('ca.pem'),
  };
} else { // Echange non sécurisé
  mqttUrl = 'http://test.mosquitto.org:1883'
  // Topics MQTT
  mqttTopic = 'iot/M1Miage2022'
}



//----------------------------------------------------------------
// asynchronous function named main() where we will connect to our
// MongoDB cluster, call functions that query our database, and
// disconnect from our cluster.
async function initMongoMQTT(){

  const mongoName = "NicoMongo"                   //Nom de la base
  const mongoUri = 'mongodb+srv://NicoPolo:Toto1994.@nicomongo.euhkz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority'; //URL de connection		
 
  //Now that we have our URI, we can create an instance of MongoClient.
  const mgClient = new MongoClient(mongoUri,
            {useNewUrlParser:true, useUnifiedTopology:true});

  // Connect to the MongoDB cluster
  mgClient.connect(function(err,  mgClient){
    if(err) throw err; // If connection to DB failed ... 
    console.log("Co mongoDB OK")
    
    //===============================================    
    // Print databases in our cluster
    listDatabases(mgClient);

    //===============================================    
    // Get a connection to the DB "lucioles" or create
    dbo = mgClient.db(mongoName);

    // Remove "old collections : temp and light
    dbo.listCollections({name: "M1Miage2022"}).next(function(err, collinfo) {
      if (collinfo) { // The collection exists
          //console.log('Collection temp already exists');
          dbo.collection("M1Miage2022").drop() 
      }
    });
  });

	//===============================================
	// Connexion au broker MQTT distant
	//

  if(TLS){ // version sécurisée
    var client_mqtt = mqtt.connect(mqttOptions);
  } else { // non sécurisée
    var client_mqtt = mqtt.connect(mqttUrl);
  }
	
  // Récupère la dernière valeur du topic en fonction du serveur mqtt
  key = path.parse(mqttTopic.toString()).base;
	
	//===============================================
	// Des la connexion, le serveur NodeJS s'abonne aux topics MQTT 
	//
	client_mqtt.on('connect', function () {
    console.log("mqtt co ok")
    client_mqtt.subscribe(mqttTopic, function (err) {
      console.log("sub ok", mqttTopic)
      if (!err) {
          console.log('Node Server has subscribed to ', mqttTopic);
      }
    });
	});
	//================================================================
	// Callback de la reception des messages MQTT pour les topics sur
	// lesquels on s'est inscrit.
	// => C'est cette fonction qui alimente la BD !
	//
	client_mqtt.on('message', function (topic, message) {
	    console.log("\nMQTT msg on topic : ", topic.toString());
	    console.log("Msg payload : ", message.toString());

      if(!isJson(message)){
        console.log('not a Json object');
        return;
      }

	    // Parsing du message
	    message = JSON.parse(message);

      let status;
      let info;
      let reporthost;
      let regul;

      // Contrôle de la structure du Json
      if (message.status != null && message.info != null
        && message.reporthost != null && message.regul != null) {
          console.log("Json bien formé");
          status = message.status;
          info = message.info; 
          reporthost = message.reporthost;
          regul = message.regul;
      } else {
        console.log("L'objet Json non valide");
        return;
      }

      // Contrôle des valeurs requises du Json
      if (info.ident == null || info.loc == null || info.user == null){
        console.log("Objet info mal construit")
        return;
      } 
      
      // Fonction permettant malgré tout d'essayer de decoder si loc est un string
      if(isJson(message.info.loc)){
        message.info.loc = JSON.parse(message.info.loc);
      }
      
      //Contrôle des données
      if (isNaN(status.temperature) || isNaN(status.light) 
      || isNaN(info.loc.lgn) || isNaN(info.loc.lat)) {
        console.log("Données du Json incorrectes");
        return;
      }



	    // liste de who pour savoir qui publie sur le topic et utilise le node server	
      let wh = message.info.ident;
      let index = wholist.findIndex(x => x.who == wh)
      if (index === -1) {
        wholist.push({ who: wh, user: message.info.user, lat: message.info.loc.lat, long: message.info.loc.lgn });
      }
      console.log("wholist using the node server :", wholist);

	    // Format des données stockées en BdD (dictionnaire)
	    let frTime = new Date().toLocaleString("sv-SE", {timeZone: "Europe/Paris"});
	    let newEntry = { 
        date: frTime,
        status: status,
        info: info,
        reporthost: reporthost,
        regul: regul
			};
	    
	    // Stocker le dictionnaire en BD
	    dbo.collection(key).insertOne(newEntry, function(err, res) {
		if (err) throw err;
		console.log("\nItem : ", newEntry, 
		"\ninserted in db in collection :", key);
	    });
  });
}



//================================================================
// Answering GET request on this node ... probably from navigator.
// => REQUETES HTTP reconnues par le Node
//================================================================
    
// Route / => Le node renvoie la page HTML affichant les charts
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/ui_lucioles.html'));
});

// Récupère les données stockées en BdD pour un esp
app.get('/getData', function (req, res) {
  console.log(req.originalUrl);
  //récupère la valeur du paramètre who passé dans l'URL
  who = req.query.who 
  
  console.log("\n--------------------------------");
  console.log("A client/navigator ", req.ip);
  console.log("sending URL ",  req.originalUrl);
  console.log("values from object ", who);
  
  // nb de lignes maximales a envoyer
  const nb = 200;
  console.log("info.ident ",who)
  dbo.collection(key).find({"info.ident":who}).sort({_id:-1}).limit(nb).toArray(function(err, result) {
    if (err) throw err;
    console.log('get on ', key);
    res.json(result.reverse()); // This is the response.
    console.log('end find');
  });
  console.log('end app.get');
});


// Permet de renvoyer la liste des addresses user avec leurs addresses mac
app.get('/who', function (req, res) {
  console.log(req.originalUrl);
  console.log("----------------------------------------REQUETE WHO-------------------------------------");

  console.log("\n--------------------------------");
  console.log("A client/navigator ", req.ip);
  console.log("sending URL ", req.originalUrl);

  res.json(wholist);

  console.log('end app.get');
});


//================================================================
// Functions
//================================================================

// Affiche la liste des BdD de notre cluster
async function listDatabases(client){
  databasesList = await client.db().admin().listDatabases();
  
  console.log("Databases in Mongo Cluster : \n");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
};

//Permet de vérifier si le message envoyé est bien au format Json
function isJson(str) {
try {
    JSON.parse(str);
} catch (e) {
    return false;
}
return true;
}


//================================================================
//==== Demarrage BD et MQTT =======================
//================================================================
initMongoMQTT().catch(console.error);

//====================================


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/')));
app.use(function(request, response, next) { //Pour eviter les problemes de CORS/REST
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "*");
    response.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE");
    next();
});


//================================================================
//==== Demarrage du serveur Web  =======================
//================================================================
// L'application est accessible sur le port 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('Server listening on port 3000');
});
