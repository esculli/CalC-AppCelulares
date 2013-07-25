
$(document).ready(function () {
    calculateMapHeight();
    $(window).resize(calculateMapHeight);
});

function calculateMapHeight() {
    var navBar = $(".navbar");
    var map = $("#map_canvas");

    map.height($(window).height() - navBar.height() - 3);
}

$(".info").live("click", function () {
    var parent = $(this).parents(".proximoHorario");
    var isVisible = parent.find(".infoAdicional").is(":visible");

    parent.find(".infoAdicional").slideToggle('slow');
    var letra = parent.data("mark");

    var mark = JSLINQ(horarios)
                .Where(function (x) { return x.letra == letra; })
                .Select(function (x) { return x.mark; })
                .First();

    if (!isVisible) {
        mark.setAnimation(google.maps.Animation.BOUNCE);
    }
    else {
        mark.setAnimation(null);
    }
});

$("button.reservar").live('click', function () {
    var parent = $(this).parents(".proximoHorario");
    var horario = parent.data('item');

    var nombre = parent.find('input[type=text]#nombre').val();
    var email = parent.find('input[type=text]#email').val();

    var reserva = {
        empresa: horario.empresa.Nombre,
        ramal: horario.ramal.Descripcion,
        recorrido: horario.recorrido,
        parada: horario.paradaProxima,
        dia: (horario.horarioSalida > getCurrentTime()) ? "Hoy" : "Mañana",
        horario: horario.horarioSalida,
        
        nombre: nombre,
        email: email
    };

    reservarCombi(reserva);
});
