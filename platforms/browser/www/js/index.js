/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        //app.receivedEvent('deviceready');

        console.log("Device ready");
        session_id = "7Dvnd4aSVpu0XEHF";
        $(document).ready(function() {
            renderMapPage();
        });

    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};


//================================================================================
// Navigazione tra le pagine
//================================================================================
function renderMapPage() {
    /***
     * Funzione che carica la pagina della mappa nel div content,
     * richiama loadmap() che carica la mappa e vengono assegnati gli
     * on click ai pulsanti.
     */
    $("#content").load("./pages/mappa.html", function () {
        loadMap();
        $('a#btn-ranking').on('click', renderRankingPage);
        $('a#btn-profilo').on('click', renderProfilePage);
    });
}

function renderRankingPage() {
    $("#content").load("./pages/ranking.html", function () {
        $('#btn-mappa').on('click', renderMapPage);
        getRanking();
    });
}

function renderProfilePage() {
    $(".cordova-camera-select").remove(); // per risolvere bug dei "scegli file" che rimangono sulle altre pagine
    $("#content").load("./pages/profilo.html", function () {
        getProfile();
        $('#btn-mappa').on('click', renderMapPage);
        $('#btn-modificaprofilo').on('click', renderEditProfilePage);
    });
}

function renderEditProfilePage() {
    $("#content").load("./pages/modificaprofilo.html", function () {
        $('#btn-annulla').on('click', renderProfilePage);
        $('#btn-conferma').on('click', setProfile);
        $("#btn-caricaimmagine").on('click', openFilePicker);
    });
}

function renderFightEat(monsterCandy, imgMC) {
    $("#content").load("./pages/fighteat.html", function () {
        $('#btn-mappa').on('click', renderMapPage);
        $('#btn-azione').on('click', monsterCandy, function(e){
            renderEsito(monsterCandy);
        });
        showFightEat(monsterCandy,imgMC);
    });
}

function renderEsito(monsterCandy) {
    $("#content").load("./pages/esito.html", function () {
        $('#btn-mappa').on('click', renderMapPage);
        showEsito(monsterCandy);
    });
}


//================================================================================
// Ranking functions
//================================================================================
function getRanking() {
    $.ajax({
        method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/ranking.php",
        data: JSON.stringify({session_id: session_id}),
        dataType: 'json',
        success: function (result) {
            console.log(result);
            showRanking(result);
        },
        error: function (error) {
            console.error(error);
        }
    });
}

function showRanking(result) {
    console.log(result.ranking);
    jQuery.each(result.ranking, function (index, player) {
        $('#table-ranking tbody').append(
            '<tr>' +
            '<td>'+(parseInt(index)+1)+'</td>' +
            '<td>'+player.username+'</td>' +
            '<td>'+player.xp+'</td>' +
            '<td>'+player.lp+'</td>' +
            '</tr>');
    });
}


//================================================================================
// Profile functions
//================================================================================
function getProfile() {
    $.ajax({
        method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/getprofile.php",
        data: JSON.stringify({session_id: session_id}),
        dataType: 'json',
        success: function (result) {
            console.log(result);
            showProfileInfo(result);
        },
        error: function (error) {
            console.error(error);
        }
    });
}

function showProfileInfo(result){
    let username = result.username;
    let img = result.img;
    let xp = result.xp;
    let lp = result.lp;

    $("#img-profile").attr("src","data:image/png;base64,"+img);
    $("#username").html(username);
    $("#xp").append(xp);
    $("#lp").append(lp);
}


//================================================================================
// Set Profile functions
//================================================================================
function setProfile() {
    let new_img = $("#new-img").attr("src") ? $("#new-img").attr("src").split(",")[1] : undefined;
    let new_username = $("#new-username").val();
    let flag = false;   // va a true se almeno uno tra img e username è impostato correttamente

    let JSONdata = {};
    JSONdata["session_id"] = session_id;

    if (new_img !== undefined && new_img.length <= 137000){
        JSONdata['img'] = new_img;
        flag = true;
    }
    if (new_username !== undefined && new_username !== "" && new_username.length <= 15){
        JSONdata['username'] = new_username;
        flag = true;
    }
    console.log(flag);

    if(flag==true) {
        $.ajax({
            method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/setprofile.php",
            data: JSON.stringify(JSONdata),
            dataType: 'json',
            success: function (result) {
                console.log(result);
                renderProfilePage();
            },
            error: function (error) {
                console.error(error);
            }
        });
    }else{
        $("#alert-wronginput").show();
    }

}

/* Setta le opzioni per l'upload dell'immagine */
function setOptions(srcType) {
    var options = {
        quality: 20,
        // Usiamo FILE.URI per evitare problemi di gestione della memoria
        destinationType: Camera.DestinationType.FILE_URI,
        sourceType: srcType,
        encodingType: Camera.EncodingType.JPEG,
        mediaType: Camera.MediaType.PICTURE,
        allowEdit: true,
        correctOrientation: true  //Corrects Android orientation quirks
    };
    return options;
}

function openFilePicker() {
    $(".cordova-camera-select").remove();   // per risolvere bug dei "scegli file" multipli che rimangono aperti quando si preme più volte il pulsante modifica immagine.

    var srcType = Camera.PictureSourceType.SAVEDPHOTOALBUM;
    var options = setOptions(srcType);

    navigator.camera.getPicture(function cameraSuccess(imageUri) {
        console.log("Immagine caricata: "+imageUri);
        if (imageUri.substr(0, 5) == 'file:') {
            //in android imageURI contiene il path
            console.log("Caricamento immagine su Android");
            getFileContentAsBase64(imageUri, function (imgBase64) {
                $("#new-img").attr("src", imgBase64);
            });
        }else {
            //su browser restituisce l'immagine in base64
            console.log("Caricamento immagine su browser");
            $("#new-img").attr("src", "data:image/jpeg;base64, " + imageUri);
            //$(".cordova-camera-select").remove(); // per risolvere bug dei "scegli file" multipli che rimangono aperti quando si preme più volte il pulsante modifica immagine.
        }
    }, function cameraError(error) {
        console.debug("Unable to obtain picture: " + error, "app");
    }, options);

}

