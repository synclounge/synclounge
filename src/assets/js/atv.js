// $atv	= $( '.atv' );

// $atv.on( 'mousemove', function( e ) {
// 	var $this		= $( this ),
// 		eX			= e.offsetX,
// 		eY			= e.offsetY,
// 		dim			= this.getBoundingClientRect();
// 		w			= dim.width/2,
// 		h			= dim.height/2,
// 		tiltLimit	= 5,
// 		posX		= ( h - eY ) * ( tiltLimit / h );
// 		posY		= ( w - eX ) * ( tiltLimit / w ) * -1;

// 	$this.find( 'a' ).css({
// 		'transform': 'rotateX( ' + posX + 'deg ) rotateY( ' + posY + 'deg )',
// 		'box-shadow': ( posY * -1 ) + 'px ' + ( posX + 14 ) + 'px 34px 0 rgba( 0, 0, 0, 0.1 )'
// 	});
	
// 	$this.find( '.highlight' ).css({
// 		'opacity': 1,
// 		'transform': 'translate3d( ' + ( posX * -4 ) + 'px, ' + ( posY * -4 ) + 'px, '  + '0 )'
// 	});
// });

// $atv.mouseleave( function( e ) {
// 	var $el = $( this ).find( 'a' );

// 	$el.removeAttr( 'style' ).addClass( 'hover--ending' );

// 	setTimeout( function() {
// 		$el.removeClass( 'hover--ending' );
// 	}, 500 );
	
// 	$el.find( '.highlight' ).removeAttr( 'style' );
// });