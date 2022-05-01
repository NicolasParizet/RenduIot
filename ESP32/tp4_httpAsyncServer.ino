#include <WiFi.h>
#include "classic_setup.h"
#include "server_setup.h"
#include "sensors.h"
#include "utilities.h"
#include <SPIFFS.h>
#include "OneWire.h"
#include "DallasTemperature.h"
#include "AsyncTCP.h"
#include "ESPAsyncWebServer.h"
#include "ArduinoJson.h"
#include "PubSubClient.h"
#include <HTTPClient.h>

#define TLS 0   //changer la valeur a 1 pour passer en connexion sécurisée via HiveMQ

#if TLS
  char* mqttTopic = "/test";
#else
  char* mqttTopic = "iot/M1Miage2022";
#endif

unsigned long lastTime = 0;

// Temps d'attente entre chaque loop() 
unsigned long loop_period = 300L * 1000; // pub toutes les 5 min

// Instanciation of a "Web server" on port 80 
AsyncWebServer server(80);

bool checkPost = 0; //allow POST in loop()

//doc json
DynamicJsonDocument doc(1024);

    /* --------- ARDUINO FUNCTION --------- */
void setup(){ 
  Serial.begin(9600);

  initSensors();

  checkSPIFFS();
  
  while (!Serial); // wait for a serial connection. Needed for native USB port only
  connect_wifi(); // Connexion Wifi  
  print_network_status();
  Serial.write("server begin");

  initialiseServerEvent();
  if(TLS){
    checkCA();    
  }
  setupMqttClient(mqttTopic);
  mqttConnect();
  mqttSubscribe(mqttTopic);

  server.begin(); // Lancement du serveur
}

void loop() {
  static uint32_t tick = 0;

  if(millis() - tick < loop_period) {
    goto END;
  }
  tick = millis();

  
  readTemp();
  readLight();
  
  checkSensorsToEnableDevices(); 

  editJsonDoc();

  if(checkPost){
    postNode();
  }

  mqttPublish(mqttTopic, doc);
  
  lastTime = millis(); 
  END:
  mqttClientLoop();
}
