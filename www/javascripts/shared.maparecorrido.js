
var Combis = Combis || {};

Combis.MapaRecorrido = Combis.MapaRecorrido || {
	map: null,
	data: null,
	marks: [],
	routes: [],

	Cargar: function () {
	    if (Combis.MapaRecorrido.data == null) {
	        $.ajaxSetup({ cache: false });
	        $.get("/sitio.data", function (result) {
	            Combis.MapaRecorrido.data = result;
	        });
		}
	},

	Mostrar: function (zona, empresa, recorrido, idavuelta) {
		$("#maparecorrido").modal();
		$("#maparecorrido h4#recorrido").text(recorrido);

		this.InicializarMapa();
		this.clearMap();
		this.DibujarParadas(this.ObtenerParadas(zona, empresa, recorrido, idavuelta));
	},

	InicializarMapa: function () {
		var latlng = new google.maps.LatLng(-34.603718, -58.381584);
		var myOptions = {
			zoom: 15,
			center: latlng,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		this.map = new google.maps.Map(document.getElementById("map_maparecorrido"), myOptions);
	},

	ObtenerParadas: function(zona, empresa, recorrido, idavuelta) {
	    var zona = JSLINQ(this.data.Zonas).
                        Where(function (x) { return x.Zona == zona; }).First();
	    
	    var empresa = JSLINQ(zona.Empresas).
	                    Where(function (x) { return x.Nombre == empresa; }).First();

	    var recorrido = JSLINQ(empresa.Recorridos).
                        Where(function (x) { return x.Descripcion == recorrido; }).First();

	    if (idavuelta == "ida") {
	        return recorrido.Ida.Paradas;
	    } else {
	        return recorrido.Vuelta.Paradas;
	    }
              
        //.Empresas[0].Recorridos[0].Ida.Paradas;
	},

	DibujarParadas: function (paradas) {
		
		var prevParada = null;

		for (var i = 0; i <= paradas.length - 1; i++) {
			var parada = paradas[i];
			
			var paradaNombre = ""
			if (parada.length > 2) {
				paradaNombre = parada[2];
			}
			

			var latlng = new google.maps.LatLng(parada[0], parada[1]);

			Combis.MapaRecorrido.addMark(latlng, paradaNombre);
			//Combis.MapaRecorrido.drawRoute(prevParada, latlng);
			prevParada = latlng;
		}

		Combis.MapaRecorrido.centerMap();
	},

	addMark: function(latlng, paradaNombre) {
		var mark = new google.maps.Marker({
		    position: latlng,
			map: Combis.MapaRecorrido.map,
			title: paradaNombre
		});
		Combis.MapaRecorrido.marks.push(mark);
	},

	//drawRoute: function (origin, destination) {
	//	if (origin == null) {
	//		return;
	//	}
	//	var directionServices = new google.maps.DirectionsService();
	//	directionServices.route({ origin: origin, destination: destination, travelMode: google.maps.TravelMode.DRIVING },
	//	function (response, status) {
	//		if (status == google.maps.DirectionsStatus.OK) {
	//			var directionsDisplay = new google.maps.DirectionsRenderer({ suppressMarkers: true, map: Combis.MapaRecorrido.map, preserveViewport: true });
	//			directionsDisplay.setDirections(response);
	//			Combis.MapaRecorrido.routes.push(directionsDisplay);
	//		}
	//	});
	//},

	centerMap: function () {
		if (Combis.MapaRecorrido.marks.length == 0) return;

		var bound = new google.maps.LatLngBounds();
		for (i in Combis.MapaRecorrido.marks) {
			bound.extend(Combis.MapaRecorrido.marks[i].getPosition());
		}

		Combis.MapaRecorrido.map.fitBounds(bound);
		Combis.MapaRecorrido.map.setCenter(bound.getCenter());
	},

    clearMap: function() {
        if (this.marks != null) {
            $.each(this.marks, function (key, mark) {
                mark.setMap(null);
            });

            this.marks = [];
        }
    }
}

Combis.MapaRecorrido.Cargar();









// # Twitter Bootstrap modal responsive fix by @niftylettuce
//  * resolves #407, #1017, #1339, #2130, #3361, #3362, #4283
//   <https://github.com/twitter/bootstrap/issues/2130>
//  * built-in support for fullscreen Bootstrap Image Gallery
//    <https://github.com/blueimp/Bootstrap-Image-Gallery>

// **NOTE:** If you are using .modal-fullscreen, you will need
//  to add the following CSS to `bootstrap-image-gallery.css`:
//
//  @media (max-width: 480px) {
//    .modal-fullscreen {
//      left: 0 !important;
//      right: 0 !important;
//      margin-top: 0 !important;
//      margin-left: 0 !important;
//    }
//  }
//

var adjustModal = function ($modal) {
	var top;
	if ($(window).width() <= 480) {
		if ($modal.hasClass('modal-fullscreen')) {
			if ($modal.height() >= $(window).height()) {
				top = $(window).scrollTop();
			} else {
				top = $(window).scrollTop() + ($(window).height() - $modal.height()) / 2;
			}
		} else if ($modal.height() >= $(window).height() - 10) {
			top = $(window).scrollTop() + 10;
		} else {
			top = $(window).scrollTop() + ($(window).height() - $modal.height()) / 2;
		}
	} else {
		top = '50%';
		if ($modal.hasClass('modal-fullscreen')) {
			$modal.stop().animate({
				marginTop: -($modal.outerHeight() / 2)
			  , marginLeft: -($modal.outerWidth() / 2)
			  , top: top
			}, "fast");
			return;
		}
	}
	$modal.stop().animate({ 'top': top }, "fast");
};

var show = function () {
	var $modal = $(this);
	adjustModal($modal);
};

var checkShow = function () {
	$('.modal').each(function () {
		var $modal = $(this);
		if ($modal.css('display') !== 'block') return;
		adjustModal($modal);
	});
};

var modalWindowResize = function () {
	$('.modal').not('.modal-gallery').on('show', show);
	$('.modal-gallery').on('displayed', show);
	checkShow();
};

$(modalWindowResize);
$(window).resize(modalWindowResize);
$(window).scroll(checkShow);