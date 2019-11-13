import '@simonwep/pickr/dist/themes/nano.min.css';
import 'angular';
import Pickr from '@simonwep/pickr';

(function () {
	'use strict';

	angular.module('ngPickr', []);

	angular.module('ngPickr').component('ngPickr', {
		bindings: {
			ngModel: '<',
			ngDisabled: '<',
			settings: '<',
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
		template: `<div class="color-picker"></div>`,
		controller: NgPickerController,
		controllerAs: 'vm'
	});

	NgPickerController.$inject = ['$timeout', '$element', '$log'];

	function NgPickerController($timeout, $element, $log) {

		const vm = this;
		const el = $($element[0].firstElementChild)[0];

		let pickr = null;

		vm.$onInit = () => {
		};

		vm.$postLink = () => {

			pickr = Pickr.create(buildSettings());

			pickr.on('save', hsva => {
				updateModel(hsva);
			});

			if (vm.onChange && (typeof vm.onChange === 'function')) {

				pickr.on('change', hsva => $timeout(() => vm.onChange({
					value: colorAsCurrentRepresentation(hsva),
					hsva: hsva.toHSVA().toString(getPrecision()),
					hsla: hsva.toHSLA().toString(getPrecision()),
					rgba: hsva.toRGBA().toString(getPrecision()),
					hexa: hsva.toHEXA().toString(getPrecision()),
					cmyk: hsva.toCMYK().toString(getPrecision()),
					source: hsva.clone()
				})));
			}
		};

		vm.$onChanges = changes => {

			if (!changes || !pickr) return;

			if (changes.ngDisabled &&
				changes.ngDisabled.previousValue !== changes.ngDisabled.currentValue) {
				changes.ngDisabled.currentValue ? pickr.disable() : pickr.enable();
			}

			if (changes.ngModel &&
				changes.ngModel.previousValue !== changes.ngModel.currentValue) {
				updatePickrColor();
			}
		};

		vm.$onDestroy = () => {

			if (!pickr) return;

			pickr.destroy();
			pickr = null;
		};

		function allColorsFormats(hsva) {
			return !hsva ? null : [
				hsva.toHSVA().toString(getPrecision()),
				hsva.toHSLA().toString(getPrecision()),
				hsva.toRGBA().toString(getPrecision()),
				hsva.toHEXA().toString(getPrecision()),
				hsva.toCMYK().toString(getPrecision()),
			];
		}

		function colorAsCurrentRepresentation(hsva) {

			if (!pickr || !hsva || typeof hsva !== 'object') return;

			switch (pickr.getColorRepresentation()) {
				case 'RGBA':
					return hsva.toRGBA().toString(getPrecision());
				case 'HSVA':
					return hsva.toHSVA().toString(getPrecision());
				case 'HSLA':
					return hsva.toHSLA().toString(getPrecision());
				case 'CMYK':
					return hsva.toCMYK().toString(getPrecision());
				case 'HEXA':
				default:
					return hsva.toHEXA().toString(getPrecision());
			}
		}

		function updatePickrColor() {

			if (!pickr) return;

			const pickrColor = allColorsFormats(pickr.getColor());

			if (pickrColor && pickrColor.length && !pickrColor.find(c => c === vm.ngModel)) {
				pickr.setColor(vm.ngModel);
			}
		}

		function updateModel(newColor) {

			if (!pickr) return;

			const color = newColor || pickr.getSelectedColor();
			vm.ngModel = colorAsCurrentRepresentation(color);
		}

		function getPrecision() {
			return vm && vm.settings && vm.settings.outputPrecision || 0;
		}

		function buildSettings() {
			const options = vm.settings || {};
			return {
				el: el,
				theme: options.theme || 'nano', //classic | monolith
				inline: options.hasOwnProperty('inline') ? options.inline : false,
				autoReposition: options.hasOwnProperty('autoReposition') ? options.autoReposition : true,
				disabled: vm.ngDisabled !== undefined ? vm.ngDisabled : false,
				lockOpacity: options.hasOwnProperty('lockOpacity') ? options.lockOpacity : false,
				outputPrecision: options.outputPrecision || 0,
				comparison: options.hasOwnProperty('comparison') ? options.comparison : false,
				default: options.initialColor || null,
				swatches: options.swatches || null,
				defaultRepresentation: options.defaultRepresentation || 'HEX', //RGBA | HSVA | HSLA | CMKY
				position: options.position || 'bottom-middle',
				adjustableNumbers: options.hasOwnProperty('adjustableNumbers') ? options.adjustableNumbers : true,
				components: {
					palette: options.hasOwnProperty('showPalette') ? options.showPalette : true,
					preview: options.hasOwnProperty('showPreview') ? options.showPreview : true,
					opacity: options.hasOwnProperty('showOpacity') ? options.showOpacity : true,
					hue: options.hasOwnProperty('showHue') ? options.showHue : true,
					interaction: {
						hex: options.hasOwnProperty('showHex') ? options.showHex : true,
						rgba: options.hasOwnProperty('showRgba') ? options.showRgba : true,
						hsla: options.hasOwnProperty('showHsla') ? options.showHsla : false,
						hsva: options.hasOwnProperty('showHsva') ? options.showHsva : false,
						cmyk: options.hasOwnProperty('showCmyk') ? options.showCmyk : false,
						input: options.hasOwnProperty('showInput') ? options.showInput : true,
						clear: options.hasOwnProperty('showClear') ? options.showClear : false,
						save: options.hasOwnProperty('showSave') ? options.showSave : false
					}
				},
				strings: {
					save: options.saveButtonLabel || 'Save',
					clear: options.clearButtonLabel || 'Clear',
					cancel: options.cancelButtonLabel || 'Cancel'
				}
			};
		}

	}
})();
