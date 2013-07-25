
$(document).ready(function () {
    $(".nav select.filtroZona").on("change", filtrarZonas);
    $(".nav select.filtroEmpresa").on("change", filtrarEmpresas);
    $(".nav .filtroSoloProximosHorarios").on("change", filtrarHorarios);

    filtrarZonas();
    filtrarEmpresas();
    filtrarHorarios();
});

function filtrarZonas() {
    var zona = $(".nav select.filtroZona").val();
    $(".zonas").each(function () {
        if (!zona || $(this).data("zona") == zona)
            $(this).show();
        else
            $(this).hide();
    });
}

function filtrarEmpresas() {
    var empresa = $(".nav select.filtroEmpresa").val();
    $(".empresas").each(function () {
        if (!empresa || $(this).data("empresa") == empresa)
            $(this).show();
        else
            $(this).hide();
    });
}

function filtrarHorarios() {
    if ($(".nav .filtroSoloProximosHorarios").prop("checked")) {
        var currentTime = new Date();
        var currentHour = (currentTime.getHours()).toString();
        var currentMinutes = (currentTime.getMinutes()).toString();
        if (currentHour.length == 1) currentHour = "0" + currentHour;
        if (currentMinutes.length == 1) currentMinutes = "0" + currentMinutes;
        $(".horario").each(function () {
            if ($(this).text() < currentHour + ":" + currentMinutes) $(this).hide();
        });
    } else {
        $(".horario").show();
    }
}