$(function() {
    function ChangeViewModel(parameters) {
        var self = this;

        self.loginState = parameters[0];
		self.temperatureViewModel = parameters[1];
		self.settingsViewModel = parameters[2];
		
		self.toolTemp = ko.observable(0);
		
		self.temperature_profiles = self.settingsViewModel.temperature_profiles;
		self.tools = self.temperatureViewModel.tools;
		
		self.step = ko.observable(0);
		self.currentTool = "";
		self.actual = ko.observable(0.0);
		
		self.setTargetFromProfile = function(item, profile) {
            if (!profile) return;
			self.toolTemp(profile.extruder);
        };

        self.show = function(user) {
            if (!CONFIG_ACCESS_CONTROL) return;
            if (user == undefined) {
                user = self.loginState.currentUser();
            }
			 self.step(0);
            self.changeDialog.modal("show");
        };

        self.done = function() {
            self.step(self.step() + 1);
			if (self.step() > 1000) self.changeDialog.modal("hide");
        };

        self.doneEnabled = function() {
			if ((self.step == 0) || (self.step == 2)) return false;
            return true;
        };
		
		self.sendSelectToolCommand = function (data) {
            if (!data || !data.key()) return;
			if (!self.toolTemp) return;
			var data2 = {};
			self.currentTool = data.key();
            data2[data.key()] = parseInt(self.toolTemp());
			if (data2[data.key()] < 30) return;
			var onSuccess = function() {
                self.step(self.step() + 100);
            };
			self._setToolTemperature(data2)
				.done(onSuccess);
        };
		
		self.isFirstStep = ko.pureComputed(function () {
            return self.step() == 0;
        });
		
		self.isSecondStep = ko.pureComputed(function () {
			OctoPrint.printer.selectTool(self.currentTool);
			OctoPrint.printer.setFlowrate(10);
			OctoPrint.printer.extrude(-20);
            return self.step() == 1;
        });
		
		self.isThirdStep = ko.pureComputed(function () {
            return self.step() == 2;
        });
		
		self.isFourthStep = ko.pureComputed(function () {
            return self.step() == 3;
        });
		
		self.isHeatingStep = ko.pureComputed(function () {
            return self.step() >= 100;
        });
		
		self.fromCurrentData = function(data) {
			self.tools().forEach(function(element) {
				if(element.key() == self.currentTool){
					if((element.actual()>(self.toolTemp() - 2.0)) && (self.step() >= 100)){
						self.step(self.step() - 99);
					}
					self.actual(element.actual());
				}
			});
        };
		
		self._setToolTemperature = function(data) {
            return OctoPrint.printer.setToolTargetTemperatures(data);
        };

        self.onStartup = function() {
            self.changeDialog = $("#change_dialog");
        };

        self.onAllBound = function(allViewModels) {
            self.changeDialog.on('show', function() {
                callViewModels(allViewModels, "onChangeShown");
            });
            self.changeDialog.on('hidden', function() {
                callViewModels(allViewModels, "onChangeHidden");
            });
        }

    }

    OCTOPRINT_VIEWMODELS.push([
        ChangeViewModel,
        ["loginStateViewModel", "temperatureViewModel", "settingsViewModel"],
        ["#change_dialog"]
    ]);
});
