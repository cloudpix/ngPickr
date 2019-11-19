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
			onSwatchSelect: '&',
			onButtonClick: '&',
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
		let eventBindings = [];

		vm.$onInit = angular.noop;

		vm.$postLink = () => pickr = Pickr.create(buildSettings())
			.on('init', instance => {

				inlineHide();

				instance.setColor(vm.ngModel || null);

				registerButtonOnClick(instance);
				registerPreventEvents(instance);

				run(vm.onInit, {pickr: instance});

			})
			.on('hide', instance => {

				inlineHide();

				run(vm.onHide, {pickr: instance});

			})
			.on('show', instance => {

				inlineShow();

				run(vm.onShow, {pickr: instance});

			})
			.on('save', (color, instance) => {

				updateModel(color);

				run(vm.onSave, {
					color: color && color.clone(),
					pickr: instance
				});

			}).on('change', (color, instance) => {

				run(vm.onChange, {
					value: colorAsCurrentRepresentation(color),
					hsva: color && color.toHSVA().toString(getPrecision()),
					hsla: color && color.toHSLA().toString(getPrecision()),
					rgba: color && color.toRGBA().toString(getPrecision()),
					hexa: color && color.toHEXA().toString(getPrecision()),
					cmyk: color && color.toCMYK().toString(getPrecision()),
					color: color && color.clone(),
					pickr: instance
				});

			}).on('changestop', instance => {

				if (vm.settings && vm.settings.autoHide) {
					instance.hide();
				}

				run(vm.onChangeStop, {pickr: instance});

			}).on('cancel', instance => {

				run(vm.onCancel, {pickr: instance});

			})
			.on('swatchselect', (color, instance) => run(vm.onChange, {
				color: color && color.clone(),
				pickr: instance
			}));

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

			clearEventBidings();

			pickr.destroy();
			pickr = null;
		};

		function run(f, arg) {
			f && typeof f === 'function' && f(arg);
		}

		function registerButtonOnClick(instance) {

			const button = instance && instance._root && instance._root.button;
			button && addEventBinding(button, 'click', e => {

				preventEventPropagation(e);

				run(vm.onButtonClick, {$event: e, pickr: instance});
			});
		}

		function inlineShow() {
			vm.settings && vm.settings.inline && $(getPickrAppElement()).show();
		}

		function inlineHide() {
			if (!vm.settings || !vm.settings.inline) return;
			$(getPickrAppElement()).hide();
		}

		function addEventBinding(element, event, fun) {
			$(element).on(event, fun);
			eventBindings.push({element, event, fun});
		}

		function registerPreventEvents(instance) {

			const root = instance && instance.getRoot();
			if (!root) return;

			const elements = [];

			root.palette && root.palette.picker && elements.push(root.palette.picker);
			root.palette && root.palette.palette && root.palette.palette.parentElement && elements.push(root.palette.palette.parentElement);
			root.hue && root.hue.picker && elements.push(root.hue.picker);
			root.hue && root.hue.slider && root.hue.slider.parentElement && elements.push(root.hue.slider.parentElement);
			root.opacity && root.opacity.picker && elements.push(root.opacity.picker);
			root.opacity && root.opacity.slider && root.opacity.slider.parentElement && elements.push(root.opacity.slider.parentElement);

			elements.forEach(element => addEventBinding(element, 'click', e => preventEventPropagation(e)));
		}

		function clearEventBidings() {

			try {

				eventBindings.forEach(e => $(e.element).off(e.event, e.fun));
				eventBindings = [];

			} catch (e) {
				$log.error(e);
			}
		}

		function preventEventPropagation(event) {

			if (!event || !vm.settings || !vm.settings.preventEvent) return;

			event.preventDefault && event.preventDefault();
			event.stopPropagation && event.stopPropagation();
			event.stopImmediatePropagation && event.stopImmediatePropagation();
		}

		function getPickrAppElement() {
			return $element[0].querySelector('.pcr-app');
		}

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
