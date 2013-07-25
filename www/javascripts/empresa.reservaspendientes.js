var client = null;
var notificationSound = null;

soundManager.setup({
    url: '/swf',
    onready: function () {
        notificationSound = soundManager.createSound({
            id: 'notificationSound',
            url: '/sounds/CarHorn.mp3'
        });
    },
    ontimeout: function () {
        alert('Los sonidos no pudieron ser cargados');
    }
});

$(document).ready(function () {
    mostrarLogin();

    $(".actions a").live('click', function () {
        var parent = $(this).parents(".reserva");
        var reservaId = parent.attr("reservaId");

        if ($(this).hasClass("AceptarReserva"))
            aceptarReserva(reservaId, $(this).text());
        else if ($(this).hasClass("CancelarReserva"))
            rechazarReserva(reservaId);
        else if ($(this).hasClass("InvalidarReserva"))
            invalidarReserva(reservaId);
        else
            return;

        parent.hide('slow', function () { $(this).remove(); });
    });
	
	setInterval(notificarReservasPendientes, 30 * 1000);
});

function notificarReservasPendientes()
{
	if ($("div#main div.reserva").size() > 0)
	{
		notificationSound.play();
	}
}

function mostrarLogin() {
    $("#login").modal({
        backdrop: "static",
        keyboard: false,
        show: true
    });

    $("#login #loginAceptar").live('click', function () {
        var contrasena = $("#login #contrasena").val();
        var password = Combis.Crypto.Desencriptar($("#empresaPassword").val());

        if (contrasena == password) {
            $("#login #contrasenaincorrecta").hide();
            $("#login").modal('hide');
            conectar();
        }
        else {
            $("#login #contrasenaincorrecta").show();
        }
    });
}

function conectar() {
    var empresa = $("input[type=hidden]#empresa").val();

    client = io.connect();

    client.on('connected', function (data) {
        $('#main').empty();
        client.emit('registerAsOperator', { empresa: empresa });
    });

    client.on('newReservationRequest', function (reserva) {
        renderReserva(reserva);
        notificationSound.play();
    });
}

function renderReserva(reserva) {
	// Fix dates on Reservation
	reserva.dia = actualizarReservaFecha (reserva);
	if (reserva.type == null) {
		reserva.type = "create";
	}
	
	var source = $("#reserva-" + reserva.type).html();
    var template = Handlebars.compile(source);
    var renderReserva = $(template(reserva));

	if (reserva.horario != null) {
		if (typeof reserva.horario === 'string' ) {
			reserva.horario = [ reserva.horario ];
		}
		
		$.each(reserva.horario, function (index, horario) {
			renderReserva.find("#AceptarReservaHorarios").append("<li><a href='#' class='AceptarReserva'>" + horario + "</a></li>");
			renderReserva.find("#AceptarReservaHorarios").append("<li><a href='#' class='AceptarReserva'>" + horario + " (CONDICIONAL)</a></li>");
		});
	} else {
		renderReserva.find("#AceptarReservaHorarios").append("<li><a href='#' class='AceptarReserva'>" + reserva.horarioAnterior + "</a></li>");
	}
	
    $("#main").append(renderReserva);
}

function actualizarReservaFecha(reserva) {
	var fecha_reserva = null;
	
	var today_day = getDate(new Date());
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	var yesterday_day = getDate(yesterday);
	
	if (reserva.dia == "Hoy")
	{
		if (getDate(new Date(reserva.fecha_generacion)) == today_day)
		{
			fecha_reserva = "Hoy";
		}
		else
		{
			fecha_reserva = getDate(new Date(reserva.fecha_generacion));
		}
	}
	
	if (reserva.dia == "Manana")
	{
		if (getDate(new Date(reserva.fecha_generacion)) == today_day)
		{
			fecha_reserva = "Manana";
		}
		else if (getDate(new Date(reserva.fecha_generacion)) == yesterday_day)
		{
			fecha_reserva = "Hoy";
		}
		else
		{
			fecha_reserva = getDate(new Date(reserva.fecha_generacion));
		}
	}
	
	return fecha_reserva;
}

function getDate (dateObj) {
	
	var day = dateObj.getDate();
	var month = dateObj.getMonth() + 1;
	var year = dateObj.getFullYear();

	return day + "/" + month + "/" + year;
}

function aceptarReserva(reservaId, horarioConfirmado) {
    client.emit('acceptReservationRequest', { id: reservaId, horarioConfirmado: horarioConfirmado });
}

function rechazarReserva(reservaId) {
    client.emit('declineReservationRequest', { id: reservaId });
}

function invalidarReserva(reservaId) {
    client.emit('invalidateReservationRequest', { id: reservaId });
}
