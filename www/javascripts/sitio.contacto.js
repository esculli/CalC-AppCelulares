function validarContacto() {
    var isValid = true;

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

    var email = $('textarea#comentarios').val();
    var emailControlGroup = $("textarea#comentarios").parents(".control-group");
    if (email == "") {
        isValid &= false;
        emailControlGroup.addClass("error");
    }
    else {
        emailControlGroup.removeClass("error");
    }

    if (isValid) {
        return true;
    }
    else {
        return false;
    }
}