$(function() {
    function ChangeNozzleViewModel(parameters) {
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
		self.n = Date.now();
		self.oldTime = ko.observable(0);
		self.doExtrude = ko.observable(false);
		
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
            self.changeNozzleDialog.modal("show");
        };

        self.done = ko.pureComputed(function() {
			if ((self.step() == 0) || (self.step() >= 100)) return;
			if (self.step() == 2){
				self.setCurrentToolCommand();
				return;
			}
            self.step(self.step() + 1);
			if (self.step() > 1000) self.changeNozzleDialog.modal("hide");
			if (self.step() > 4){
				self.changeNozzleDialog.modal("hide");
				self.doExtrude(false);
				var data2 = {};
				data2[self.currentTool] = 0;
				self._sendSelToolCommand(data2);
			}
        });

        self.doneEnabled = function() {
			if ((self.step() == 0)|| (self.step() >= 100)) return false;
            return true;
        };
		
		self.sendSelectToolCommand = function (data) {
            if (!data || !data.key()) return;
			if (!self.toolTemp) return;
			var data2 = {};
			self.currentTool = data.key();
            data2[data.key()] = parseInt(self.toolTemp());
			if (data2[data.key()] < 30) return;
			self._sendSelToolCommand(data2);
        };
		
		self._sendSelToolCommand = function (data2) {
			var onSuccess = function() {
                self.step(self.step() + 100);
            };
			self._setToolTemperature(data2)
				.done(onSuccess);
        };
		
		self.setCurrentToolCommand = function (data) {
			if (!self.toolTemp) return;
			var data2 = {};
            data2[self.currentTool] = parseInt(self.toolTemp());
			if (data2[self.currentTool] < 30) return;
			self._sendSelToolCommand(data2);
        };
		
		self.isFirstStep = ko.pureComputed(function () {
            return self.step() == 0;
        });
		
		self.isSecondStep = ko.pureComputed(function () {
			if (self.step()  == 1) {
				OctoPrint.printer.selectTool(self.currentTool);
				OctoPrint.printer.extrude(-100);
				var data2 = {};
				data2[self.currentTool] = 0;
				self._setToolTemperature(data2);
			}
            return self.step() == 1;
        });
		
		self.isThirdStep = ko.pureComputed(function () {
            return self.step() == 2;
        });
		
		self.isFourthStep = ko.pureComputed(function () {
            return self.step() == 3;
        });
		
		self.isFithStep = ko.pureComputed(function () {
			if (self.step()  == 4) self.doExtrude(true);
            return self.step() == 4;
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
			if (self.doExtrude()){
				self.n = Date.now();
				var flow = 5; // mm/sec
				var exLeng = 10; // mm
				var exTime = (exLeng / flow) * 1000;
				exTime = exTime + 1000;
				if ((self.n - exTime) > self.oldTime()){
					log.info("Extrude");
					self.oldTime(self.n + 1);
					OctoPrint.printer.selectTool(self.currentTool);
					OctoPrint.control.sendGcode("G1 E" + exLeng + " F" + (flow * 60));
				}
			}
        };
		
		self._setToolTemperature = function(data) {
            return OctoPrint.printer.setToolTargetTemperatures(data);
        };

        self.onStartup = function() {
            self.changeNozzleDialog = $("#changenozzle_dialog");
        };

        self.onAllBound = function(allViewModels) {
            self.changeNozzleDialog.on('show', function() {
                callViewModels(allViewModels, "onChangeShown");
            });
            self.changeNozzleDialog.on('hidden', function() {
                callViewModels(allViewModels, "onChangeHidden");
            });
        }

    }

    OCTOPRINT_VIEWMODELS.push([
        ChangeNozzleViewModel,
        ["loginStateViewModel", "temperatureViewModel", "settingsViewModel"],
        ["#changenozzle_dialog"]
    ]);
});
