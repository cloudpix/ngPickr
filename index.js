import '@simonwep/pickr/dist/themes/nano.min.css';

(function () {
	'use strict';
	angular.module('ngPickr').component('ngPickr', {
		bindings: {
			ngModel: '<',
			ngDisabled: '<',
			theme: '<',
			swatches: '<',
			onInit: '&',
			onHide: '&',
			onShow: '&',
			onSave: '&',
			onClear: '&',
			onChange: '&',
			onChangeStop: '&',
			onCancel: '&',
			onSwatchSelect: '&'
		},
		template: `<div></div>`,
		controller: NgPickerController,
		controllerAs: 'vm'
	});

	NgPickerController.$inject = ['$timeout', '$element', '$log'];

	function NgPickerController($timeout, $element, $log) {

		const vm = this;
		const el = $($element[0].firstElementChild);

		let picker = null;

		vm.$onInit = () => {

			picker = Pickr.create({
				el: el,
				theme: 'classic', //monolith | nano
				swatches: [],
				components: {
					// Main components
					preview: true,
					opacity: true,
					hue: true,
					// Input / output Options
					interaction: {
						hex: true,
						rgba: true,
						hsla: true,
						hsva: true,
						cmyk: true,
						input: true,
						clear: true,
						save: true
					}
				}
			});
		};

		vm.$onChanges = changesObj => {
		};

	}
})();
