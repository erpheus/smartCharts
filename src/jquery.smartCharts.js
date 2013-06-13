// the semi-colon before function invocation is a safety net against concatenated
// scripts and/or other plugins which may not be closed properly.
;(function ( $, window, document, undefined ) {

		// undefined is used here as the undefined global variable in ECMAScript 3 is
		// mutable (ie. it can be changed by someone else). undefined isn't really being
		// passed in so we can ensure the value of it is truly undefined. In ES5, undefined
		// can no longer be modified.

		// window and document are passed through as local variable rather than global
		// as this (slightly) quickens the resolution process and can be more efficiently
		// minified (especially when both are regularly referenced in your plugin).

		// Create the defaults once
		var pluginName = "smartChart",
			defaults = {
				chart : "pie",
				pie_options : {
					inset: '30%',
					startAngle: 0,
					blankAngle: 30
				}
			};

		// The actual plugin constructor
		function Plugin ( element, options ) {
				this.container = $(element);
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}


		// Data should be specified in this format:
		// [
		//   [ label, first_value, second_value, color ],
		//   [                   ...                   ]
		// ]

		Plugin.prototype = {
				init: function () {
						$(this.container).empty()
						this.canvas = $("<canvas />",{
							id : this.container.attr('id') + "_smartChartCanvas"
						});
						this.canvas.appendTo(this.container);

						var canvas = this.canvas[0];
						canvas.style.width ='100%';
  						canvas.style.height='100%';
						// ...then set the internal size to match
						canvas.width  = canvas.offsetWidth;
						canvas.height = canvas.offsetHeight;


						this.draw();
				},

				draw: function () {
					this.proportions = this.calcProportions(this.settings);

					var context = this.canvas[0].getContext("2d");
					if (this.settings.chart == "pie") {
						this.drawPie(this.canvas[0],context,this.proportions);
					};
				},

				refresh: function (options) {
					this.settings = $.extend( {}, defaults, options );

					this.draw();
				},

				calcProportions: function (settings) {

					var temp;
					var result = [];

					var partialFirstSums = this.partialSumColumn(settings.data,1);
					var sumFirst = partialFirstSums[partialFirstSums.length-1];
					var maxSecond = this.maxOfColumn(settings.data,2);

					for (var i = 0; i < settings.data.length; i++) {
						var item = {};
						if (settings.chart == "pie") {
							item.start = proportionToRadians(partialFirstSums[i]/sumFirst);
							item.end = proportionToRadians(partialFirstSums[i+1]/sumFirst);
							item.color = settings.data[i][3];
							item.size = settings.data[i][2]/maxSecond;
						} else if (settings.chart == "");
						result.push(item);
					};

					return result;
				},

				drawPie: function (canvas, context, proportions){

					context.clearRect(0, 0, canvas.width, canvas.height);

					/* Radius and centering */
					var centerX = Math.floor(canvas.width / 2);
					var centerY = Math.floor(canvas.height / 2);
					var fullRadius = Math.min(centerX,centerY);
					var centerRadius = this.settings.pie_options.inset;
					if (centerRadius.substring) {
						if (centerRadius.match(/%/)) {
							centerRadius = parseFloat(centerRadius) / 100 * fullRadius;
						}else {
							centerRadius = parseFloat(centerRadius);
						}
					};
					var drawableRadius = fullRadius-centerRadius;
					
					/* Start and ending angle */
					var angleOffset = degreesToRadians(-90+this.settings.pie_options.startAngle);
					var angleProportion = (360-this.settings.pie_options.blankAngle)/360
					function updateRadians(radians){
						return (radians * angleProportion) + angleOffset;
					}


					/* Draw the portions of the pie */
					function drawSegment(canvas,context,item){

						context.save();

						context.beginPath();
						context.moveTo(centerX,centerY);
						context.arc(centerX, centerY, centerRadius + item.size*drawableRadius, updateRadians(item.start), updateRadians(item.end), false);
						context.closePath();

						context.fillStyle = item.color;
						context.fill();
						context.restore();

					}

					for (var i = proportions.length - 1; i >= 0; i--) {
						drawSegment(canvas,context,proportions[i]);
					};


					/* Carve the center */
					context.save();

					context.beginPath();
					context.moveTo(centerX,centerY);

					context.arc(centerX,centerY,centerRadius,0,2*Math.PI,false);
					context.closePath();
					context.clip();
					context.clearRect(0, 0, canvas.width, canvas.height);

					context.restore();
				},

				drawBars: function (canvas, context, proportions){

				},

				partialSumColumn: function (data, column) {
					var result = [];
					var temp = 0;
					for (var i = 0; i < data.length; i++) {
						result.push(temp);
						temp += data[i][column];
					};
					result.push(temp);
					return result;
				},

				maxOfColumn: function (data, column) {
					var result = 0;
					for (var i = data.length - 1; i >= 0; i--) {
						var temp = data[i][column];
						if (temp > result) {
							result = temp;
						};
					};
					return result;
				}
		};



		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				return this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}else{
							$.data( this, "plugin_" + pluginName ).refresh(options)
						}
				});
		};


		// Helper functions:
		function proportionToRadians(proportion){
			return proportion*2*Math.PI;
		}

		function degreesToRadians(degrees){
			return proportionToRadians(degrees/360);
		}

})( jQuery, window, document );
