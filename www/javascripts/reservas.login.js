function validarSignup() {
    var isValid = true;

    var nombre = $('form#signup input[type=text]#nombre').val();
    var nombreControlGroup = $("form#signup input[type=text]#nombre").parents(".control-group");
    if (nombre == "") {
        isValid &= false;
        nombreControlGroup.addClass("error");
    }
    else {
        nombreControlGroup.removeClass("error");
    }

    var email = $('form#signup input[type=text]#email').val();
    var emailControlGroup = $("form#signup input[type=text]#email").parents(".control-group");
    if (email == "") {
        isValid &= false;
        emailControlGroup.addClass("error");
    }
    else {
        emailControlGroup.removeClass("error");
    }

    var email = $('form#signup input[type=password]#contrasena').val();
    var emailControlGroup = $("form#signup input[type=password]#contrasena").parents(".control-group");
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