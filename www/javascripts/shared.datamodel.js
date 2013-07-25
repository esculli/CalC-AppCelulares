var jsonData = null;

$(document).ready(function () {
    loadData();

    $(".filtroZona").change(function () {
        notifyFiltersChanged();
    });
    $(".filtroEmpresa").change(function () {
        notifyFiltersChanged();
    });
    $(".filtroSoloProximosHorarios").change(function () {
        var divHora = $(this).siblings("div");
        if ($(this).is(":checked"))
            divHora.hide();
        else 
            divHora.css("display", "inline-block");

        notifyFiltersChanged();
    });

    $(".filtroHora").change(function () {
        notifyFiltersChanged();
    });
    $(".filtroMinutos").change(function () {
        notifyFiltersChanged();
    });
    $(".filtroAMPM").change(function () {
        notifyFiltersChanged();
    });
});


function loadData() {
    if (jsonData == null) {
        $.ajaxSetup({ cache: false });
        $.get("/sitio.data", function (result) {
            //jsonData = Combis.Crypto.Desencriptar(result);
			jsonData = result;
            notifyDataLoaded();
        });
    }
}

function notifyDataLoaded() {
    if (typeof onDataLoaded == 'function') { 
        onDataLoaded();
    }
    notifyFiltersChanged();
}

function notifyFiltersChanged() {
    if (typeof onFiltersChanged == 'function') {
        onFiltersChanged();
    }
}

function getAllData() {
    return jsonData.Zonas;
}

function getFilteredData(filterTime) {
    // if jsonData is not loaded, return
    if (jsonData == null) return null;

    if (filterTime == null) filterTime = true;

    var filtroZona = $(".filtroZona").val();
    var filtroEmpresa = $(".filtroEmpresa").val();
    var time = getTime();
    
    var zonas = jQuery.extend(true, {}, jsonData.Zonas);

    //HACK: JSLINQ(zonas).WHERE no funciona y no es necesario ahora.
    //if (filtroZona != "") {
    //    zonas = JSLINQ(zonas)
    //        .Where(function (x) { return filtroZona == x.Zona }).items;
    //}

    $.each(zonas, function (key, zona) {
        if (filtroEmpresa != "") {
            zona.Empresas = JSLINQ(zona.Empresas)
                .Where(function (x) { return filtroEmpresa == x.Nombre }).items;
        }
        
        $.each(zona.Empresas, function (key, empresa) {
            $.each(empresa.Recorridos, function (key, ramal) {
                if (filterTime) {
                    ramal.Ida.Horarios = JSLINQ(ramal.Ida.Horarios)
                        .Where(function (x) { return x > time }).items;
                    ramal.Vuelta.Horarios = JSLINQ(ramal.Vuelta.Horarios)
                        .Where(function (x) { return x > time }).items;
                }
            });
        });
    });

    return zonas;
}

function getNearAndFollowingCombis(lat, lng) {
    var data = getFilteredData(false);
    if (data == null) return null;

    var time = getTime();
    var horarios = [];

    $.each(data, function (key, zona) {
        $.each(zona.Empresas, function (key, empresa) {
            $.each(empresa.Recorridos, function (key, ramal) {
                calculateNearAndFollowing(horarios, zona, empresa, ramal, ramal.Ida, "ida", lat, lng, time);
                calculateNearAndFollowing(horarios, zona, empresa, ramal, ramal.Vuelta, "vuelta", lat, lng, time);
            });
        });
    });

    horarios = JSLINQ(horarios)
                .OrderBy(function (x) { return x.horarioParada; })
                .Take(10)
                .items;

    $.each(horarios, function (i, value) {
        value.letra = String.fromCharCode('A'.charCodeAt() + i);
    });
    
    return horarios;
}

