
$(document).ready(function () {
    Combis.Empresa.CargaDatos.Cargar();
});

var Combis = Combis || {};
Combis.Empresa = Combis.Empresa || {};

Combis.Empresa.CargaDatos = Combis.Empresa.CargaDatos || {
    ramalTemplate: null,
	map: null,
	data: null,
	marks: [],
	store: null,
    isDirty: false,

    Cargar: function () {
        var ramalSourceTemplate = $("#ramalTemplate").html();
        this.ramalTemplate = Handlebars.compile(ramalSourceTemplate);

        Combis.Empresa.CargaDatos.isDirty = false;
        $("input[type=text]").live('change', function () {
            Combis.Empresa.CargaDatos.isDirty = true;
        });

	    var empresaParam = $("#empresa").val();
	    var url = '/' + empresaParam + '/cargadatos/datos';

	    $(window).bind('beforeunload', function () {
	        if (Combis.Empresa.CargaDatos.isDirty) {
	            return 'Hay datos sin guardar, ¿Está seguro que quiere abandonar la página y perder los cambios? Puede guardar los cambios haciendo click en "Guardar".';
	        }
	    });

	    $.ajaxSetup({ cache: false });
	    $.get(url, function (result) {
	        var data = Combis.Crypto.Desencriptar(result);
	        if (data == null) return;

	        $("#nombre").val(data.Nombre);
	        $("#telefono").val(data.Telefono);
	        $("#precioAbono").val(data.Precio.Abono);
	        $("#precioMedioAbono").val(data.Precio.MedioAbono);
	        $("#precioEventual").val(data.Precio.Eventual);

	        if (data.Recorridos != null) {
	            if (data.Recorridos.Ida != null) {
	                for (i in data.Recorridos.Ida) {
	                    var recorrido = data.Recorridos.Ida[i];
	                    Combis.Empresa.CargaDatos.AgregarRamal('Ida', recorrido);
	                }
	            }
	            if (data.Recorridos.Vuelta != null) {
	                for (i in data.Recorridos.Vuelta) {
	                    var recorrido = data.Recorridos.Vuelta[i];
	                    Combis.Empresa.CargaDatos.AgregarRamal('Vuelta', recorrido);
	                }
	            }
	        }
	    });
	},

	Guardar: function () {
	    var data = {};
	    data.Nombre = $("#nombre").val();
	    data.Telefono = $("#telefono").val();
	    data.Precio = {};
	    data.Precio.Abono = $("#precioAbono").val();
	    data.Precio.MedioAbono = $("#precioMedioAbono").val();
	    data.Precio.Eventual = $("#precioEventual").val();

	    data.Recorridos = {};
	    data.Recorridos.Ida = [];
	    data.Recorridos.Vuelta = [];
	    this.GuardarRamales ('Ida', data.Recorridos.Ida);
	    this.GuardarRamales('Vuelta', data.Recorridos.Vuelta);

	    var empresaParam = $("#empresa").val();
	    var url = '/' + empresaParam + '/cargadatos/datos';
	    $.post(url, { data: Combis.Crypto.Encriptar(data) }, function (result) {
	        alert('Los datos han sido guardados exitosamente.');
	        Combis.Empresa.CargaDatos.isDirty = false;
	        window.location.replace("/");
	    });
	},

	AgregarRamal: function (tipo, recorrido) {
	    var templateData = {};
	    if (recorrido != null) {
	        if (recorrido.Descripcion != null) templateData.Descripcion = recorrido.Descripcion;
            if (recorrido.Horarios != null) templateData.Horarios = recorrido.Horarios.join(', ');
            if (recorrido.Paradas != null) {
                if (recorrido.Paradas.Ascenso != null) templateData.ParadasAscenso = recorrido.Paradas.Ascenso.join(';');
                if (recorrido.Paradas.Descenso != null) templateData.ParadasDescenso = recorrido.Paradas.Descenso.join(';');
            }
	    }

	    var scroll = window.pageYOffset;
	    $("#ramales" + tipo).append(this.ramalTemplate(templateData));
	    window.scrollTo(0, scroll);
	},

	GuardarRamales : function (tipo, store) {
	    $("#ramales" + tipo + " div.ramal").each (function () {
	        var recorrido = {};
	        recorrido.Descripcion = $(this).find(".descripcion").val();
	        recorrido.Horarios = [];
	        
	        var horarios = $(this).find(".horariosStore").val().split(",");
	        for (i in horarios) {
	            if (horarios[i] != "") recorrido.Horarios.push (horarios[i].replace(/^\s+|\s+$/g, ""));
	        }

	        recorrido.Paradas = {};
	        recorrido.Paradas.Ascenso = [];
	        Combis.Empresa.CargaDatos.GuardarRamalParadas($(this), 'Ascenso', recorrido.Paradas.Ascenso);
	        
	        recorrido.Paradas.Descenso = [];
	        Combis.Empresa.CargaDatos.GuardarRamalParadas($(this), 'Descenso', recorrido.Paradas.Descenso);

	        store.push(recorrido);
	    });
	},

	GuardarRamalParadas: function (ramal, tipoParada, store) {
	    var paradas = ramal.find(".paradas" + tipoParada + "Store").val().split(";");
        for (i in paradas) {
            if (paradas[i] != "") {
                var parada = paradas[i].split(',');
                store.push([parseFloat(parada[0]), parseFloat(parada[1]), parada[2]]);
            }
        }
    },

	MostrarHorarios: function (horariobutton) {
		$("#horarios").modal();
		this.store = $(horariobutton).siblings(".horariosStore");
		$("#horarios textarea").val(this.store.val());
	},

	GuardarHorarios: function () {
		$("#horarios").modal('hide');
		this.store.val($("#horarios textarea").val());
		this.store = null;
		Combis.Empresa.CargaDatos.isDirty = true;
	},

	MostrarParadas: function (paradasbutton, tipo) {
	    $("#paradas").modal();
	    $("#paradas div.modal-header h3").text("Paradas de " + tipo);

		this.store = $(paradasbutton).siblings(".paradas" + tipo + "Store");

		this.InicializarMapa();
		this.clearMap();
		this.DibujarParadas(this.store.val());
	},

	GuardarParadas: function () {
		$("#paradas").modal('hide');

		var paradasText = "";
		for (var i = 0; i <= this.marks.length - 1; i++) {
			var parada = this.marks[i].getPosition();
			paradasText += parada.lat() + "," + parada.lng() + "," + $("#paradaNombre" + (i + 1)).val() + ";";
		}

		this.store.val(paradasText);
		this.store = null;
		Combis.Empresa.CargaDatos.isDirty = true;
	},

	InicializarMapa: function () {
		var latlng = new google.maps.LatLng(-34.603718, -58.381584);
		var myOptions = {
			zoom: 15,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById("map_paradas"), myOptions);

		google.maps.event.addListener(this.map, 'click', function (event) {
			Combis.Empresa.CargaDatos.addMark(event.latLng, "");
		});
	},

	DibujarParadas: function (paradasText) {

		var paradasSplit = paradasText.split(";");

		for (var i = 0; i <= paradasSplit.length - 1; i++) {
			var paradaText = paradasSplit[i];

			if (paradaText != "") {
				var parada = paradaText.split(",");

				var latlng = new google.maps.LatLng(parada[0], parada[1]);
				Combis.Empresa.CargaDatos.addMark(latlng, parada[2]);
			}
		}

		this.centerMap();
	},

	addMark: function (latlng, paradaNombre) {
		var markNumber = (this.marks.length + 1);
		var icon = 'http://googlemapsmarkers.com/v1/' + markNumber + '/FE7E73/';

		var mark = new google.maps.Marker({
			position: latlng,
			icon: icon,
			draggable: true,
			map: Combis.Empresa.CargaDatos.map
		});
		
		var html = "<div><div style='display: inline-block; width: 22px; margin-left: 3px;'>" + markNumber + " - </div><input type='text' id='paradaNombre" + markNumber + "' class='paradaNombre' style='width: 140px; display: inline-block;' title='Nombre Parada' value='" + paradaNombre + "' /></div>";
		
		$("#list_paradas").append(html);
		
		google.maps.event.addListener(mark, 'dblclick', function (event) {
			mark.setMap(null);
			Combis.Empresa.CargaDatos.marks.splice(Combis.Empresa.CargaDatos.marks.indexOf(mark), 1);

			for (var i = 0; i <= Combis.Empresa.CargaDatos.marks.length - 1; i++) {
				var icon = 'http://googlemapsmarkers.com/v1/' + (i + 1) + '/FE7E73/';
				Combis.Empresa.CargaDatos.marks[i].setIcon(icon);
			}
		});

		this.marks.push(mark);
	},

	centerMap: function () {
		if (this.marks.length == 0) return;

		var bound = new google.maps.LatLngBounds();
		for (i in this.marks) {
			bound.extend(this.marks[i].getPosition());
		}

		this.map.fitBounds(bound);
		this.map.setCenter(bound.getCenter());
	},

	clearMap: function () {
		$("#list_paradas").empty();
		if (this.marks != null) {
			$.each(this.marks, function (key, mark) {
				mark.setMap(null);
			});

			this.marks = [];
		}
	}
}