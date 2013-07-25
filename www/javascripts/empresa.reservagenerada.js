var tiempo = 99;
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
    mostrarPanel('procesandoReserva');
    setInterval(refrescarTiempoEstimado, 1000);
    conectar();
});

function refrescarTiempoEstimado() {
    var d = new Date(0, 0, 0, 0, tiempo);
    $("#tiempoEstimado").text(getStringTime(d));

    if (tiempo > 0) {
        tiempo--;
    }
}

function getStringTime(date) {
    var hours = date.getHours().toString();
    var minutes = date.getMinutes().toString();
    if (hours.length == 1) hours = "0" + hours;
    if (minutes.length == 1) minutes = "0" + minutes;
    return hours + ":" + minutes;
}

function conectar() {
    if (client == null) {
        client = io.connect(null, { 'sync disconnect on unload': true });
		
		client.on('connected', function (reserva) {
			var reservaId = $("#reservaId").val();
			client.emit('registerAsClient', {
				reservaId: reservaId
			});
		});
		
		
        client.on('reservationRequestAccepted', function (reserva) {
            mostrarPanel('reservaConfirmada');
            $('#reservaConfirmada').find('#horarioConfirmado').text(reserva.horarioConfirmado);
            
            notificationSound.play();
        });

        client.on('reservationRequestDeclined', function (reserva) {
            mostrarPanel('reservaRechazada');
            notificationSound.play();
        });

        client.on('reservationRequestInvalidated', function (reserva) {
            mostrarPanel('reservaInvalidada');
            notificationSound.play();
        });        
		
		
    }
}

function mostrarPanel(panelVisible) {
    $('#procesandoReserva').hide();
    $('#reservaConfirmada').hide();
    $('#reservaRechazada').hide();
    $('#reservaInvalidada').hide();

    $('#' + panelVisible).show();
}