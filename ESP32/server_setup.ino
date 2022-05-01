// Host for periodic data report (POST)
String target_ip = "";
int target_port = 0;
int target_sp = 0;

String outputPost; //POST content 

      /* --------- SERVER FUNCTION --------- */
//Initialise les évènements du serveur en fonction des URI et des méthodes http
void initialiseServerEvent(){
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(SPIFFS, "/statut.html", String(), false, processor); //processor
  });
  server.on("/temperature", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", String(temp));
  });
  server.on("/light", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", String(lightSensor));
  });
  server.on("/redOn", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", String(redOn));
  });
  server.on("/greenOn", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", String(greenOn));
  });

  //Post du formulaire permettant de récupérer l'adresse de l'host
  server.on("/target", HTTP_POST, [](AsyncWebServerRequest *request){
     //Serial.println("POST msg on /target !"); 
        if (request->hasArg("ip") && request->hasArg("port") && request->hasArg("sp")) {
            target_ip = request->arg("ip");
            target_port = atoi(request->arg("port").c_str());
            target_sp = atoi(request->arg("sp").c_str());
        }
        request->send(SPIFFS, "/statut.html", String(), false, processor);

        //passer var a true pour lancer postNode() dans loop
        checkPost = 1;
    });
}

//fonction permettant d'émettre un message http POST au serveur host définie via le navigateur
void postNode(){
  HTTPClient http;
  WiFiClient client;

  String serverName;
  //déclaration de l'addresse du server node red
  serverName = "http://" + target_ip + ":" + target_port + "/test";
  //Serial.println(serverName);
  
  // Your Domain name with URL path or IP address with path
  http.begin(client, serverName);

  // Specify content-type header
  http.addHeader("Content-Type", "application/json");

  //reset outputPost
  outputPost = "";
  
  // Convert JsonObject to String
  serializeJson(doc, outputPost);
  Serial.println(outputPost);
  
  // Data to send with HTTP POST
  int httpResponseCode = http.POST(outputPost);
  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);
  http.end();
}


//Permet de charger les templates de la page HTML
String processor(const String& var){
  if(var == "TEMPERATURE"){
    return readTemp();
  }
  if(var == "LIGHT"){
    return readLight();
  }
  if(var == "UPTIME"){
    return String(lastTime/1000);
  }
  if(var == "WHERE"){
    return "43.668709;7.184708";
  }
  if(var == "SSID"){
    return String(WiFi.SSID());
  }
  if(var == "MAC"){
    return String(WiFi.macAddress());
  }
  if(var == "IP"){
    return WiFi.localIP().toString();
  }
  if(var == "COOLER"){
    return String(greenOn);
  }
  if(var == "HEATER"){
    return String(redOn);
  }
  if(var == "SBJ"){
    return String(SBJ);
  }
  if(var == "SHJ"){
    return String(SHJ);
  }
  if(var == "SBN"){
    return String(SBN);
  }
  if(var == "SHN"){
    return String(SHN);
  }
  return String(); // securité => Permet d'éviter erreur memoire si appel template non retourné
}
