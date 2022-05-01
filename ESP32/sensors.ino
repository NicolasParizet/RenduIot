//hardware declaration
OneWire oneWire(23);
DallasTemperature tempSensor(&oneWire);
const int ledGreen = 19;
const int ledRed = 5;

//valeurs à retourner par l'esp
int lightSensor;  //light
float temp;   //temp
bool redOn = 0;   //chauffage
bool greenOn = 0;   //clim

//var pour gérer le chauffage/climatisation + jour/nuit
const int lightCheck = 150;
//jour
const int SHJ = 22;
const int SBJ = 21;
//nuit
const int SHN = 22;
const int SBN = 21;
    
    
    /* --------- SENSORS FUNCTION --------- */

void initSensors(){
  tempSensor.begin();
  pinMode(ledGreen, OUTPUT);
  pinMode(ledRed, OUTPUT);
}

//fonction permettant de lire et enregistrer la valeur de la température
String readTemp() {
  tempSensor.requestTemperaturesByIndex(0);
  temp = tempSensor.getTempCByIndex(0);
  return String(temp);
}

//fonction permettant de lire et enregistrer la valeur de la lumière
String readLight() {
  lightSensor = analogRead(A5);
  return String(lightSensor);
}

//Vérifie les valeurs des capteurs et allume le chauffage ou clim en fct
void checkSensorsToEnableDevices(){
    if(lightSensor > lightCheck){ //jour
    if(temp < SBJ){
      digitalWrite(ledRed, HIGH);
      redOn = 1;
    } 
    else if(temp > SHJ){
      digitalWrite(ledGreen, HIGH);
      greenOn = 1;
    }
    else {
      digitalWrite(ledRed, LOW);
      digitalWrite(ledGreen, LOW);
      redOn = 0;
      greenOn = 0;
    }
  }

    if(lightSensor < lightCheck){ //nuit
    if(temp < SBN){
      digitalWrite(ledRed, HIGH);
      redOn = 1;
    } 
    else if(temp > SHN){
      digitalWrite(ledGreen, HIGH);
      greenOn = 1;
    }
    else {
      digitalWrite(ledRed, LOW);
      digitalWrite(ledGreen, LOW);
      redOn = 0;
      greenOn = 0;
    }
  }
}
