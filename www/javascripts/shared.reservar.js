var client = null;

function conectar() {
    if (client == null) {
        client = io.connect();

//        client.on('reservationRequestOnProcessing', function (reserva) {
//            alert('Su reserva ha sido recibida por la operadora. En breve obtendra la respuesta por aqui. Si cierra la pagina recibira un mail con la respuesta.');
//        });

//        client.on('reservationRequestOnQueue', function (reserva) {
//            alert('Su reserva ha sido recibida aunque no hay ninguna operadora disponible. Le informaremos la respuesta por aqui. Si cierra la pagina recibira un mail con la respuesta.');
//        });

        client.on('reservationRequestAccepted', function (reserva) {
            alert('Su reserva ha sido confirmada. Por favor dirijase a la parada en el horario convenido.');
        });

        client.on('reservationRequestDeclined', function (reserva) {
            alert('Su reserva ha sido rechaza. Por favor intente reservar su lugar en otro ramal/horario.');
        });

        var reservaId = $("#reservaId").val();
        var registerAsClient = {
            reservaId: reservaId
        };
        client.send('registerAsClient', registerAsClient);
    }
}

function reservarCombi(reserva) {
    conectar();
    client.emit('reservationRequest', reserva);
}