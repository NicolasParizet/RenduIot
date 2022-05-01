//MQTT

char myCert[2056]; // global variable

WiFiClientSecure tlsClient;
WiFiClient unsecureClient;
    
#if TLS
  PubSubClient client(tlsClient);
   
  String mqttServer = "cb9352df34b14539b54d146c17d94190.s2.eu.hivemq.cloud";
  int mqttPort = 8883;
  
  char* id = "toto";
  char* login = "NicoPolo";
  char* pwd = "Toto1994.";
#else

  PubSubClient client(unsecureClient);

  String mqttServer = "test.mosquitto.org";
  int mqttPort = 1883;

  char* id = "nicop";
  char* login = "nicop";
  char* pwd = "nicop";
#endif  

//Vérifie présence du fichier ca.pem
//et ecrit le contenue dans myCert
void checkCA(){
  if(!SPIFFS.begin(true)){
    Serial.println("An Error has occurred while mounting SPIFFS");
    return;
  }

  File certAut = SPIFFS.open("/ca.pem");
  if(!certAut){
    Serial.println("Failed to open file for reading");
    return;
  }
  Serial.println("File Content:");

  int i = 0;

  //Serial.println(certAut.readString());
 
  while (certAut.available()) {
    //Serial.write(certAut.read());
    myCert[i] = certAut.read();
    i++;
  }

  //Serial.println(myCert);
  certAut.close();
}

void mqttPubCallback(char* topic, byte* message, unsigned int length) {
  String msgTmp;
  for(int i = 0 ; i < length ; i++) {
    msgTmp += (char) message[i];
  }
  Serial.println("msg : ");
  Serial.println(msgTmp);
  Serial.println("topic : ");
  Serial.println(topic);

  if(topic == "/test") {
    // process => save data ect
    Serial.println("test");
  }
    if(topic == "iot/M1Miage2022") {
    // process => save data ect
    Serial.println("iot/M1Miage2022");
  }
}

void setupMqttClient(char* topic) {
  //set server
  if(TLS){
    tlsClient.setCACert(myCert);
  }
  client.setBufferSize(1024); // augmente la taille maximale du message envoyé
  client.setServer(mqttServer.c_str(), mqttPort);
  client.setCallback(mqttPubCallback);
}

void mqttSubscribe(char* topic) {
  if (!client.connected()){
    mqttConnect();
  }
  client.subscribe(topic);
  Serial.println("subscribe :");
  Serial.println(topic);
}

void mqttConnect() {
  while (!client.connected()) {
    Serial.println("Attempting MQTT connection ...");
    if(client.connect(id, login, pwd)) {
       Serial.println("Connected");
    }
    else {
      Serial.println("connection failed");
      Serial.println(client.state());
      delay(2500);
    }
  }
}

void mqttPublish(char* topic, DynamicJsonDocument doc) {
  String docStringyfied;
  bool pubOk;
  serializeJson(doc, docStringyfied);

  int l = docStringyfied.length();
  char data[l+1];

  strcpy(data, docStringyfied.c_str());
  Serial.println("data :");
  Serial.println(data);

  pubOk = client.publish(topic, data);

  Serial.println(pubOk);
}

void mqttClientLoop(){
  client.loop();
}
