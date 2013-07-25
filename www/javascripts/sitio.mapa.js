var map = null;
var marks = null;
var routes = null;
var currentPosition = null;
var horarios = null;

$(document).ready(function () {
    initializeMap();
    getCurrentPosition();
});

function initializeMap() {
    var latlng = new google.maps.LatLng(-34.617952, -58.484447);
    var myOptions = {
        zoom: 11,
        center: latlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);

    google.maps.event.addListener(map, 'click', function (event) {
        if (currentPosition == null) {
            setcurrentPosition(event.latLng, false);
        }
    });
}

function refreshInformation() {
    if (currentPosition != null) {
        var newHorarios = getNearAndFollowingCombis(currentPosition.lat(), currentPosition.lng());
        if (newHorarios == null) return null;
        horarios = newHorarios;

        clearMap();
        $("#nextCombis").empty();

        if (horarios.length > 0) {
            $("#noResults").hide();

            var source = $("#nextCombisTemplate").html();
            var template = Handlebars.compile(source);

            for (var i in horarios) {
                var itemRendering = $(template(horarios[i]));
                itemRendering.data('item', horarios[i]);
                $("#nextCombis").append(itemRendering);
            }

            setMarks();
            centerMap();
        }
        else {
            $("#noResults").show();
        }
    }
}

function onFiltersChanged() {
    refreshInformation();
}

function setcurrentPosition(location, useSensor) {
    $("#noGeolocation").hide();

    currentPosition = location;
    map.setCenter(currentPosition);
    var marker = new google.maps.Marker({
        position: currentPosition,
        icon: '/images/marks/person.png',
        map: map,
        draggable: true
    });
    google.maps.event.addListener(marker, 'dragend', function (event) {
        currentPosition = event.latLng;
        refreshInformation();
    });

    refreshInformation();

    $.post('/mapa/trafficdata', { trafficdata: [useSensor, location.lat(), location.lng()] });
}

function clearMap() {
    if (marks != null) {
        $.each(marks, function (key, mark) {
            mark.setMap(null);
        });
    }

    if (routes != null) {
        $.each(routes, function (key, route) {
            route.setMap(null);
        });
    }
}

function setMarks(data) {
    marks = [];
    routes = [];

    for (var i = horarios.length - 1; i >= 0; i--) {
        horario = horarios[i];

        var latlng = new google.maps.LatLng(horario.paradaProxima[0], horario.paradaProxima[1]);
        horario.mark = addMark(latlng, 'http://googlemapsmarkers.com/v1/' + horario.letra + '/' + horario.empresa.Color + '/', horario.ramal);
        google.maps.event.addListener(horario.mark, 'click', function (e) {
            $(".proximoHorario[data-mark=" + this.icon.substring(32, 33) + "]").find(".info").click();
        });


        drawRoute(currentPosition, latlng, horario.empresa.Color);
    }
}

function addMark(latlng, icon, ramal) {
    var mark = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: icon
    });

    marks.push(mark);

    return mark;
}

function drawRoute(origin, destination, color) {
    if (origin == null) {
        return;
    }
    var directionServices = new google.maps.DirectionsService();
    directionServices.route( { origin: origin, destination: destination, travelMode: google.maps.TravelMode.WALKING },
    function (response, status) {
        if (status == google.maps.DirectionsStatus.OK) {
            var polylineOptionsActual = { strokeColor: '#' + color, strokeOpacity: 0.5, strokeWeight: 3 };
            var directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true, polylineOptions: polylineOptionsActual, map: map, preserveViewport: true });
            directionsDisplay.setDirections(response);
            routes.push(directionsDisplay);
        }
    });
}

function centerMap() {
    if (marks.length == 0) return;

    var bound = new google.maps.LatLngBounds();
    for (i in marks) {
        bound.extend(marks[i].getPosition());
    }
    bound.extend(currentPosition);

    map.fitBounds(bound);
    map.setCenter(bound.getCenter());
}

function getCurrentPosition() {
    if (navigator.geolocation) { // Try W3C Geolocation (Preferred)
        navigator.geolocation.getCurrentPosition(function (position) {
            setcurrentPosition(new google.maps.LatLng(position.coords.latitude, position.coords.longitude), true);
        });
    }
    else if (google.gears) { // Try Google Gears Geolocation
        var geo = google.gears.factory.create('beta.geolocation');
        geo.getCurrentPosition(function (position) {
            setcurrentPosition(new google.maps.LatLng(position.latitude, position.longitude), true);
            map.setCenter(initialLocation);
            var marker = new google.maps.Marker({
                position: initialLocation,
                map: map
            });
        });
    }
}