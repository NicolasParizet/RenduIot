      /* --------- UTILITY FUNCTION --------- */

//Vérifie le bon fonctionnement du SPIFF
//ainsi que le présence du fichier statut.html
void checkSPIFFS(){
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  File file = SPIFFS.open("/statut.html");
  if(!file){
    Serial.println("Failed to open file for reading");
    return;
  }
  file.close();
}

//Edite les valeurs des capteurs dans le doc
void editJsonDoc(){
  doc["status"]["temperature"]  = temp;
  doc["status"]["light"]        = lightSensor;
  doc["status"]["ledHeater"]    = redOn;
  doc["status"]["ledCooler"]    = greenOn;
  doc["status"]["running"]      = true; //readSeries pour activer ou non l'activation radiateur / cooler

  doc["info"]["user"]           = "pn007537";
  doc["info"]["uptime"]         = String(lastTime/1000);
  doc["info"]["ssid"]           = String(WiFi.SSID());
  doc["info"]["ident"]          = String(WiFi.macAddress());
  doc["info"]["ip"]             = WiFi.localIP().toString();
  doc["info"]["loc"]["lat"]     = "7.184708";
  doc["info"]["loc"]["lgn"]     = "43.668709";

  doc["reporthost"]["target_ip"] = target_ip;
  doc["reporthost"]["target_port"] = target_port;
  doc["reporthost"]["sp"] = target_sp;

  doc["regul"]["threshold"] = lightCheck;
  doc["regul"]["sbn"] = SBN;
  doc["regul"]["shn"] = SHN;
  doc["regul"]["sbj"] = SBJ;
  doc["regul"]["shj"] = SHJ;

  Serial.println();
}
