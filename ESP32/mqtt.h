void checkCA();
void mqttPubCallback(char* topic, byte* message, unsigned int length);
void setupMqttClient();
void mqttSubscribe(char* topic);
void mqttConnect();
void mqttPublish(char* topic, DynamicJsonDocument doc);
void mqttClientLoop();