/**
 * Questa funzione converte il path di un'immagine in una stringa Base64
 *
 * @path string
 * @callback funzione che riceve come primo parametro il risultato della conversione
 */
function getFileContentAsBase64(path, callback){
    window.resolveLocalFileSystemURL(path, gotFile, fail);

    function fail(e) {
        alert('Cannot found requested file');
    }

    function gotFile(fileEntry) {
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function(e) {
                var content = this.result;
                callback(content);
            };
            // The most important point, use the readAsDatURL Method from the file plugin
            reader.readAsDataURL(file);
        });
    }
}



function modificaProfilo() {

}


//================================================================================
// Fight eat functions
//================================================================================
function showFightEat(monsterCandy, imgMC){
    $("#img-mostro-caramella").attr("src","data:image/png;base64,"+imgMC);
    $("#nome-mostro-caramella").html(monsterCandy["name"]);
    switch (monsterCandy["size"]){
        case "S":
            $("#dimensione-mostro-caramella").html("Piccole dimensioni");
            break;
        case "M":
            $("#dimensione-mostro-caramella").html("Medie dimensioni");
            break;
        case "L":
            alert('Hey');
            $("#dimensione-mostro-caramella").html("Grandi dimensioni");
            break;
        default:
            console.log("default");
    }

    switch (monsterCandy["type"]){
        case "MO":
            document.querySelector('#btn-azione').innerText = 'AFFRONTA';
            break;
        case "CA":
            document.querySelector('#btn-azione').innerText = 'MANGIA';
            break;
        default:
            console.log("default");
    }
//    $('#btn-azione').onclick = function() {renderEsito(monsterCandy)};
}

function showEsito(monsterCandy){
    console.log("ID " + monsterCandy["id"]);
    $.ajax({
        method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/fighteat.php",
        data: JSON.stringify({session_id: session_id,target_id: monsterCandy["id"]}),
        dataType: 'json',
        success: function (result) {
            console.log("Ajax fighteat " + JSON.stringify(result));
            switch (monsterCandy["type"]){
                case "MO":
                    if(result["died"]==true){
                        $("#esito").html("Sei morto");
                    }else{
                        $("#esito").html("Hai sconfitto il mostro");
                    }
                    break;
                case "CA":
                    $("#esito").html("Buon appetito!");
                    break;
                default:
                    console.log("default");
            }
            $("#xp").append(result.xp);
            $("#lp").append(result.lp);
        },
        error: function (error) {
            console.error(error);
        }
    });
}


//================================================================================
// Mappa
//================================================================================
function loadMap(){
    mapboxgl.accessToken = 'pk.eyJ1IjoiYmlhZ2lvaW9yaW8iLCJhIjoiY2szNzFrbHNrMDYxaDNtbXVwdHFjZGNlZCJ9.dHOFVyNISqy9Oo6AfATxMg';

    //aggiornamento posizione
    var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { timeout: 1000 });
    function onSuccess(position) {
        var lat = position.coords.latitude;
        var lon = position.coords.longitude;
        console.log('Latitude: '  + lat + 'Longitude: '  + lon);
    }
    function onError() {
        console.log("errore");
    }

    //Creazione della mappa, con stile, posizione e zoom iniziale
    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [9.191383, 45.464211],
        zoom: 5
    });

    // Aggiunge un bottone per seguire la posizione corrente sulla mappa
    map.addControl(
        new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        })
    );

    //chiamata elenco caramelle e mostri
    $.ajax({
        method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/getmap.php",
        data: JSON.stringify({session_id: session_id}),
        dataType: 'json',
        success: function (result) {
            var mapObjects = result["mapobjects"];
            for(let x in mapObjects){
                var el = mapObjects[x];
                //console.log(el);
                setImages(el);
            }
        },
        error: function (error) {
            console.error(error);
        }
    });

    //prende un oggetto e mostra l'immagine geolocalizzata
    function setImages(el){
        $.ajax({
            method: 'post', url: "https://ewserver.di.unimi.it/mobicomp/mostri/getimage.php",
            data: JSON.stringify({session_id: session_id,target_id: el["id"]}),
            dataType: 'json',
            success: function (result) {
                //----------------------
                map.on('load', function() {
                    map.loadImage(
                        "data:image/png;base64," + result["img"],
                        function (error, image) {
                            if (error) throw error;
                            map.addImage(el["name"], image);
                            map.addLayer({
                                'id': el["id"],
                                'type': 'symbol',
                                'source': {
                                    'type': 'geojson',
                                    'data': {
                                        'type': 'FeatureCollection',
                                        'features': [
                                            {
                                                'type': 'Feature',
                                                'geometry': {
                                                    'type': 'Point',
                                                    'coordinates': [el["lon"], el["lat"]]
                                                }
                                            }
                                        ]
                                    }
                                },
                                'layout': {
                                    'icon-image': el["name"],
                                    'icon-size': 0.25
                                }
                            }).on('click', el["id"], function(e) {
                                renderFightEat(el, result["img"]);
                                console.log(el["id"]);
                                console.log(el["name"]);
                                console.log(el["type"]);
                            });
                        }
                    );
                });
                //----------------------
            },
            error: function (error) {
                console.error(error);
            }
        });
    }

}