//
//See post: https://asmaloney.com/2014/01/code/creating-an-interactive-map-with-leaflet-and-openstreetmap/

var map = L.map('map', {
    center: [20.0, 5.0],
    minZoom: 2,
    zoom: 2,
})

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a', 'b', 'c'],
}).addTo(map)


var myURL = jQuery('script[src$="map.js"]')
    .attr('src')
    .replace('map.js', '')

var myIcon = L.icon({
    iconUrl: myURL + 'images/pin24.png',
    iconRetinaUrl: myURL + 'images/pin48.png',
    iconSize: [29, 24],
    iconAnchor: [9, 21],
    popupAnchor: [0, -14],
})

var markers = []

function addMarker(user, mac, lat, long) {
    
    let marker = L.marker([lat, long], { icon: myIcon })
        .bindPopup(user)
        .on("click", (m) => {findMac(m.latlng.lat, m.latlng.lng)});
    map.addLayer(marker);
    markers.push({user:user, mac: mac, marker: marker});
}

// Trouve l'addresse mac correspondante a la lat/long du point
function findMac(lat, long){
    markers.forEach((m) => {
        if (m.marker._latlng.lat == lat && m.marker._latlng.lng == long) {
            updateGraphs(m.user, m.mac);
        }
    });
}

//=== Recuperation dans le Node JS server des samples de l'ESP et 
//=== Alimentation des charts ====================================
function get_users(path_on_node) {
    node_url = 'https://iotpn007537m1.herokuapp.com'
    $.ajax({
        url: node_url.concat(path_on_node), 
        type: 'GET',
        headers: { Accept: "application/json", },
        success: function (resultat, statut) { 
            let present;
            for (var i = 0; i < resultat.length; ++i) {
                present = false;
                if (markers.length > 0) {
                    markers.forEach((m) => {
                        if (m.marker._latlng.lat == resultat[i].lat && m.marker._latlng.lng == resultat[i].long) {
                            present = true;
                            return;
                        }
                    });
                }
                if(!present){
                    addMarker(resultat[i].user, resultat[i].who, resultat[i].lat, resultat[i].long)
                }
                console.log(markers);
            }
        },
        error: function (resultat, statut, erreur) {
            console.log(erreur);
        },
        complete: function (resultat, statut) {
        }
    });
}

//=== Installation de la periodicite des requetes GET============

const refreshT = 10000 // Refresh period for chart

// Récupère la liste des users qui publient pour les afficher sur la carte
get_users('/who');

window.setInterval(get_users,
    refreshT,
    '/who');      