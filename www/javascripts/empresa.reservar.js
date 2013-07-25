var empresa = null;
var map = null;

function onDataLoaded() {
    var empresaNombre = $("#empresa").val();
    empresa = JSLINQ(getAllData()).SelectMany(function (x) { return x.Empresas; }).First(function (x) { return x.Nombre == empresaNombre; });


	var reservarTipo = $("#type").val();
	if (reservarTipo == "create") {
		$("font#horarioText").text("Horario");
	} 
	
	
    var ramalSelect = $("#ramal");
    $.each(empresa.Recorridos, function (index, recorrido) {
        ramalSelect.append($("<option />").val(this.Descripcion).text(this.Descripcion));
    });

    refrescarParadas();
    refrescarHorarios();
    refrescarMapa();
	
	$("button.reservar").removeAttr("disabled");
}

$(document).ready(function () {
    $(".persistir").persist();
    initializeMap();
});

function initializeMap() {
    try {
        var latlng = new google.maps.LatLng(-34.603718, -58.381584);
        var myOptions = {
            zoom: 15,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            disableDefaultUI: true
        };
        map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    }
    catch (ex) { }
}

function activateButton(button) {
    $(button).addClass("active");
    $(button).siblings().removeClass("active");
}

function ramalChanged() {
    refrescarParadas();
    refrescarMapa();
    refrescarHorarios();
}

function recorridoChanged() {
    refrescarParadas();
    refrescarMapa();
    refrescarHorarios();
}

function paradaChanged() {
    refrescarMapa();
    refrescarHorarios();
}

function paradaCercanaChanged() {
    refrescarMapa();
}

function diaChanged() {
    refrescarHorarios();
}


function refrescarParadas() {
    var recorridoIda = $("#recorridoIda").hasClass("active");

    var ramal = getRamalActual();
    var recorrido = (recorridoIda) ? ramal.Ida : ramal.Vuelta;

    var paradaSelect = $("#parada");
    paradaSelect.empty();

    $.each(recorrido.Paradas, function (index, parada) {
        var text = this[0] + ',' + this[1];
        if (this[2] != null) {
            text = this[2];
        }
        var option = $("<option />").val(text).text(text).attr('latlng', this[0] + ',' + this[1]);

        paradaSelect.append(option);
    });

}

function refrescarMapa() {
    var paradaSelect = $("#parada");
    var buscarParadaCercana = $("#paradaCercana").is(":checked");
    
    if (buscarParadaCercana) {
        var paradaProxima = JSLINQ(ramal.Ida.Paradas)
                            .OrderBy(function (x) { return getDistance(x[0], x[1], lat, lng); })
                            .First();

        paradaSelect.val(paradaProxima);
    }

    try {
        var datalatlng = paradaSelect.find('option:selected').attr('latlng');
        var latlng = new google.maps.LatLng(datalatlng.split(',')[0], datalatlng.split(',')[1]);

        map.setCenter(latlng);
        var marker = new google.maps.Marker({
            position: latlng,
            map: map
        });
    } catch (ex) { }
}

function refrescarHorarios() {
    var paradaSelect = $("#parada");
    var recorridoIda = $("#recorridoIda").hasClass("active");
    var diaHoy = $("#diaHoy").hasClass("active");

    var ramal = getRamalActual();
    var recorrido = (recorridoIda) ? ramal.Ida : ramal.Vuelta;

    var horarios = recorrido.Horarios;
    if (diaHoy) {
        var time = getCurrentTime();
        horarios = JSLINQ(horarios).Where(function (x) { return x > time }).items;
    }
    
    var horariosDiv = $("#horario");
    horariosDiv.empty();
	
	var horariosAnteriorSelect = $("#horarioAnterior");
	horariosAnteriorSelect.empty();

    if (horarios.length > 0) {
        $.each(horarios, function () {
            horariosDiv.append("<div><input type='checkbox' name='horario' value='" + this + "' />" + this + "</div>");
			
			var option = $("<option />").val(this).text(this);
			horariosAnteriorSelect.append(option);
        });
    }
    else {
        horariosDiv.append("<div>No hay horarios para mostrar</div>");
    }
    
}

function validarReserva() {
    var isValid = true;
	
	var horarioAnteriorVisible = $("select#horarioAnterior:visible").size();
    var horarioAnterior = $("select#horarioAnterior").val();
    var horarioAnteriorControlGroup = $("select#horarioAnterior").parents(".control-group");
    if (horarioAnteriorVisible && horarioAnterior == null || horarioAnterior == "") {
        isValid &= false;
        horarioAnteriorControlGroup.addClass("error");
    }
    else {
        horarioAnteriorControlGroup.removeClass("error");
    }
	
	var horarioVisible = $("div#horario:visible").size();
    var horario = $("div#horario input[type=checkbox]:checked").val();
    var horarioControlGroup = $("div#horario").parents(".control-group");
    if (horarioVisible && horario == null || horario == "") {
        isValid &= false;
        horarioControlGroup.addClass("error");
    }
    else {
        horarioControlGroup.removeClass("error");
    }

    var nombre = $('input[type=text]#nombre').val();
    var nombreControlGroup = $("input[type=text]#nombre").parents(".control-group");
    if (nombre == "") {
        isValid &= false;
        nombreControlGroup.addClass("error");
    }
    else {
        nombreControlGroup.removeClass("error");
    }

    var email = $('input[type=text]#email').val();
    var emailControlGroup = $("input[type=text]#email").parents(".control-group");
    if (email == "") {
        isValid &= false;
        emailControlGroup.addClass("error");
    }
    else {
        emailControlGroup.removeClass("error");
    }
	
	var telefono = $('input[type=text]#telefono').val();
    var telefonoControlGroup = $("input[type=text]#telefono").parents(".control-group");
    if (telefono == "") {
        isValid &= false;
        telefonoControlGroup.addClass("error");
    }
    else {
        telefonoControlGroup.removeClass("error");
    }

    if (isValid) {
        var recorridoIda = $("button#recorridoIda").hasClass("active");
        var recorrido = (recorridoIda) ? "Ida" : "Vuelta";
        $("input[type=hidden]#recorrido").val(recorrido);

        var diaHoy = $("button#diaHoy").hasClass("active");
        var diaManana = $("button#diaManana").hasClass("active");
        var dia = (diaHoy) ? "Hoy" : ((diaManana) ? "Manana" : "Otro dia");
        $("input[type=hidden]#dia").val(dia);

        return true;
    }
    else {
        return false;
    }
}

function getRamalActual() {
    var ramalSelect = $("#ramal");
    var ramal = JSLINQ(empresa.Recorridos).First(function (x) { return x.Descripcion == ramalSelect.val(); });
    return ramal;
}
