
$(document).ready(function () {
    //mostrarLogin();
});

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
        }
        else {
            $("#login #contrasenaincorrecta").show();
        }
    });
}
