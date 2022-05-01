//
// Cote UI de l'application "lucioles"
//
// Auteur : G.MENEZ
// RMQ : Manipulation naive (debutant) de Javascript
//

var which_esps = []

function init() {
    //=== Initialisation des traces/charts de la page html ===
    // Apply time settings globally
    Highcharts.setOptions({
	global: { 
            useUTC: false,
            type: 'spline'
	},
	time: {timezone: 'Europe/Paris'}
    });
    chart1 = new Highcharts.Chart({
        title: {text: 'Temperatures'},
	subtitle: { text: 'Irregular time data in Highcharts JS'},
        legend: {enabled: true},
        credits: false,
        chart: {renderTo: 'container1'},
        xAxis: {title: {text: 'Heure'}, type: 'datetime'},
        yAxis: {title: {text: 'Temperature (Deg C)'}},
        series: [],
        colors: ['red', 'green', 'blue', 'orange', 'purple'],
        plotOptions: {
            line: {
                dataLabels: {enabled: true},
                enableMouseTracking: true
            }
        }
    });
    chart2 = new Highcharts.Chart({
        title: { text: 'Lights'},
        legend: {title: {text: 'Lights'}, enabled: true},
        credits: false,
        chart: {renderTo: 'container2'},
        xAxis: {title: {text: 'Heure'},type: 'datetime'},
        yAxis: {title: {text: 'Lumen (Lum)'}},
	series: [],
	colors: ['red', 'green', 'blue', 'orange', 'purple'],
        plotOptions: {line: {dataLabels: {enabled: true},
			     enableMouseTracking: true
			    }
		     }
    });
};

function updateGraphs(user, mac) {
    console.log(which_esps);
    let present = false;
    which_esps.forEach((esp) => {
        if (esp == mac) {
            present = true;
            return;
        }
    });
    if (!present) {
        console.log("on ajoute " + mac);
        which_esps.push(mac);
        chart1.addSeries({name:user, data:[]});
        chart2.addSeries({name:user, data:[]});
        console.log(which_esps);
        process_esp(mac, which_esps.length - 1);
    } else {
        let index = which_esps.indexOf(mac);
        which_esps.splice(index, 1);
        chart1.series[index].remove();
        chart2.series[index].remove();
    }
}


//=== Installation de la periodicite des requetes GET============
function process_esp(esp, i){
    const refreshT = 10000 // Refresh period for chart
    console.log(i);

    // Gestion de la temperature
    // premier appel pour eviter de devoir attendre RefreshT
    callAllGetSamples('/getData', chart1.series[i], chart2.series[i], esp);
    //calls a function or evaluates an expression at specified
    //intervals (in milliseconds).
    window.setInterval(callAllGetSamples,
		       refreshT);
}

//Définir plusieurs setInterval ne fonctionne pas en js, il faudrait faire du multi-threading
function callAllGetSamples(){
    let l = which_esps.length;
    for(let i = 0; i < l ; i++){
        esp = which_esps[i];
        get_samples('/getData', chart1.series[i], chart2.series[i], esp);
    }
}

//=== Recuperation dans le Node JS server des samples de l'ESP et 
//=== Alimentation des charts ====================================
function get_samples(path_on_node, serieTemp, serieLight, who){
    // path_on_node => help to compose url to get on Js node
    // serie => for choosing chart/serie on the page
    // wh => which esp do we want to query data

    node_url = 'https://iotpn007537m1.herokuapp.com/'

    $.ajax({
        url: node_url.concat(path_on_node),
        type: 'GET',
        headers: { Accept: "application/json" },
	    data: {"who": who}, // parameter of the GET request
        success: (resultat, statut) => { // Anonymous function on success
            let listeDataTemp = [];
            let listeDataLight = [];
            resultat.forEach(function (element) {
                listeDataTemp.push([Date.parse(element.date),element.status.temperature]); 
                listeDataLight.push([Date.parse(element.date),element.status.light]);
            });
            serieTemp.setData(listeDataTemp); 
            serieLight.setData(listeDataLight);
        },
        error: function (resultat, statut, erreur) {
        },
        complete: function (resultat, statut) {
        }
    });
}

//assigns the onload event to the function init.
//=> When the onload event fires, the init function will be run. 
window.onload = init;