function calculateNearAndFollowing(horarios, zona, empresa, ramal, vuelta, recorrido, lat, lng, time) {

    // Obtengo la parada mas proxima a la ubicacion actual
    var paradaProxima = JSLINQ(vuelta.Paradas)
                            .OrderBy(function (x) { return getDistance(x[0], x[1], lat, lng); })
                            .First();

    // Chequeo si la parada mas proxima no esta muy alejada
    if (paradaProxima == null ||
        getDistance(paradaProxima[0], paradaProxima[1], lat, lng) > 0.015) {
        return;
    }
    
    // Calculo la distancia entre el lugar de salida de la combi y la parada mas cercana
    var distanciaDesdeInicioRecorrido = 0;
    var paradaAnterior = null;
    $.each(vuelta.Paradas, function (key, parada) {
        if (paradaAnterior != null) {
            distanciaDesdeInicioRecorrido += getDistance(paradaAnterior[0], paradaAnterior[1], parada[0], parada[1]);
        }
        if (parada == paradaProxima) {
            return false;
        }
        else {
            paradaAnterior = parada;
        }
    });

    // Obtengo los minutos de demora desde la salida hasta la parada proxima
    var minutosDemoraHastaParada = distanciaDesdeInicioRecorrido * 500;

    // Obtengo el horario de salida mas cercano para la proxima parada
    $.each (JSLINQ(ramal.Ida.Horarios)
            .Where(function (x) { return addMinutesToTime(x, minutosDemoraHastaParada) > time }).items, 
            function (key, horarioSalida) {

        // Calculo el horario por el que la combi pasa por la parada mas cercana
        var horarioParada = addMinutesToTime(horarioSalida, minutosDemoraHastaParada);
        var horarioParadaEn = getDifferenceInMinutes(horarioParada, time);
        horarios.push({
            paradaProxima: paradaProxima,
            horarioSalida: horarioSalida,
            horarioParada: horarioParada,
            horarioParadaEn: horarioParadaEn,
            distancia: getDistanceInKm(paradaProxima[0], paradaProxima[1], lat, lng),
            recorrido: recorrido,
            vuelta: vuelta,
            ramal: ramal,
            empresa: empresa,
            zona: zona
        });
    });
}

function getTime() {
    var filtroSoloProximosHorarios = $(".filtroSoloProximosHorarios").is(":checked");

    if (filtroSoloProximosHorarios) {
        return getCurrentTime();
    }
    else {
        var hour = parseInt($(".filtroHora").val(), 10);
        if (hour == 12) hour = 0;
        var minutes = parseInt($(".filtroMinutos").val(), 10);
        var ampm = $(".filtroAMPM").val();
        return getStringTime(new Date(0, 0, 0, (ampm == "AM") ? hour : hour + 12, minutes, 0, 0));
    }
}

function getCurrentTime() {
    var currentTime = new Date();
    return getStringTime(currentTime);
}

function getStringTime(date) {
    var hours = date.getHours().toString();
    var minutes = date.getMinutes().toString();
    if (hours.length == 1) hours = "0" + hours;
    if (minutes.length == 1) minutes = "0" + minutes;
    return hours + ":" + minutes;
}

function addMinutesToTime(dateString, minutes) {
    var date = new Date(0, 0, 0, dateString.split(":")[0], parseInt(dateString.split(":")[1], 10) + minutes);
    return getStringTime(date);
}

function getDifferenceInMinutes(dateString1, dateString2) {
    var date1 = new Date(0, 0, 0, dateString1.split(":")[0], dateString1.split(":")[1]);
    var date2 = new Date(0, 0, 0, dateString2.split(":")[0], dateString2.split(":")[1]);
    var diff = date1 - date2;
    
    var hours = parseInt(diff / (1000 * 60 * 60), 10);
    var minutes = parseInt((diff - (hours * 1000 * 60 * 60)) / (1000 * 60), 10);

    var result = "";
    if (hours > 0) {
        result += hours.toString() + "h ";
    }
    result += minutes.toString() + "'";
    return result;
}

function getDistance (lat1, lng1, lat2, lng2)
{
    var distance = Math.sqrt(square(lat1 - lat2) + square(lng1 - lng2));
    return distance;
}

function getDistanceInKm(lat1, lng1, lat2, lng2) {
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2 - lat1).toRad();  // Javascript functions in radians
    var dLon = (lng2 - lng1).toRad();
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return parseInt(d * 1000, 10); // Distance in mts
}

function square (x) {
    return x * x;
}

if (typeof (Number.prototype.toRad) === "undefined") {
    Number.prototype.toRad = function () {
        return this * Math.PI / 180;
    }
}